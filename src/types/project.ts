export type FindingSeverity = 'broken' | 'probable' | 'unused' | 'info';

export type ProjectFile = {
  uri: string;
  name: string;
  extension: string;
  imports: string[];
  styleReferences: string[];
  styleDefinitions: string[];
};

export type ProjectFinding = {
  id: string;
  severity: FindingSeverity;
  title: string;
  detail: string;
  fileName: string;
};

export type ProjectScan = {
  rootUri: string;
  files: ProjectFile[];
  findings: ProjectFinding[];
  connectionCount: number;
  skippedCount: number;
  limited: boolean;
};
