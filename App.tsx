import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { pickAndScanProject } from './src/services/projectScanner';
import { theme } from './src/theme';
import type { ProjectFinding, ProjectScan } from './src/types/project';

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FindingRow({ finding }: { finding: ProjectFinding }) {
  const isBroken = finding.severity === 'broken';

  return (
    <View style={[styles.finding, isBroken ? styles.findingBroken : styles.findingWarning]}>
      <View style={styles.findingHeadingRow}>
        <Text style={[styles.findingSeverity, isBroken ? styles.dangerText : styles.warningText]}>
          {finding.severity.toUpperCase()}
        </Text>
        <Text style={styles.findingFile}>{finding.fileName}</Text>
      </View>
      <Text style={styles.findingTitle}>{finding.title}</Text>
      <Text style={styles.findingDetail}>{finding.detail}</Text>
    </View>
  );
}

export default function App() {
  const [scan, setScan] = useState<ProjectScan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openProject() {
    setBusy(true);
    setError(null);

    try {
      const result = await pickAndScanProject();
      if (result) setScan(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'StyleMate could not open that project folder.');
    } finally {
      setBusy(false);
    }
  }

  const visibleFindings = scan?.findings.slice(0, 12) ?? [];
  const visibleFiles = scan?.files.slice(0, 12) ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>StyleMate</Text>
          <Text style={styles.heading}>Open a project. See what is connected and what is not.</Text>
          <Text style={styles.intro}>
            StyleMate reads the project as a connected set of files so it can trace imports, styles and broken links without changing your source.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={openProject}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && !busy ? styles.primaryButtonPressed : null,
            busy ? styles.primaryButtonDisabled : null,
          ]}
        >
          {busy ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={theme.colors.primaryText} />
              <Text style={styles.primaryButtonText}>Scanning project…</Text>
            </View>
          ) : (
            <Text style={styles.primaryButtonText}>Open project folder</Text>
          )}
        </Pressable>

        <Text style={styles.readOnlyNote}>Read-only scan. StyleMate does not modify the selected project yet.</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Could not scan project</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {scan ? (
          <View style={styles.results}>
            <Text style={styles.sectionTitle}>Project health</Text>

            <View style={styles.statsRow}>
              <Stat label="Files mapped" value={scan.files.length} />
              <Stat label="Connections" value={scan.connectionCount} />
              <Stat label="Findings" value={scan.findings.length} />
            </View>

            {scan.limited ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  This project is large. The first scan stopped at 600 source files so the phone stays responsive.
                </Text>
              </View>
            ) : null}

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Connections that need checking</Text>
              {visibleFindings.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>No obvious broken connections found in the first pass.</Text>
                  <Text style={styles.emptyText}>
                    Later scans will add navigation, theme, asset, component-usage and CSS tracing.
                  </Text>
                </View>
              ) : (
                visibleFindings.map((finding) => <FindingRow key={finding.id} finding={finding} />)
              )}
              {scan.findings.length > visibleFindings.length ? (
                <Text style={styles.moreText}>Showing the first {visibleFindings.length} findings.</Text>
              ) : null}
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Files mapped</Text>
              <View style={styles.fileList}>
                {visibleFiles.map((file) => (
                  <View key={file.uri} style={styles.fileRow}>
                    <Text numberOfLines={1} style={styles.fileName}>
                      {file.name}
                    </Text>
                    <Text style={styles.fileMeta}>
                      {file.imports.length} imports · {file.styleReferences.length} style refs
                    </Text>
                  </View>
                ))}
              </View>
              {scan.files.length > visibleFiles.length ? (
                <Text style={styles.moreText}>Showing the first {visibleFiles.length} mapped files.</Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  page: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: 48,
  },
  header: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  brand: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  heading: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.1,
    lineHeight: 39,
  },
  intro: {
    color: theme.colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  primaryButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
  },
  primaryButtonPressed: {
    opacity: 0.82,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: theme.colors.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  readOnlyNote: {
    marginTop: theme.spacing.sm,
    color: theme.colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  results: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  sectionBlock: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  stat: {
    flex: 1,
    minHeight: 88,
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: theme.spacing.xs,
    color: theme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  finding: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  findingWarning: {
    backgroundColor: theme.colors.warningSurface,
    borderColor: '#F1D59B',
  },
  findingBroken: {
    backgroundColor: theme.colors.dangerSurface,
    borderColor: '#F0B6B6',
  },
  findingHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  findingSeverity: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  warningText: {
    color: theme.colors.warning,
  },
  dangerText: {
    color: theme.colors.danger,
  },
  findingFile: {
    flex: 1,
    color: theme.colors.muted,
    fontSize: 12,
    textAlign: 'right',
  },
  findingTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  findingDetail: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  fileList: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
  },
  fileRow: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  fileName: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  fileMeta: {
    marginTop: 3,
    color: theme.colors.muted,
    fontSize: 12,
  },
  notice: {
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.warningSurface,
    padding: theme.spacing.md,
  },
  noticeText: {
    color: theme.colors.warning,
    fontSize: 13,
    lineHeight: 19,
  },
  emptyBox: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  moreText: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  errorBox: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.dangerSurface,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  errorTitle: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    lineHeight: 19,
  },
});
