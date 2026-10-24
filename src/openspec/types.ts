export type SpecificationStatus = 'Proposed' | 'Verified' | 'Archived' | 'Failed';
export type TaskStatus = 'Pending' | 'InProgress' | 'Done' | 'Failed';

export interface OpenSpecTask {
  id: string;
  description: string;
  status: TaskStatus;
  files?: string[];
  acceptance?: string[];
}

export interface OpenSpecSpec {
  id: string;
  title: string;
  status: SpecificationStatus;
  context: string;
  tasks: OpenSpecTask[];
}

export interface BoundedContext {
  name: string;
  path: string;
}

export interface OpenSpecManifest {
  specification: string;
  project: string;
  bounded_contexts?: BoundedContext[];
  specs: OpenSpecSpec[];
}

export interface WorkItem {
  spec: OpenSpecSpec;
  task: OpenSpecTask;
}
