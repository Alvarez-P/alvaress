# Artefacto int8 de Laya

`scripts/quantize-laya.py` convierte el bundle fp32 de Laya en un bundle int8
con pesos de 8 bits y bloques de 32. El artefacto pesa **488 MB** frente a los
**1.69 GB** del original (3.5× menos) y mantiene las decisiones del modelo.

Este documento describe cómo se genera, cómo se verifica y cómo se usa. La
publicación como release asset todavía no se ha hecho: falta confirmación
explícita.

## Qué cuantiza

| Parte | Nodos | Operador | Tamaño fp32 | Tamaño int8 |
| --- | ---: | --- | ---: | ---: |
| Matrices de `MatMul` | 120 | `com.microsoft.MatMulNBits` | ~1.47 GB | ~413 MB |
| Tabla de embeddings | 1 | `com.microsoft.GatherBlockQuantized` | 206 MB | ~58 MB |
| Resto (biases, normas, cabezas) | — | fp32 | ~10 MB | ~10 MB |

- `MatMulNBits`: `bits=8`, `block_size=32`, cuantización simétrica y
  `accuracy_level=4`. El nivel 4 usa el GEMM int8 de MLAS; sin él, ONNX Runtime
  descomprime los pesos a fp32 en cada pasada y la inferencia es más lenta.
- `GatherBlockQuantized`: `uint8`, `bits=8`, `block_size=32`,
  `gather_axis=0`, `quantize_axis=1`. Sin `zero_points`, el kernel usa 128, que
  coincide con el offset de la cuantización simétrica.
- Los 62 `MatMul` cuyo peso no es un initializer 2D se quedan en fp32. Son
  ~10 MB y cuantizarlos obligaría a reescribir subgrafos con `Transpose`.

El manifiesto `laya_int8.json` que escribe el script contiene el tamaño y el
SHA-256 de cada archivo. `verifyBundle` lo detecta y valida contra él, así que
`laya.modelDir` puede apuntar al bundle int8 sin cambios de código.

## Regenerar el artefacto

Requisitos: Python 3.10+, `onnx`, `onnxruntime` y `numpy`. El repo usó un venv
aparte para no ensuciar el entorno:

```bash
uv venv --python 3.12 ~/.cache/alvaress/quant-venv
uv pip install --python ~/.cache/alvaress/quant-venv/bin/python onnx onnxruntime numpy onnx-ir
```

El bundle fp32 de origen es el que descarga `alvaress install`:

```bash
~/.cache/alvaress/quant-venv/bin/python scripts/quantize-laya.py \
  --source ~/.cache/alvaress/laya-onnx/d42786bdff8a7550316339c5fbf8f46caa83ea1b \
  --output ~/.cache/alvaress/laya-onnx-int8/d42786bdff8a7550316339c5fbf8f46caa83ea1b
```

Opciones útiles:

- `--block-size 128` reduce el tamaño del artefacto a ~456 MB y las escalas,
  pero se midió con más ruido y no mejoró la latencia de forma consistente.
  El valor aprobado es 32.
- `--accuracy-level 1` deja el GEMM en fp32 (más lento). El valor por defecto,
  4, fue el que se validó.
- `--keep-fp32-embedding` deja la tabla de embeddings sin cuantizar (~620 MB).
  Solo sirve para comparar.

El script tarda unos 6 segundos y usa ~3 GB de RAM: carga el modelo fp32
completo, cuantiza y guarda con datos externos en un único `laya.onnx.data`.

## Identidad del artefacto

Generado el 2026-10-25 desde la revisión
`d42786bdff8a7550316339c5fbf8f46caa83ea1b`. Total: **488 155 666 bytes**.

| Archivo | Bytes | SHA-256 |
| --- | ---: | --- |
| `laya.onnx` | 3 566 207 | `e28e277e55aa52f9b1671525a9a9b2d82fe506da7aabbc99a32f16b3990371e2` |
| `laya.onnx.data` | 481 005 568 | `4d8dc2f06691a2a44380e31347baeedb978dd9ded74afffee4624ba391095e5b` |
| `laya_config.json` | 355 | `c4fab3dd16b6ffdb432ae99334c77fca31e1b4beb0b81be76ca45f707709706a` |
| `tokenizer/tokenizer.json` | 3 583 228 | `6c8aaa9a542084f2457eab775d4eeb51f92a70c0fd9de28d5edb0ddec3c08d30` |
| `tokenizer/tokenizer_config.json` | 308 | `50044de60daaa73df97d262e15a40d4faf0160e7d742df64b377877a1320dd12` |

El manifiesto `laya_int8.json` del directorio es la fuente de verdad; esta tabla
es un resumen para revisar el asset antes de publicarlo.

## Verificación

```bash
# Comprobación barata (tamaños) y profunda (SHA-256) contra el manifiesto.
node -e "import('./dist/decision/vendor/laya/index.js').then(async (m) => {
  const dir = process.env.HOME + '/.cache/alvaress/laya-onnx-int8/d42786bdff8a7550316339c5fbf8f46caa83ea1b';
  console.log(await m.verifyBundle(dir));
  console.log(await m.verifyBundle(dir, { deep: true }));
})"
```

El chequeo profundo tarda menos de un segundo con el bundle int8 (782 ms en la
máquina de referencia).

### Precisión

Se compararon las siete preguntas canónicas del arnés (ruta ODD/SDD,
complejidad, grafo, subagentes, riesgo bajo/alto y triaje de fallos) contra el
modelo fp32:

- las siete decisiones (`choice`/`noul`) coinciden;
- la probabilidad máxima se desvía como mucho ~0.02;
- `act_probability` coincide.

La cuantización de bloques de 32 conserva mucho mejor la señal que una
cuantización dinámica por tensor: esta última colapsó las probabilidades a
uniformes en las pruebas, porque las activaciones del modelo tienen valores
atípicos y `DynamicQuantizeLinear` usa una sola escala por tensor.

### Velocidad

Medido en un Ryzen 5 5600X (6 núcleos, AVX2, WSL2), con hilos automáticos:

| Métrica | fp32 | int8 block-32 |
| --- | ---: | ---: |
| Carga del modelo | ~2.6 s | ~0.3 s |
| Una llamada `predict` | ~1.09 s | ~1.31 s |
| Carga + 3 llamadas | ~5.9 s | ~4.2 s |

La inferencia suelta es ~20 % más lenta porque el kernel descomprime bloques de
pesos en cada `MatMul`, pero un run hace como mucho tres llamadas: la carga
inicial, que es 8× más rápida, compensa de sobra. El artefacto también reduce
el uso de disco y de memoria.

## Uso

Apunta `laya.modelDir` al directorio del artefacto:

```json
{
  "laya": {
    "enabled": true,
    "modelDir": "~/.cache/alvaress/laya-onnx-int8/d42786bdff8a7550316339c5fbf8f46caa83ea1b",
    "threads": 4
  }
}
```

`alvaress doctor` comprobará el manifiesto y los tamaños; si falta algo, cae a
heurísticas. El bundle fp32 de la caché global sigue siendo el valor por
defecto hasta que se publique el asset int8 y se actualice el instalador.

## Publicación pendiente

El siguiente paso es subir el artefacto como release asset de `alvaress` y
cambiar `BUNDLE_FILES`/`ensureBundle` para descargarlo con los hashes del
manifiesto. No se ha hecho todavía: requiere autenticación de GitHub y
confirmación explícita.

El artefacto es una obra derivada de los pesos de Laya
([`receptron/laya-onnx`](https://huggingface.co/receptron/laya-onnx), MIT). Al
distribuirlo hay que conservar el aviso de `THIRD_PARTY_NOTICES.md`.
