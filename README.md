# StyleMate

StyleMate is an Android-first visual project repair editor for React Native and React/Next projects.

The goal is to let a non-coder open a real project as a connected set of files, inspect a screen visually, understand what controls each element, find broken connections, preview repairs, and apply changes safely with undo/version history.

## First milestone

The first vertical slice is intentionally read-only:

1. Open a project folder on Android.
2. Read supported source files through Android's Storage Access Framework.
3. Build a lightweight project map from imports and style references.
4. Report broken or suspicious connections in plain English.
5. Do not modify the opened project yet.

## Product rules

- Open the whole project, not isolated copied screens.
- Keep shared components, styles, themes, and imports connected.
- Explain problems in plain English rather than dumping compiler output.
- Preview every repair before writing source files.
- Never silently overwrite the original project.
- Keep snapshots/version history and support undo.
- Warn when a shared style will affect multiple screens.
- Support React Native StyleSheet tracing and web React/Next CSS tracing as separate analysis modes.

## Tech direction

- React Native + TypeScript
- React Native `StyleSheet` for StyleMate's own UI
- Expo SDK 57 foundation for Android device access
- Android Storage Access Framework for project-folder access
- External AI API later for assisted diagnosis; no self-hosted model required

See `docs/PRODUCT.md` for the working product specification.
