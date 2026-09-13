# StyleMate product specification

## Purpose

StyleMate is an Android-first visual repair editor for React Native and React/Next projects. It is designed for someone who wants to fix an app without having to understand the project as raw source code first.

The product must keep the project connected. A screen is never treated as an isolated copied file when its styles, theme, components, assets, or navigation live elsewhere.

## Core experience

1. Open a project folder.
2. Scan the project and build a dependency/connection map.
3. Show project-health findings in plain English.
4. Open one screen visually while preserving all shared connections.
5. Tap an element to see what controls it: component, style reference, defining file, theme variable, and final value.
6. Follow chains such as `HomeScreen.tsx -> HomeStyles.ts -> theme.ts`.
7. Highlight every element affected by a shared rule.
8. Preview a repair before applying it.
9. Apply to a safe working copy/snapshot, with undo and version history.

## Project Health scan

StyleMate should progressively detect:

- imports that point to missing files
- components that exist but are never used
- references to missing `StyleSheet` keys
- missing images, fonts, icons, and other assets
- stale import paths after renames
- theme variables that point nowhere
- screens that exist but are missing from navigation
- duplicated styles that have drifted apart
- copied styles that probably should share one source
- TypeScript errors that break component relationships
- for web React/Next: selectors that no longer match elements and winning/overridden CSS rules

Findings should be classified as:

- **Broken** — confirmed missing/bad connection
- **Probably disconnected** — strong evidence but needs user confirmation
- **Unused** — exists but currently has no known consumer

Never silently guess an ambiguous repair. Show candidates and let the user preview the result first.

## Inspector

When a visual element is selected, StyleMate should show:

- selected element/text
- component type and source file
- applied style reference(s)
- file where each style is defined
- imported theme/token chain
- final values such as font size, colour, spacing, border, alignment, width/height
- inherited/overridden values and the reason the visible result won

Plain-English controls are the default. Raw source is an advanced view.

## Shared-style safety

If a change affects multiple places, StyleMate must warn before applying it and show the affected screens/elements.

Actions:

- View affected screens
- Change everywhere
- Change only this element (create/localize an override)

## Repair flow

`Scan -> show problem -> preview fix -> apply -> test -> undo if needed`

Do not use a bulk “AI fixed everything” workflow.

## File safety

- The original project is never silently overwritten.
- Scanning is read-only.
- Repairs should operate through snapshots/working copies.
- Every write should have a reversible history entry.
- Opening a project from Google Drive or Android storage should not automatically upload the whole project to a backend.
- Server upload should only happen when a feature needs analysis/backup/AI assistance and should be visible to the user.

## React Native analysis

React Native does not use normal cascading CSS. StyleMate must trace:

- `StyleSheet.create()` entries
- imported style objects
- style arrays and later-value overrides
- inline style objects
- component props that alter appearance
- theme/tokens imported from other files

## React/Next web analysis

For web projects, analysis may need to trace:

- CSS modules
- global CSS
- inline styles
- Tailwind utilities
- CSS-in-JS/styled components
- selector specificity/inheritance
- winning and overridden rules

## First vertical slice

The current first implementation is Android-only and read-only. It requests permission for a project folder through Android's Storage Access Framework, recursively scans source files while excluding generated/heavy folders, extracts basic imports and React Native style references, and displays a project-health summary.

This scanner is intentionally conservative. Early unresolved links are reported as probable rather than claimed as definite failures until path-aware resolution is implemented.

## Planned next milestones

1. Path-aware import resolver and file tree.
2. Navigation, asset, theme and component-usage tracing.
3. Connection-map UI.
4. Source viewer + style inspector.
5. Visual screen preview and element selection.
6. Repair-preview engine with snapshots/undo.
7. Shared-style impact analysis.
8. Optional external AI assistance for ambiguous repair suggestions.
