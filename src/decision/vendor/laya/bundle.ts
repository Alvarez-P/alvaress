/**
 * Descarga y verificación del bundle ONNX de Laya.
 *
 * Mejora sobre @receptron/laya (MIT, Copyright (c) 2026 Receptron): el original
 * solo compara el tamaño del archivo. Aquí cada archivo se verifica con SHA-256
 * al descargarlo, y `verifyBundle(dir, { deep: true })` permite auditar el
 * bundle completo cuando haga falta.
 *
 * Si el directorio contiene un `laya_int8.json` válido (lo escribe
 * `scripts/quantize-laya.py`), la verificación usa ese manifiesto en vez del
 * bundle fp32 fijado aquí. Así `laya.modelDir` puede apuntar a un artefacto
 * cuantizado sin cambiar el código.
 */

import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, readFileSync } from 'node:fs';
import { mkdir, rename, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export interface BundleFile {
  /** Ruta relativa dentro del bundle. */
  path: string;
  bytes: number;
  sha256: string;
}

/**
 * Archivos del bundle `receptron/laya-onnx` en la revisión fijada.
 * Los hashes se calcularon sobre la descarga del 2026-10-25.
 */
export const BUNDLE_FILES: readonly BundleFile[] = [
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

export const BUNDLE_REPO = 'receptron/laya-onnx';
export const BUNDLE_REVISION = 'd42786bdff8a7550316339c5fbf8f46caa83ea1b';

/** Bytes totales del bundle, para avisar en el instalador. */
export const BUNDLE_BYTES = BUNDLE_FILES.reduce((total, file) => total + file.bytes, 0);

/**
 * Manifiesto que escribe `scripts/quantize-laya.py` junto al bundle int8.
 *
 * Cuando existe, `verifyBundle` valida contra él en vez de contra el bundle fp32
 * fijado aquí: así `laya.modelDir` puede apuntar a un artefacto cuantizado sin
 * tocar el código. El manifiesto es local y no se descarga.
 */
export const BUNDLE_MANIFEST = 'laya_int8.json';

const REQUIRED_PATHS = new Set(BUNDLE_FILES.map((file) => file.path));
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

/** Archivos contra los que validar `dir`: el manifiesto int8 o el bundle fp32. */
export function bundleFilesFor(dir: string): readonly BundleFile[] {
  return readBundleManifest(dir) ?? BUNDLE_FILES;
}

export type BundleProgress = (event: {
  file: string;
  received: number;
  total: number | null;
}) => void;

export interface EnsureBundleOptions {
  /** Directorio destino del bundle. */
  dir: string;
  repo?: string;
  revision?: string;
  onProgress?: BundleProgress;
  /** Inyectable para tests. */
  fetchImpl?: typeof fetch;
}

export interface VerifyBundleResult {
  ok: boolean;
  missing: string[];
  corrupt: string[];
}

function bundleUrl(repo: string, revision: string, file: string): string {
  return `https://huggingface.co/${repo}/resolve/${encodeURIComponent(revision)}/${file}`;
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
 * cada `run`. Con `deep` recalcula cada SHA-256 (tarda unos segundos: son 1.7 GB).
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

/**
 * Asegura que el bundle esté completo en `dir` y devuelve el directorio.
 *
 * Descarga solo lo que falta o está corrupto. Cada archivo se escribe a un
 * temporal y se renombra al final, así que una descarga interrumpida nunca deja
 * un peso a medias.
 */
export async function ensureBundle(options: EnsureBundleOptions): Promise<string> {
  const repo = options.repo ?? BUNDLE_REPO;
  const revision = options.revision ?? BUNDLE_REVISION;
  const dir = options.dir;
  const doFetch = options.fetchImpl ?? fetch;

  await mkdir(dir, { recursive: true });

  for (const file of BUNDLE_FILES) {
    const dest = path.join(dir, file.path);
    if ((await fileSize(dest)) === file.bytes) {
      continue;
    }

    const url = bundleUrl(repo, revision, file.path);
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

  return dir;
}
