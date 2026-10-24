import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ensureDir,
  isDirectory,
  linkDirectory,
  linkFile,
  pathExists,
  readJsonFile,
  readTextFile,
  relativeTo,
  removePath,
  writeJsonFile,
  writeTextFile,
  writeTextFileIfMissing
} from '../src/utils/fs.js';
import { ConfigError } from '../src/utils/errors.js';
import { makeTempDir, writeFile } from './helpers.js';

test('pathExists, isDirectory y ensureDir', () => {
  const temp = makeTempDir();
  try {
    const target = path.join(temp.path, 'nested', 'dir');
    assert.equal(pathExists(target), false);
    ensureDir(target);
    assert.equal(pathExists(target), true);
    assert.equal(isDirectory(target), true);
    assert.equal(isDirectory(path.join(temp.path, 'missing')), false);
  } finally {
    temp.cleanup();
  }
});

test('writeTextFile crea directorios y writeTextFileIfMissing respeta existentes', () => {
  const temp = makeTempDir();
  try {
    const target = path.join(temp.path, 'a', 'b.txt');
    writeTextFile(target, 'uno');
    assert.equal(readTextFile(target), 'uno');
    assert.equal(writeTextFileIfMissing(target, 'dos'), false);
    assert.equal(readTextFile(target), 'uno');

    const other = path.join(temp.path, 'c.txt');
    assert.equal(writeTextFileIfMissing(other, 'tres'), true);
    assert.equal(readTextFile(other), 'tres');
  } finally {
    temp.cleanup();
  }
});

test('readJsonFile y writeJsonFile', () => {
  const temp = makeTempDir();
  try {
    const target = path.join(temp.path, 'config.json');
    writeJsonFile(target, { a: 1 });
    assert.deepEqual(readJsonFile(target), { a: 1 });
    assert.match(fs.readFileSync(target, 'utf-8'), /\n$/);

    writeFile(target, '{ invalid');
    assert.throws(() => readJsonFile(target), ConfigError);
    assert.throws(() => readTextFile(path.join(temp.path, 'missing')), ConfigError);
  } finally {
    temp.cleanup();
  }
});

test('linkFile crea, conserva y actualiza enlaces simbólicos', () => {
  const temp = makeTempDir();
  try {
    const first = path.join(temp.path, 'first.txt');
    const second = path.join(temp.path, 'second.txt');
    writeFile(first, 'first');
    writeFile(second, 'second');
    const link = path.join(temp.path, 'links', 'target.txt');

    assert.equal(linkFile(first, link), 'created');
    assert.equal(linkFile(first, link), 'unchanged');
    assert.equal(linkFile(second, link), 'updated');
    assert.equal(fs.readlinkSync(link), second);
  } finally {
    temp.cleanup();
  }
});

test('linkFile no reemplaza archivos reales', () => {
  const temp = makeTempDir();
  try {
    const target = path.join(temp.path, 'target.txt');
    const link = path.join(temp.path, 'real.txt');
    writeFile(target, 'target');
    writeFile(link, 'real');

    assert.equal(linkFile(target, link), 'skipped');
    assert.equal(readTextFile(link), 'real');
  } finally {
    temp.cleanup();
  }
});

test('linkDirectory crea enlaces de directorio', () => {
  const temp = makeTempDir();
  try {
    const target = path.join(temp.path, 'source');
    ensureDir(target);
    const link = path.join(temp.path, 'links', 'source');
    assert.equal(linkDirectory(target, link), 'created');
    assert.equal(isDirectory(link), true);
  } finally {
    temp.cleanup();
  }
});

test('removePath elimina archivos y directorios', () => {
  const temp = makeTempDir();
  try {
    const directory = path.join(temp.path, 'remove-me');
    writeFile(path.join(directory, 'file.txt'), 'x');
    removePath(directory);
    assert.equal(pathExists(directory), false);
    removePath(directory);
  } finally {
    temp.cleanup();
  }
});

test('relativeTo devuelve rutas relativas', () => {
  assert.equal(relativeTo('/a/b', '/a/b'), '.');
  assert.equal(relativeTo('/a/b', '/a/b/c/d'), 'c/d');
});
