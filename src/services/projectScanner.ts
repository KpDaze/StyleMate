import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import type { ProjectFile, ProjectFinding, ProjectScan } from '../types/project';

const { StorageAccessFramework } = FileSystem;

const SOURCE_FILE = /\.(tsx?|jsx?|css|scss|json)$/i;
const MAX_FILES = 600;
const MAX_DEPTH = 12;
const IGNORED_NAMES = new Set([
  'node_modules',
  '.git',
  '.expo',
  'dist',
  'build',
  '.next',
  'coverage',
]);

function getName(uri: string): string {
  const decoded = decodeURIComponent(uri).split('?')[0] ?? uri;
  const slashPart = decoded.split('/').filter(Boolean).at(-1) ?? decoded;
  return slashPart.split(':').filter(Boolean).at(-1) ?? slashPart;
}

function getExtension(name: string): string {
  const match = name.match(/\.([A-Za-z0-9]+)$/);
  return match?.[1]?.toLowerCase() ?? '';
}

function withoutExtension(name: string): string {
  return name.replace(/\.(tsx?|jsx?|css|scss|json)$/i, '');
}

function extractImports(source: string): string[] {
  const imports = new Set<string>();
  const patterns = [
    /(?:import|export)\s+(?:[^'\"]*?\s+from\s+)?['\"]([^'\"]+)['\"]/g,
    /require\(\s*['\"]([^'\"]+)['\"]\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const value = match[1];
      if (value) imports.add(value);
    }
  }

  return [...imports];
}

function extractStyleReferences(source: string): string[] {
  const refs = new Set<string>();
  for (const match of source.matchAll(/\bstyles\.([A-Za-z_$][\w$]*)/g)) {
    const value = match[1];
    if (value) refs.add(value);
  }
  return [...refs];
}

function extractStyleDefinitions(source: string): string[] {
  const marker = source.indexOf('StyleSheet.create');
  if (marker < 0) return [];

  const openBrace = source.indexOf('{', marker);
  if (openBrace < 0) return [];

  const definitions = new Set<string>();
  const lines = source.slice(openBrace).split('\n');
  let depth = 0;

  for (const line of lines) {
    if (depth === 1) {
      const key = line.match(/^\s*([A-Za-z_$][\w$]*)\s*:\s*\{/i)?.[1];
      if (key) definitions.add(key);
    }

    const opens = (line.match(/\{/g) ?? []).length;
    const closes = (line.match(/\}/g) ?? []).length;
    depth += opens - closes;

    if (depth <= 0 && definitions.size > 0) break;
  }

  return [...definitions];
}

function localImportTarget(importPath: string): string | null {
  if (!importPath.startsWith('.')) return null;
  const target = importPath.split('/').filter(Boolean).at(-1);
  if (!target || target === '.' || target === '..') return null;
  return withoutExtension(target);
}

function buildFindings(files: ProjectFile[]): {
  findings: ProjectFinding[];
  connectionCount: number;
} {
  const findings: ProjectFinding[] = [];
  const fileStems = new Set(files.map((file) => withoutExtension(file.name)));
  let connectionCount = 0;

  for (const file of files) {
    for (const importPath of file.imports) {
      const target = localImportTarget(importPath);
      if (!target) continue;

      const connected = fileStems.has(target) || fileStems.has('index');
      if (connected) {
        connectionCount += 1;
      } else {
        findings.push({
          id: `import:${file.uri}:${importPath}`,
          severity: 'probable',
          title: 'Import may be disconnected',
          detail: `${file.name} imports “${importPath}”, but this first-pass scan could not find a matching source file.`,
          fileName: file.name,
        });
      }
    }

    if (file.styleDefinitions.length > 0) {
      const definitions = new Set(file.styleDefinitions);
      for (const reference of file.styleReferences) {
        if (!definitions.has(reference)) {
          findings.push({
            id: `style:${file.uri}:${reference}`,
            severity: 'probable',
            title: 'Style reference needs checking',
            detail: `${file.name} uses styles.${reference}, but that key was not found in its local StyleSheet.create block.`,
            fileName: file.name,
          });
        }
      }
    }
  }

  return { findings, connectionCount };
}

async function readProjectFiles(rootUri: string): Promise<{
  files: ProjectFile[];
  skippedCount: number;
  limited: boolean;
}> {
  const files: ProjectFile[] = [];
  let skippedCount = 0;
  let limited = false;

  async function visit(uri: string, depth: number): Promise<void> {
    if (files.length >= MAX_FILES) {
      limited = true;
      return;
    }

    if (depth > MAX_DEPTH) {
      skippedCount += 1;
      return;
    }

    const name = getName(uri);
    if (IGNORED_NAMES.has(name)) {
      skippedCount += 1;
      return;
    }

    try {
      const children = await StorageAccessFramework.readDirectoryAsync(uri);
      for (const child of children) {
        await visit(child, depth + 1);
        if (files.length >= MAX_FILES) break;
      }
      return;
    } catch {
      // A regular file is expected to fail directory enumeration.
    }

    if (!SOURCE_FILE.test(name)) {
      skippedCount += 1;
      return;
    }

    try {
      const source = await StorageAccessFramework.readAsStringAsync(uri);
      files.push({
        uri,
        name,
        extension: getExtension(name),
        imports: extractImports(source),
        styleReferences: extractStyleReferences(source),
        styleDefinitions: extractStyleDefinitions(source),
      });
    } catch {
      skippedCount += 1;
    }
  }

  await visit(rootUri, 0);
  return { files, skippedCount, limited };
}

export async function scanProjectFolder(rootUri: string): Promise<ProjectScan> {
  const { files, skippedCount, limited } = await readProjectFiles(rootUri);
  const { findings, connectionCount } = buildFindings(files);

  return {
    rootUri,
    files,
    findings,
    connectionCount,
    skippedCount,
    limited,
  };
}

export async function pickAndScanProject(): Promise<ProjectScan | null> {
  if (Platform.OS !== 'android') {
    throw new Error('Project-folder access is currently implemented for Android first.');
  }

  const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted) return null;

  return scanProjectFolder(permission.directoryUri);
}
