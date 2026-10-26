#!/usr/bin/env python3
"""Cuantiza el bundle ONNX de Laya a int8 con bloques de 32 pesos.

El script es reproducible y no depende del repositorio de nadie: parte de un
bundle fp32 (los mismos archivos que descarga `alvaress install`) y escribe un
bundle int8 con la misma estructura, listo para usarse con `laya.modelDir`.

Qué cuantiza:

* Las 120 matrices de `MatMul` cuyo peso es un initializer 2D, con
  `MatMulNBits` (bits=8, block_size=32, simétrico). Son ~1.47 GB de los 1.69 GB
  del bundle.
* La tabla de embeddings `m.encoder.embeddings.tok_embeddings.weight`, con
  `GatherBlockQuantized` uint8 (bits=8, block_size=32). Son otros 206 MB que
  `MatMulNBitsQuantizer` no toca porque su soporte de `Gather` solo implementa
  4 bits.

Los pesos pequeños (biases, normas, cabezas de atención transpuestas) se quedan
en fp32: son ~10 MB y cuantizarlos no compensa el riesgo.

Uso:

    python scripts/quantize-laya.py \
        --source ~/.cache/alvaress/laya-onnx/<revision> \
        --output ~/.cache/alvaress/laya-onnx-int8/<revision>

Requiere `onnx`, `onnxruntime` y `numpy`. El propio repo trae un venv de
cuantización en `~/.cache/alvaress/quant-venv` cuando se preparó el artefacto.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path

import numpy as np
import onnx
from onnx import TensorProto, helper, numpy_helper
from onnxruntime.quantization.matmul_nbits_quantizer import MatMulNBitsQuantizer

EMBEDDING_TENSOR = "m.encoder.embeddings.tok_embeddings.weight"
COPY_FILES = ("laya_config.json", "tokenizer/tokenizer.json", "tokenizer/tokenizer_config.json")
MANIFEST_NAME = "laya_int8.json"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def quantize_matmuls(
    model: onnx.ModelProto, bits: int, block_size: int, accuracy_level: int | None
) -> onnx.ModelProto:
    quantizer = MatMulNBitsQuantizer(
        model,
        bits=bits,
        block_size=block_size,
        is_symmetric=True,
        op_types_to_quantize=("MatMul",),
    )
    quantizer.process()
    quantized = quantizer.model.model
    if accuracy_level is not None:
        for node in quantized.graph.node:
            if node.op_type == "MatMulNBits":
                node.attribute.append(helper.make_attribute("accuracy_level", accuracy_level))
    return quantized


def quantize_embedding(model: onnx.ModelProto, block_size: int) -> dict[str, int] | None:
    """Sustituye el Gather de embeddings por GatherBlockQuantized uint8.

    `GatherBlockQuantized` con data uint8 exige `gather_axis=0` y
    `quantize_axis` igual a la última dimensión. Sin `zero_points`, el kernel usa
    2^(bits-1) = 128, que es justo el offset de nuestra cuantización simétrica.
    """
    graph = model.graph
    tensor = next((item for item in graph.initializer if item.name == EMBEDDING_TENSOR), None)
    if tensor is None:
        return None

    weights = numpy_helper.to_array(tensor)
    if weights.ndim != 2:
        raise SystemExit(f"{EMBEDDING_TENSOR} no es una matriz 2D: {weights.shape}")
    rows, columns = weights.shape
    if columns % block_size != 0:
        raise SystemExit(
            f"La última dimensión de {EMBEDDING_TENSOR} ({columns}) no es múltiplo de {block_size}."
        )

    blocks = weights.reshape(rows, columns // block_size, block_size).astype(np.float32)
    max_abs = np.max(np.abs(blocks), axis=2, keepdims=True)
    scales = np.where(max_abs == 0.0, 1.0, max_abs / 127.0).astype(np.float32)
    quantized = np.rint(blocks / scales).clip(-127, 127).astype(np.int16) + 128
    quantized = quantized.astype(np.uint8).reshape(rows, columns)

    data_name = f"{EMBEDDING_TENSOR}_int8"
    scales_name = f"{EMBEDDING_TENSOR}_int8_scales"
    graph.initializer.remove(tensor)
    graph.initializer.extend(
        [
            numpy_helper.from_array(quantized, data_name),
            numpy_helper.from_array(scales.reshape(rows, columns // block_size), scales_name),
        ]
    )

    replaced = 0
    for node in graph.node:
        if node.op_type != "Gather" or node.input[0] != EMBEDDING_TENSOR:
            continue
        node.op_type = "GatherBlockQuantized"
        node.domain = "com.microsoft"
        node.input[0] = data_name
        node.input.extend([scales_name])
        del node.attribute[:]
        for name, value in (
            ("gather_axis", 0),
            ("quantize_axis", 1),
            ("block_size", block_size),
            ("bits", 8),
        ):
            node.attribute.append(helper.make_attribute(name, value))
        replaced += 1

    if replaced == 0:
        raise SystemExit(f"No se encontró ningún nodo Gather que leyera {EMBEDDING_TENSOR}.")
    if not any(opset.domain == "com.microsoft" for opset in model.opset_import):
        model.opset_import.append(helper.make_opsetid("com.microsoft", 1))

    return {
        "rows": rows,
        "columns": columns,
        "blocks_per_row": columns // block_size,
        "quantized_bytes": int(quantized.nbytes),
        "scales_bytes": int(scales.nbytes),
    }


def count_nodes(model: onnx.ModelProto) -> dict[str, int]:
    counts: dict[str, int] = {}
    for node in model.graph.node:
        counts[node.op_type] = counts.get(node.op_type, 0) + 1
    return dict(sorted(counts.items(), key=lambda item: item[1], reverse=True))


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", required=True, type=Path, help="bundle fp32 de origen")
    parser.add_argument("--output", required=True, type=Path, help="directorio del bundle int8")
    parser.add_argument("--bits", type=int, default=8, choices=(8,), help="bits por peso (solo 8)")
    parser.add_argument("--block-size", type=int, default=32, help="tamaño de bloque (potencia de 2)")
    parser.add_argument(
        "--accuracy-level",
        type=int,
        default=4,
        choices=(0, 1, 4),
        help="accuracy_level de MatMulNBits: 4 usa GEMM int8 (más rápido), 1 deja fp32",
    )
    parser.add_argument(
        "--embedding-block-size",
        type=int,
        default=32,
        help="tamaño de bloque para la tabla de embeddings (potencia de 2)",
    )
    parser.add_argument(
        "--keep-fp32-embedding",
        action="store_true",
        help="no cuantizar la tabla de embeddings (artefacto ~620 MB en vez de ~490 MB)",
    )
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    source: Path = args.source.resolve()
    output: Path = args.output.resolve()

    model_path = source / "laya.onnx"
    if not model_path.is_file():
        raise SystemExit(f"Falta {model_path}. Descarga primero el bundle fp32 con `alvaress install`.")
    for name in COPY_FILES:
        if not (source / name).is_file():
            raise SystemExit(f"Falta {source / name}.")

    if output == source:
        raise SystemExit("El directorio de salida no puede ser el de origen.")
    output.mkdir(parents=True, exist_ok=True)
    data_path = output / "laya.onnx.data"
    if data_path.exists():
        data_path.unlink()

    print(f"→ Cargando {model_path} (con datos externos)…", flush=True)
    model = onnx.load(model_path, load_external_data=True)

    print(f"→ Cuantizando MatMul a int{args.bits} block-{args.block_size}…", flush=True)
    model = quantize_matmuls(model, args.bits, args.block_size, args.accuracy_level)

    embedding = None
    if args.keep_fp32_embedding:
        print("→ Embeddings: se conservan en fp32", flush=True)
    else:
        print(
            f"→ Cuantizando embeddings con GatherBlockQuantized block-{args.embedding_block_size}…",
            flush=True,
        )
        embedding = quantize_embedding(model, args.embedding_block_size)

    print(f"→ Guardando {output / 'laya.onnx'}…", flush=True)
    onnx.save_model(
        model,
        output / "laya.onnx",
        save_as_external_data=True,
        all_tensors_to_one_file=True,
        location=data_path.name,
        size_threshold=1024,
    )
    if data_path.exists():
        data_path.chmod(0o644)

    for name in COPY_FILES:
        destination = output / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source / name, destination)

    files = {}
    total = 0
    for path in sorted(output.rglob("*")):
        if path.is_file() and path.name != MANIFEST_NAME:
            size = path.stat().st_size
            total += size
            files[str(path.relative_to(output))] = {"bytes": size, "sha256": sha256_file(path)}

    manifest = {
        "format": 1,
        "kind": "laya-onnx-int8-block32",
        "source": source.name,
        "bits": args.bits,
        "block_size": args.block_size,
        "accuracy_level": args.accuracy_level,
        "is_symmetric": True,
        "matmul_op": "MatMulNBits",
        "embedding_op": None if embedding is None else "GatherBlockQuantized",
        "embedding": embedding,
        "nodes": count_nodes(model),
        "files": files,
        "total_bytes": total,
    }
    (output / MANIFEST_NAME).write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print()
    print(f"Listo: {output}")
    print(f"Total: {total / 1e6:.1f} MB")
    for name, info in files.items():
        print(f"  {info['bytes'] / 1e6:9.1f} MB  {name}  {info['sha256']}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
