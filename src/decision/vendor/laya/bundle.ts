/**
 * Descarga y verificación del bundle ONNX de Laya.
 *
 * Mejora sobre @receptron/laya (MIT, Copyright (c) 2026 Receptron): el original
 * solo compara el tamaño del archivo. Aquí cada archivo se verifica con SHA-256
 * al descargarlo, y `verifyBundle(dir, { deep: true })` permite auditar el
 * bundle completo cuando haga falta.
 *
 * El bundle por defecto es el artefacto int8 block-32 que publica alvaress como
 * release asset. Los archivos se descargan del release y se validan contra los
 * hashes fijados en `BUNDLE_FILES`. El manifiesto `laya_int8.json` se escribe
 * junto al bundle; si un directorio ya trae uno válido, se usa como fuente de
 * verdad. Los bundles fp32 antiguos se siguen reconociendo para no forzar una
 * descarga a quien ya tenía el modelo.
 */

import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, readFileSync, statSync } from 'node:fs';
import { mkdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export interface BundleFile {
  /** Ruta relativa dentro del bundle. */
  path: string;
  bytes: number;
  sha256: string;
  /**
   * Nombre del asset remoto, si difiere de `path`. Los release assets de GitHub
   * no admiten `/`, así que los archivos del tokenizador se publican planos.
   */
  asset?: string;
}

/**
 * Artefacto int8 block-32 generado por `scripts/quantize-laya.py` desde la
 * revisión fijada. Es el bundle que descarga `alvaress install` por defecto.
 */
export const BUNDLE_FILES: readonly BundleFile[] = [
  {
    path: 'laya.onnx',
    asset: 'laya.onnx',
    bytes: 3_566_207,
    sha256: 'e28e277e55aa52f9b1671525a9a9b2d82fe506da7aabbc99a32f16b3990371e2'
  },
  {
    path: 'laya.onnx.data',
    asset: 'laya.onnx.data',
    bytes: 481_005_568,
    sha256: '4d8dc2f06691a2a44380e31347baeedb978dd9ded74afffee4624ba391095e5b'
  },
  {
    path: 'laya_config.json',
    asset: 'laya_config.json',
    bytes: 355,
    sha256: 'c4fab3dd16b6ffdb432ae99334c77fca31e1b4beb0b81be76ca45f707709706a'
  },
  {
    path: 'tokenizer/tokenizer.json',
    asset: 'tokenizer.json',
    bytes: 3_583_228,
    sha256: '6c8aaa9a542084f2457eab775d4eeb51f92a70c0fd9de28d5edb0ddec3c08d30'
  },
  {
    path: 'tokenizer/tokenizer_config.json',
    asset: 'tokenizer_config.json',
    bytes: 308,
    sha256: '50044de60daaa73df97d262e15a40d4faf0160e7d742df64b377877a1320dd12'
  }
];

/** Bundle fp32 de `receptron/laya-onnx`; se conserva para cachés ya existentes. */
export const FP32_BUNDLE_FILES: readonly BundleFile[] = [
  {
    path: 'laya.onnx',
    bytes: 3_807_291,
    sha256: 'a874eb254b58b0fcb1e7ad56fbb188c29d64e08c9a46b689433e1f52c66dba1e'
  },
  {
    path: 'laya.onnx.data',
    bytes: 1_685_258_240,
    sha256: '487746363a8da57bcadb4345352997d22a0fb90d70aa22c6856668d023242aba'
  },
  {
    path: 'laya_config.json',
    bytes: 355,
    sha256: 'c4fab3dd16b6ffdb432ae99334c77fca31e1b4beb0b81be76ca45f707709706a'
  },
  {
    path: 'tokenizer/tokenizer.json',
    bytes: 3_583_228,
    sha256: '6c8aaa9a542084f2457eab775d4eeb51f92a70c0fd9de28d5edb0ddec3c08d30'
  },
  {
    path: 'tokenizer/tokenizer_config.json',
    bytes: 308,
    sha256: '50044de60daaa73df97d262e15a40d4faf0160e7d742df64b377877a1320dd12'
  }
];

/** Revisión del checkpoint de origen; identifica el artefacto. */
export const BUNDLE_REVISION = 'd42786bdff8a7550316339c5fbf8f46caa83ea1b';
export const BUNDLE_KIND = 'laya-onnx-int8-block32';

/** Release de alvaress que publica el artefacto int8. */
export const BUNDLE_RELEASE_REPO = 'Alvarez-P/alvaress';
export const BUNDLE_RELEASE_TAG = 'laya-int8-v1';

/** Bytes totales del bundle, para avisar en el instalador. */
export const BUNDLE_BYTES = BUNDLE_FILES.reduce((total, file) => total + file.bytes, 0);

/**
 * Manifiesto que acompaña al bundle int8.
 *
 * Lo escribe `scripts/quantize-laya.py` al generar el artefacto y el instalador
 * al descargarlo. Cuando existe, `verifyBundle` valida contra él en vez de
 * contra la lista fijada en el código.
 */
export const BUNDLE_MANIFEST = 'laya_int8.json';

const REQUIRED_PATHS = new Set(BUNDLE_FILES.map((file) => file.path));
const FP32_DATA_BYTES = FP32_BUNDLE_FILES.find((file) => file.path === 'laya.onnx.data')?.bytes;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

function isSafeRelativePath(filePath: string): boolean {
  if (filePath.length === 0 || path.isAbsolute(filePath)) {
    return false;
  }
  const normalized = path.normalize(filePath);
  return normalized !== '..' && !normalized.startsWith(`..${path.sep}`);
}

function manifestFile(entry: unknown): { bytes: number; sha256: string } | undefined {
  if (entry === null || typeof entry !== 'object') {
    return undefined;
  }
  const record = entry as Record<string, unknown>;
  const bytes = record['bytes'];
  const sha256 = record['sha256'];
  if (typeof bytes !== 'number' || !Number.isSafeInteger(bytes) || bytes < 0) {
    return undefined;
  }
  if (typeof sha256 !== 'string' || !SHA256_PATTERN.test(sha256)) {
    return undefined;
  }
  return { bytes, sha256 };
}

/**
 * Lee el manifiesto int8 de un directorio, si existe y es válido.
 *
 * Se ignora cualquier manifiesto que no describa todos los archivos del bundle
 * (o que intente salir del directorio): en ese caso se valida contra el bundle
 * fp32 de referencia, que es el comportamiento histórico.
 */
export function readBundleManifest(dir: string): readonly BundleFile[] | undefined {
  let raw: string;
  try {
    raw = readFileSync(path.join(dir, BUNDLE_MANIFEST), 'utf8');
  } catch {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (parsed === null || typeof parsed !== 'object') {
    return undefined;
  }

  const files = (parsed as Record<string, unknown>)['files'];
  if (files === null || typeof files !== 'object') {
    return undefined;
  }

  const bundle: BundleFile[] = [];
  for (const [filePath, entry] of Object.entries(files as Record<string, unknown>)) {
    const info = manifestFile(entry);
    if (info === undefined || !isSafeRelativePath(filePath)) {
      return undefined;
    }
    bundle.push({ path: filePath, ...info });
  }

  for (const required of REQUIRED_PATHS) {
    if (!bundle.some((file) => file.path === required)) {
      return undefined;
    }
  }
  return bundle;
}

/** Detecta un bundle fp32 heredado por el tamaño de sus datos. */
function looksLikeFp32(dir: string): boolean {
  if (FP32_DATA_BYTES === undefined) {
    return false;
  }
  try {
    return statSync(path.join(dir, 'laya.onnx.data')).size === FP32_DATA_BYTES;
  } catch {
    return false;
  }
}

/**
 * Archivos contra los que validar `dir`: el manifiesto si existe, el bundle fp32
 * si el directorio ya contenía uno, o el artefacto int8 por defecto.
 */
export function bundleFilesFor(dir: string): readonly BundleFile[] {
  return readBundleManifest(dir) ?? (looksLikeFp32(dir) ? FP32_BUNDLE_FILES : BUNDLE_FILES);
}

/** URL del asset en el release de alvaress. */
export function bundleUrlFor(file: BundleFile): string {
  const asset = file.asset ?? path.basename(file.path);
  return (
    `https://github.com/${BUNDLE_RELEASE_REPO}/releases/download/` +
    `${encodeURIComponent(BUNDLE_RELEASE_TAG)}/${encodeURIComponent(asset)}`
  );
}

/** Manifiesto que acompaña al bundle, con tamaño y SHA-256 de cada archivo. */
export function buildBundleManifest(files: readonly BundleFile[]): string {
  const payload = {
    format: 1,
    kind: BUNDLE_KIND,
    source: BUNDLE_REVISION,
    bits: 8,
    block_size: 32,
    accuracy_level: 4,
    is_symmetric: true,
    matmul_op: 'MatMulNBits',
    embedding_op: 'GatherBlockQuantized',
    files: Object.fromEntries(
      files.map((file) => [file.path, { bytes: file.bytes, sha256: file.sha256 }])
    ),
    total_bytes: files.reduce((total, file) => total + file.bytes, 0)
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export type BundleProgress = (event: {
  file: string;
  received: number;
  total: number | null;
}) => void;

export interface EnsureBundleOptions {
  /** Directorio destino del bundle. */
  dir: string;
  /** Archivos a descargar; por defecto, el artefacto int8 publicado. */
  files?: readonly BundleFile[];
  /** Resuelve la URL de cada archivo; inyectable para espejos y tests. */
  resolveUrl?: (file: BundleFile) => string;
  /** Escribe `laya_int8.json` al terminar. Se puede desactivar en tests. */
  writeManifest?: boolean;
  onProgress?: BundleProgress;
  /** Inyectable para tests. */
  fetchImpl?: typeof fetch;
}

export interface VerifyBundleResult {
  ok: boolean;
  missing: string[];
  corrupt: string[];
}

async function fileSize(filePath: string): Promise<number | null> {
  try {
    return (await stat(filePath)).size;
  } catch {
    return null;
  }
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  await pipeline(createReadStream(filePath), async (source) => {
    for await (const chunk of source) {
      hash.update(chunk as Buffer);
    }
  });
  return hash.digest('hex');
}

/**
 * Verifica el bundle en disco.
 *
 * Por defecto solo compara tamaños, que es barato y suficiente para arrancar en
 * cada `run`. Con `deep` recalcula cada SHA-256 (tarda menos de un segundo con
 * el artefacto int8).
 */
export async function verifyBundle(
  dir: string,
  options: { deep?: boolean } = {}
): Promise<VerifyBundleResult> {
  const missing: string[] = [];
  const corrupt: string[] = [];
  const files = bundleFilesFor(dir);

  for (const file of files) {
    const filePath = path.join(dir, file.path);
    const size = await fileSize(filePath);
    if (size === null) {
      missing.push(file.path);
      continue;
    }
    if (size !== file.bytes) {
      corrupt.push(file.path);
      continue;
    }
    if (options.deep === true && (await sha256File(filePath)) !== file.sha256) {
      corrupt.push(file.path);
    }
  }

  return { ok: missing.length === 0 && corrupt.length === 0, missing, corrupt };
}

function sameBundleFiles(
  left: readonly BundleFile[],
  right: readonly BundleFile[]
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const byPath = new Map(left.map((file) => [file.path, file]));
  return right.every((file) => {
    const other = byPath.get(file.path);
    return other !== undefined && other.bytes === file.bytes && other.sha256 === file.sha256;
  });
}

async function writeBundleManifest(
  dir: string,
  files: readonly BundleFile[]
): Promise<void> {
  const dest = path.join(dir, BUNDLE_MANIFEST);
  const tmp = `${dest}.part-${process.pid}`;
  await writeFile(tmp, buildBundleManifest(files), 'utf8');
  await rename(tmp, dest);
}

/**
 * Asegura que el bundle esté completo en `dir` y devuelve el directorio.
 *
 * Descarga solo lo que falta. Cada archivo se escribe a un temporal y se
 * renombra al final, así que una descarga interrumpida nunca deja un peso a
 * medias. El manifiesto se escribe al final, cuando todos los archivos ya están
 * en su sitio.
 */
export async function ensureBundle(options: EnsureBundleOptions): Promise<string> {
  const dir = options.dir;
  const files = options.files ?? BUNDLE_FILES;
  const resolveUrl = options.resolveUrl ?? bundleUrlFor;
  const doFetch = options.fetchImpl ?? fetch;

  await mkdir(dir, { recursive: true });

  for (const file of files) {
    const dest = path.join(dir, file.path);
    if ((await fileSize(dest)) === file.bytes) {
      continue;
    }

    const url = resolveUrl(file);
    const response = await doFetch(url, { redirect: 'follow' });
    if (!response.ok || response.body === null) {
      throw new Error(
        `No se pudo descargar ${file.path} desde ${url}: ${response.status} ${response.statusText}`
      );
    }

    await mkdir(path.dirname(dest), { recursive: true });
    const tmp = `${dest}.part-${process.pid}`;
    const hash = createHash('sha256');
    let received = 0;
    const body = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]);

    body.on('data', (chunk: Buffer) => {
      hash.update(chunk);
      received += chunk.length;
      options.onProgress?.({ file: file.path, received, total: file.bytes });
    });

    try {
      await pipeline(body, createWriteStream(tmp));
      const digest = hash.digest('hex');
      if (received !== file.bytes || digest !== file.sha256) {
        throw new Error(
          `El archivo ${file.path} no coincide con el hash fijado ` +
            `(recibidos ${received} bytes, sha256 ${digest}).`
        );
      }
      await rename(tmp, dest);
    } catch (error) {
      await unlink(tmp).catch(() => undefined);
      throw error;
    }
  }

  if (options.writeManifest !== false) {
    const existing = readBundleManifest(dir);
    if (existing === undefined || !sameBundleFiles(existing, files)) {
      await writeBundleManifest(dir, files);
    }
  }

  return dir;
}
