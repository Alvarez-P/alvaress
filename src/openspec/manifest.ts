import fs from 'node:fs';
import path from 'node:path';
import { parse, stringify } from 'yaml';
import { HARNESS_DIR, OPENSPEC_FILENAME, TASKS_DIR } from '../constants.js';
import { ManifestError, errorMessage } from '../utils/errors.js';
import { ensureDir, pathExists, writeTextFile, writeTextFileAtomic, writeTextFileIfMissing } from '../utils/fs.js';
import type {
  BoundedContext,
  OpenSpecManifest,
  OpenSpecSpec,
  OpenSpecTask,
  SpecificationStatus,
  TaskStatus,
  WorkItem
} from './types.js';

export function getManifestPath(root: string = process.cwd()): string {
  return path.join(root, OPENSPEC_FILENAME);
}

export function getTasksDir(root: string = process.cwd()): string {
  return path.join(root, TASKS_DIR);
}

export function taskFilePath(taskId: string, root: string = process.cwd()): string {
  return path.join(getTasksDir(root), `${taskId}.md`);
}

export function ensureHarnessDirs(root: string = process.cwd()): void {
  ensureDir(getTasksDir(root));
  ensureDir(path.join(root, HARNESS_DIR, 'skills'));
}

export function parseManifest(raw: string): OpenSpecManifest {
  let value: unknown;
  try {
    value = parse(raw);
  } catch (error) {
    throw new ManifestError(`YAML inválido en ${OPENSPEC_FILENAME}: ${errorMessage(error)}`);
  }

  if (!value || typeof value !== 'object') {
    throw new ManifestError(`${OPENSPEC_FILENAME} debe contener un objeto YAML.`);
  }

  const manifest = value as OpenSpecManifest;
  if (typeof manifest.specification !== 'string') {
    throw new ManifestError(`El campo "specification" es obligatorio en ${OPENSPEC_FILENAME}.`);
  }
  if (typeof manifest.project !== 'string') {
    throw new ManifestError(`El campo "project" es obligatorio en ${OPENSPEC_FILENAME}.`);
  }
  if (!Array.isArray(manifest.specs)) {
    throw new ManifestError(`El campo "specs" debe ser una lista en ${OPENSPEC_FILENAME}.`);
  }
  if (manifest.bounded_contexts !== undefined && !Array.isArray(manifest.bounded_contexts)) {
    throw new ManifestError(`El campo "bounded_contexts" debe ser una lista en ${OPENSPEC_FILENAME}.`);
  }

  const validId = /^[A-Za-z0-9._-]+$/;
  const validSpecStatuses: SpecificationStatus[] = ['Proposed', 'Verified', 'Archived', 'Failed'];
  const validTaskStatuses: TaskStatus[] = ['Pending', 'InProgress', 'Done', 'Failed'];
  const seen = new Set<string>();

  for (const context of manifest.bounded_contexts ?? []) {
    if (
      !context ||
      typeof context.name !== 'string' ||
      context.name.trim().length === 0 ||
      typeof context.path !== 'string'
    ) {
      throw new ManifestError(
        `Cada bounded context requiere "name" y "path" en ${OPENSPEC_FILENAME}.`
      );
    }
  }

  for (const spec of manifest.specs) {
    if (
      !spec ||
      typeof spec.id !== 'string' ||
      typeof spec.title !== 'string' ||
      typeof spec.context !== 'string' ||
      typeof spec.status !== 'string'
    ) {
      throw new ManifestError(`Cada spec requiere "id", "title", "status" y "context".`);
    }
    if (!validId.test(spec.id)) {
      throw new ManifestError(`El id de spec "${spec.id}" solo admite letras, números, punto, guion y guion bajo.`);
    }
    if (!validSpecStatuses.includes(spec.status)) {
      throw new ManifestError(
        `El estado "${spec.status}" del spec ${spec.id} no es válido. Usa: ${validSpecStatuses.join(', ')}.`
      );
    }
    if (!Array.isArray(spec.tasks)) {
      throw new ManifestError(`El spec ${spec.id} requiere una lista de "tasks".`);
    }
    for (const task of spec.tasks) {
      if (
        !task ||
        typeof task.id !== 'string' ||
        typeof task.description !== 'string' ||
        typeof task.status !== 'string'
      ) {
        throw new ManifestError(
          `El spec ${spec.id} contiene una tarea sin "id", "description" o "status".`
        );
      }
      if (!validId.test(task.id)) {
        throw new ManifestError(`El id de tarea "${task.id}" solo admite letras, números, punto, guion y guion bajo.`);
      }
      if (!validTaskStatuses.includes(task.status)) {
        throw new ManifestError(
          `El estado "${task.status}" de la tarea ${task.id} no es válido. Usa: ${validTaskStatuses.join(', ')}.`
        );
      }
      if (task.files !== undefined) {
        if (!Array.isArray(task.files) || task.files.some((file) => typeof file !== 'string')) {
          throw new ManifestError(`La tarea ${task.id} requiere que "files" sea una lista de cadenas.`);
        }
      }
      if (task.acceptance !== undefined) {
        if (!Array.isArray(task.acceptance) || task.acceptance.some((entry) => typeof entry !== 'string')) {
          throw new ManifestError(`La tarea ${task.id} requiere que "acceptance" sea una lista de cadenas.`);
        }
      }
      if (task.depends_on !== undefined) {
        if (!Array.isArray(task.depends_on) || task.depends_on.some((entry) => typeof entry !== 'string')) {
          throw new ManifestError(`La tarea ${task.id} requiere que "depends_on" sea una lista de cadenas.`);
        }
      }
      if (task.validation !== undefined) {
        if (!Array.isArray(task.validation) || task.validation.some((entry) => typeof entry !== 'string')) {
          throw new ManifestError(`La tarea ${task.id} requiere que "validation" sea una lista de cadenas.`);
        }
      }
      if (task.priority !== undefined && typeof task.priority !== 'number') {
        throw new ManifestError(`La tarea ${task.id} requiere que "priority" sea un número.`);
      }
      if (task.estimate !== undefined && typeof task.estimate !== 'string') {
        throw new ManifestError(`La tarea ${task.id} requiere que "estimate" sea una cadena.`);
      }
      if (task.rollback !== undefined && typeof task.rollback !== 'string') {
        throw new ManifestError(`La tarea ${task.id} requiere que "rollback" sea una cadena.`);
      }
      if (seen.has(task.id)) {
        throw new ManifestError(`El id de tarea "${task.id}" está duplicado en ${OPENSPEC_FILENAME}.`);
      }
      seen.add(task.id);
    }
  }

  return manifest;
}

export function loadManifest(root: string = process.cwd()): OpenSpecManifest {
  const manifestPath = getManifestPath(root);
  if (!pathExists(manifestPath)) {
    throw new ManifestError(`No se encontró ${OPENSPEC_FILENAME} en ${root}. Ejecuta "alvaress init".`);
  }
  let raw: string;
  try {
    raw = fs.readFileSync(manifestPath, 'utf-8');
  } catch (error) {
    throw new ManifestError(`No se pudo leer ${manifestPath}: ${errorMessage(error)}`);
  }
  return parseManifest(raw);
}

export function serializeManifest(manifest: OpenSpecManifest): string {
  return stringify(manifest, { lineWidth: 0, sortMapEntries: false });
}

export function saveManifest(manifest: OpenSpecManifest, root: string = process.cwd()): void {
  writeTextFileAtomic(getManifestPath(root), serializeManifest(manifest));
}

export function createScaffoldManifest(projectName: string, contexts: BoundedContext[] = []): OpenSpecManifest {
  return {
    specification: '1.0.0',
    project: projectName,
    bounded_contexts: contexts,
    specs: []
  };
}

export function scaffoldManifest(root: string = process.cwd()): boolean {
  const manifestPath = getManifestPath(root);
  if (pathExists(manifestPath)) {
    return false;
  }
  const projectName = inferProjectName(root);
  const contexts = inferBoundedContexts(root);
  return writeTextFileIfMissing(manifestPath, serializeManifest(createScaffoldManifest(projectName, contexts)));
}

export function inferProjectName(root: string): string {
  const packageJson = path.join(root, 'package.json');
  if (pathExists(packageJson)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(packageJson, 'utf-8')) as { name?: string };
      if (typeof parsed.name === 'string' && parsed.name.trim().length > 0) {
        return parsed.name;
      }
    } catch {
      return path.basename(root);
    }
  }
  return path.basename(root);
}

export function inferBoundedContexts(root: string): BoundedContext[] {
  const sourceDir = path.join(root, 'src');
  if (pathExists(sourceDir)) {
    return [{ name: 'core', path: 'src' }];
  }
  return [];
}

export function findWorkItem(manifest: OpenSpecManifest, taskId: string): WorkItem {
  for (const spec of manifest.specs) {
    for (const task of spec.tasks) {
      if (task.id === taskId) {
        return { spec, task };
      }
    }
  }
  throw new ManifestError(`No existe la tarea "${taskId}" en ${OPENSPEC_FILENAME}.`);
}

export function collectWorkItems(manifest: OpenSpecManifest, taskIds?: string[]): WorkItem[] {
  if (taskIds && taskIds.length > 0) {
    const items: WorkItem[] = [];
    const added = new Set<string>();
    const addWithDependencies = (taskId: string): void => {
      if (added.has(taskId)) {
        return;
      }
      const item = findWorkItem(manifest, taskId);
      for (const dependency of item.task.depends_on ?? []) {
        if (!added.has(dependency)) {
          addWithDependencies(dependency);
        }
      }
      if (!added.has(taskId)) {
        added.add(taskId);
        items.push(item);
      }
    };
    for (const taskId of taskIds) {
      addWithDependencies(taskId);
    }
    return items;
  }

  const items: WorkItem[] = [];
  for (const spec of manifest.specs) {
    if (spec.status === 'Archived') {
      continue;
    }
    for (const task of spec.tasks) {
      if (task.status === 'Pending') {
        items.push({ spec, task });
      }
    }
  }
  return items;
}

export function setTaskStatus(manifest: OpenSpecManifest, taskId: string, status: TaskStatus): void {
  const item = findWorkItem(manifest, taskId);
  item.task.status = status;
}

export function setSpecStatus(spec: OpenSpecSpec, status: SpecificationStatus): void {
  spec.status = status;
}

export function archiveSpec(manifest: OpenSpecManifest, specId: string): OpenSpecSpec {
  const spec = manifest.specs.find((candidate) => candidate.id === specId);
  if (spec === undefined) {
    throw new ManifestError(`No existe el spec "${specId}" en ${OPENSPEC_FILENAME}.`);
  }
  if (spec.tasks.some((task) => task.status !== 'Done')) {
    throw new ManifestError(
      `No se puede archivar ${specId}: todavía tiene tareas que no están en estado Done.`
    );
  }
  spec.status = 'Archived';
  return spec;
}

export function refreshSpecStatus(spec: OpenSpecSpec): void {
  if (spec.status === 'Archived') {
    return;
  }
  if (spec.tasks.some((task) => task.status === 'Failed')) {
    spec.status = 'Failed';
    return;
  }
  if (spec.tasks.length > 0 && spec.tasks.every((task) => task.status === 'Done')) {
    spec.status = 'Verified';
    return;
  }
  spec.status = 'Proposed';
}

export function contextPath(manifest: OpenSpecManifest, context: string): string {
  const boundedContext = manifest.bounded_contexts?.find((candidate) => candidate.name === context);
  return boundedContext ? boundedContext.path : '';
}

export function buildTaskDocument(
  spec: OpenSpecSpec,
  task: OpenSpecTask,
  boundedContextPath = ''
): string {
  const files = task.files ?? [];
  const acceptance = task.acceptance ?? defaultAcceptance(task, files);
  const lines: string[] = [
    `# ${spec.title}`,
    '',
    `- Spec: ${spec.id}`,
    `- Task: ${task.id}`,
    `- Context: ${spec.context}`,
    `- Bounded context path: ${boundedContextPath || '(no definido)'}`,
    `- Prioridad: ${task.priority ?? '(no definida)'}`,
    `- Estimación: ${task.estimate ?? '(no definida)'}`,
    '',
    '## Descripción',
    '',
    task.description,
    '',
    '## Dependencias',
    '',
    ...(task.depends_on && task.depends_on.length > 0
      ? task.depends_on.map((dependency) => `- ${dependency}`)
      : ['- (ninguna)']),
    '',
    '## Archivos asignados',
    '',
    ...(files.length > 0 ? files.map((file) => `- ${file}`) : ['- (sin archivos asignados)']),
    '',
    '## Criterios de aceptación',
    '',
    ...acceptance.map((criterion) => `- [ ] ${criterion}`),
    '',
    '## Validación',
    '',
    ...(task.validation && task.validation.length > 0
      ? task.validation.map((command) => `- \`${command}\``)
      : ['- Usar los comandos de `validation.commands` del proyecto.']),
    '',
    '## Rollback',
    '',
    task.rollback ?? 'Revertir los cambios de esta tarea y restaurar el estado anterior.',
    '',
    '## Restricciones',
    '',
    '- Leer esta especificación y openspec.yaml antes de modificar el código.',
    '- No generar comentarios en el código: cero explicaciones, separadores, TODO/FIXME o JSDoc de relleno. Conservar solo los comentarios existentes.',
    '- Aplicar patrones de diseño universales y mantener el tipado estricto.',
    '- Validar con los comandos configurados antes de reportar la tarea como completada.',
    ''
  ];
  return lines.join('\n');
}

function defaultAcceptance(task: OpenSpecTask, files: string[]): string[] {
  const criteria = [`Implementar: ${task.description}`];
  if (files.length > 0) {
    criteria.push(`Modificar únicamente los archivos asignados: ${files.join(', ')}`);
  }
  criteria.push('La validación local finaliza con código de salida 0.');
  return criteria;
}

export function ensureTaskFile(
  spec: OpenSpecSpec,
  task: OpenSpecTask,
  boundedContextPath: string,
  root: string = process.cwd()
): string {
  ensureHarnessDirs(root);
  const target = taskFilePath(task.id, root);
  writeTextFile(target, buildTaskDocument(spec, task, boundedContextPath));
  return target;
}
