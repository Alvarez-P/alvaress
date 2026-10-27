import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  BUNDLE_BYTES,
  BUNDLE_FILES,
  BUNDLE_MANIFEST,
  buildBundleManifest,
  buildSequence,
  bundleUrlFor,
  checkChoiceLabels,
  clampTemperature,
  confidenceFromProbs,
  ensureBundle,
  pyJsonDumps,
  renderOptions,
  serializeState,
  softmax,
  tempBucket,
  temperatureFor,
  toInternal,
  verifyBundle
} from '../src/decision/vendor/laya/index.js';
import type { LayaBundleConfig, Question, SpecialIds } from '../src/decision/vendor/laya/index.js';
import { makeTempDir, writeFile, writeJson } from './helpers.js';

const ids: SpecialIds = { cls: 1, sep: 2, mask: 3, pad: 0, maskTok: '[MASK]' };

/** Tokenizador de mentira: un id por carácter, para poder predecir longitudes. */
const encode = (text: string): number[] => Array.from(text, (char) => char.codePointAt(0) ?? 0);

test('pyJsonDumps imita a json.dumps de Python', () => {
  assert.equal(pyJsonDumps({ a: 1, b: 'x', c: true, d: null }), '{"a": 1, "b": "x", "c": true, "d": null}');
  assert.equal(pyJsonDumps([1, 2.5, 'y']), '[1, 2.5, "y"]');
  assert.equal(serializeState('texto plano'), 'texto plano');
  assert.equal(serializeState([{ role: 'user' }]), '[{"role": "user"}]');
});

test('toInternal normaliza un choice con lista de etiquetas', () => {
  const question = toInternal({
    type: 'choice',
    instructions: 'elige',
    criteria: ['a', 'b']
  });

  assert.deepEqual(question.crit, { a: null, b: null });
});

test('checkChoiceLabels rechaza etiquetas repetidas', () => {
  const question: Question = {
    type: 'choice',
    instructions: 'elige',
    criteria: ['a', 'a']
  };

  assert.throws(() => checkChoiceLabels('mode', question), /repeats label 0/);
  assert.doesNotThrow(() =>
    checkChoiceLabels('mode', { type: 'choice', instructions: 'elige', criteria: ['a', 'b'] })
  );
});

test('renderOptions conserva el formato del checkpoint', () => {
  assert.deepEqual(
    renderOptions(toInternal({ type: 'choice', instructions: 'i', criteria: { a: 'primero', b: '' } })),
    ['a: primero', 'b']
  );
  assert.deepEqual(
    renderOptions(toInternal({ type: 'score', instructions: 'i', criteria: ['bajo', 'alto'] })),
    ['level 0: bajo', 'level 1: alto']
  );
  assert.deepEqual(renderOptions(toInternal({ type: 'noul', instructions: 'i' })), [
    'false: no, the statement does not hold',
    'true: yes, the statement holds'
  ]);
});

test('tempBucket agrupa por tipo y cardinalidad', () => {
  assert.equal(tempBucket(0, 2), 'choice:2');
  assert.equal(tempBucket(0, 4), 'choice:3-5');
  assert.equal(tempBucket(1, 7), 'score:6-10');
  assert.equal(tempBucket(2, 11), 'noul:11+');
});

test('temperatureFor prefiere el bucket y recorta al rango soportado', () => {
  const config: LayaBundleConfig = {
    max_len: 512,
    head_max_len: 192,
    temperature: [1.6, 1.2, 1.9],
    temperature_by_options: { 'choice:11+': 0.945, 'score:2': 99 }
  };

  assert.equal(temperatureFor(config, 0, 12), 0.945);
  assert.equal(temperatureFor(config, 1, 2), 5);
  assert.equal(temperatureFor(config, 0, 2), 1.6);
  assert.equal(clampTemperature(Number.NaN, 1.3), 1.3);
  assert.equal(clampTemperature(0.1), 0.5);
});

test('softmax normaliza y confidenceFromProbs mide la certeza', () => {
  const probabilities = softmax([1, 1, 1]);
  assert.ok(Math.abs(probabilities.reduce((sum, value) => sum + value, 0) - 1) < 1e-12);
  assert.ok(Math.abs(confidenceFromProbs(probabilities)) < 1e-12);
  assert.equal(confidenceFromProbs([1, 0]), 1);
});

test('buildSequence arma la cabeza, los marcadores y el estado', () => {
  const built = buildSequence(
    encode,
    ids,
    'estado',
    toInternal({ type: 'choice', instructions: 'elige', criteria: { a: 'uno', b: 'dos' } }),
    512,
    192
  );

  assert.equal(built.ids[0], ids.cls);
  assert.equal(built.markers.length, 2);
  assert.equal(built.ids[built.markers[0] as number], ids.mask);
  assert.equal(built.ids[built.markers[1] as number], ids.mask);
  assert.equal(built.ids.at(-1), ids.sep);
  assert.ok(built.ids.length <= 512);
});

test('buildSequence recorta el estado y respeta max_len', () => {
  const built = buildSequence(
    encode,
    ids,
    'x'.repeat(2000),
    toInternal({ type: 'noul', instructions: 'pregunta' }),
    256,
    192
  );

  assert.equal(built.ids.length, 256);
  assert.equal(built.ids.at(-1), ids.sep);
  assert.equal(built.markers.length, 2);
});

test('buildSequence encoge las opciones cuando no caben en head_max_len', () => {
  const criteria = Object.fromEntries(
    Array.from({ length: 20 }, (_, index) => [`opcion-${index}`, 'descripcion larga'])
  );
  const built = buildSequence(
    encode,
    ids,
    'estado',
    toInternal({ type: 'choice', instructions: 'elige', criteria }),
    512,
    192
  );

  assert.equal(built.markers.length, 20);
  const head = built.ids.slice(0, built.ids.indexOf(ids.sep, 1));
  assert.ok(head.length <= 192);
});

test('bundleUrlFor publica los assets planos en el release de alvaress', () => {
  const tokenizer = BUNDLE_FILES.find((file) => file.path === 'tokenizer/tokenizer.json');
  assert.ok(tokenizer !== undefined);
  assert.equal(
    bundleUrlFor(tokenizer),
    'https://github.com/Alvarez-P/alvaress/releases/download/laya-int8-v1/tokenizer.json'
  );

  const manifest = JSON.parse(buildBundleManifest(BUNDLE_FILES)) as {
    kind: string;
    total_bytes: number;
    files: Record<string, { sha256: string }>;
  };
  assert.equal(manifest.kind, 'laya-onnx-int8-block32');
  assert.equal(manifest.total_bytes, BUNDLE_BYTES);
  assert.equal(manifest.files['laya.onnx.data']?.sha256, BUNDLE_FILES[1]?.sha256);
});

test('ensureBundle descarga, verifica y escribe el manifiesto', async () => {
  const temp = makeTempDir('laya-ensure-');
  try {
    const contents = new Map([
      ['laya_config.json', 'config'],
      ['tokenizer/tokenizer.json', 'tokens']
    ]);
    const files = [...contents].map(([filePath, content]) => ({
      path: filePath,
      asset: path.basename(filePath),
      bytes: Buffer.byteLength(content),
      sha256: createHash('sha256').update(content).digest('hex')
    }));

    const requested: string[] = [];
    const fetchImpl = (async (input: string | URL | Request) => {
      const url = String(input);
      requested.push(url);
      const asset = decodeURIComponent(new URL(url).pathname.split('/').at(-1) ?? '');
      const content = contents.get(asset) ?? contents.get(`tokenizer/${asset}`);
      return new Response(content ?? '', { status: content === undefined ? 404 : 200 });
    }) as typeof fetch;

    await ensureBundle({ dir: temp.path, files, fetchImpl });

    assert.equal(fs.readFileSync(path.join(temp.path, 'laya_config.json'), 'utf8'), 'config');
    assert.deepEqual(requested, [
      'https://github.com/Alvarez-P/alvaress/releases/download/laya-int8-v1/laya_config.json',
      'https://github.com/Alvarez-P/alvaress/releases/download/laya-int8-v1/tokenizer.json'
    ]);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(temp.path, BUNDLE_MANIFEST), 'utf8')
    ) as { files: Record<string, unknown>; total_bytes: number };
    assert.deepEqual(Object.keys(manifest.files).toSorted(), [
      'laya_config.json',
      'tokenizer/tokenizer.json'
    ]);
    assert.equal(manifest.total_bytes, 12);
  } finally {
    temp.cleanup();
  }
});

test('ensureBundle reporta progreso agregado y descarga en paralelo', async () => {
  const temp = makeTempDir('laya-progress-');
  try {
    const contents = new Map([
      ['laya_config.json', 'config'],
      ['tokenizer/tokenizer.json', 'tokens']
    ]);
    const files = [...contents].map(([filePath, content]) => ({
      path: filePath,
      asset: path.basename(filePath),
      bytes: Buffer.byteLength(content),
      sha256: createHash('sha256').update(content).digest('hex')
    }));

    let active = 0;
    let maxActive = 0;
    const fetchImpl = (async (input: string | URL | Request) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active -= 1;
      const url = String(input);
      const asset = decodeURIComponent(new URL(url).pathname.split('/').at(-1) ?? '');
      const content = contents.get(asset) ?? contents.get(`tokenizer/${asset}`);
      return new Response(content ?? '', { status: content === undefined ? 404 : 200 });
    }) as typeof fetch;

    const events: Array<{ overallReceived?: number; overallTotal?: number }> = [];
    await ensureBundle({
      dir: temp.path,
      files,
      fetchImpl,
      onProgress: (event) => events.push(event)
    });

    assert.ok(maxActive >= 2, `descargas concurrentes: ${maxActive}`);
    assert.ok(events.length > 0);
    assert.equal(events.at(-1)?.overallReceived, 12);
    assert.equal(events.at(-1)?.overallTotal, 12);
  } finally {
    temp.cleanup();
  }
});

test('verifyBundle detecta archivos faltantes y corruptos por tamaño', async () => {
  const temp = makeTempDir('laya-bundle-');
  try {
    const first = await verifyBundle(temp.path);
    assert.equal(first.ok, false);
    assert.deepEqual(
      first.missing,
      BUNDLE_FILES.map((file) => file.path)
    );

    const target = path.join(temp.path, 'laya_config.json');
    writeFile(target, 'x'.repeat(BUNDLE_FILES[2]?.bytes ?? 0));
    const second = await verifyBundle(temp.path);
    assert.equal(second.missing.includes('laya_config.json'), false);
    assert.deepEqual(second.corrupt, []);

    fs.truncateSync(target, 1);
    const third = await verifyBundle(temp.path);
    assert.deepEqual(third.corrupt, ['laya_config.json']);
  } finally {
    temp.cleanup();
  }
});

test('verifyBundle con deep detecta contenido corrupto del mismo tamaño', async () => {
  const temp = makeTempDir('laya-bundle-');
  try {
    const config = BUNDLE_FILES.find((file) => file.path === 'laya_config.json');
    assert.ok(config !== undefined);
    writeFile(path.join(temp.path, 'laya_config.json'), 'x'.repeat(config.bytes));

    const shallow = await verifyBundle(temp.path);
    assert.equal(shallow.corrupt.includes('laya_config.json'), false);

    const deep = await verifyBundle(temp.path, { deep: true });
    assert.equal(deep.corrupt.includes('laya_config.json'), true);
  } finally {
    temp.cleanup();
  }
});

test('verifyBundle valida contra el manifiesto int8 cuando existe', async () => {
  const temp = makeTempDir('laya-int8-');
  try {
    const files: Record<string, { bytes: number; sha256: string }> = {};
    for (const file of BUNDLE_FILES) {
      const content = `contenido de ${file.path}`;
      writeFile(path.join(temp.path, file.path), content);
      files[file.path] = {
        bytes: Buffer.byteLength(content),
        sha256: createHash('sha256').update(content).digest('hex')
      };
    }
    writeJson(path.join(temp.path, BUNDLE_MANIFEST), {
      format: 1,
      kind: 'laya-onnx-int8-block32',
      files
    });

    const deep = await verifyBundle(temp.path, { deep: true });
    assert.equal(deep.ok, true);

    // Mismo tamaño, contenido distinto: el chequeo barato pasa, el profundo no.
    const target = path.join(temp.path, 'laya.onnx');
    const original = fs.readFileSync(target, 'utf8');
    fs.writeFileSync(target, 'x'.repeat(Buffer.byteLength(original)));
    const shallow = await verifyBundle(temp.path);
    assert.equal(shallow.ok, true);
    const corrupted = await verifyBundle(temp.path, { deep: true });
    assert.deepEqual(corrupted.corrupt, ['laya.onnx']);
  } finally {
    temp.cleanup();
  }
});

test('verifyBundle ignora un manifiesto incompleto o con rutas inseguras', async () => {
  const temp = makeTempDir('laya-manifest-');
  try {
    writeJson(path.join(temp.path, BUNDLE_MANIFEST), {
      files: { 'laya.onnx': { bytes: 1, sha256: 'a'.repeat(64) } }
    });
    const incomplete = await verifyBundle(temp.path);
    assert.equal(incomplete.ok, false);
    assert.ok(incomplete.missing.includes('laya.onnx.data'));

    const files = Object.fromEntries(
      BUNDLE_FILES.map((file) => [file.path, { bytes: file.bytes, sha256: file.sha256 }])
    );
    files['../fuera.txt'] = { bytes: 1, sha256: 'b'.repeat(64) };
    writeJson(path.join(temp.path, BUNDLE_MANIFEST), { files });
    const unsafe = await verifyBundle(temp.path);
    assert.equal(unsafe.ok, false);
    assert.ok(unsafe.missing.includes('laya.onnx'));
  } finally {
    temp.cleanup();
  }
});
