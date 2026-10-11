# Tijori - project state

Tijori (tijori = "locker") is an Apple-style personal vault app for Android, built with React Native.
It holds passwords, birthday reminders, notes, cards and personal/government documents.

## Repository
- GitHub: `Pratyush061/tijori-app` (private). The repo is **`tijori-app`**, not `tijori`.
- Default branch: `main`. Work arrives as pull requests (opened by Google Jules) and is squash-merged.
- CI: `.github/workflows/android.yml` runs on every push and PR - Typecheck, Lint, Unit tests,
  then a debug APK and an **arm64-only release APK** uploaded as the artifact `tijori-release-apk`.

## Stack
- React Native 0.81.5, React 19.1, Hermes, New Architecture, TypeScript
- `react-native-svg` (icons), `@react-native-async-storage/async-storage` (storage),
  `@react-native-clipboard/clipboard` (copy)
- `react-native-gesture-handler` (~2.28.0) and `react-native-reanimated` (~3.19.3) - these versions
  compile against RN 0.81.5; older Reanimated (e.g. 3.16.x) fails the native APK build
- `react-native-webview` and `@10play/tentap-editor` (rich-text notes); `react-native-image-picker`
  and `react-native-fs` (document photos)
- Navigation: hand-rolled tab state in `App.tsx` (no React Navigation)
- Design tokens in `src/theme.ts` - Apple system greys with a single warm gold accent

## Already merged to main
- Lock, Vault home, Passwords, Birthdays, Settings screens
- Passwords: CRUD, search, categories, favourites, copy-to-clipboard with auto-clear,
  a flexible "Username / ID" field, an eye toggle inside the password box, plus a password
  generator, a strength meter and vault health
- Birthdays: CRUD and a month calendar with marked dates
- Notes and Cards sections; Vault home shows real counts and opens each section
- Notes: full-screen rich-text editor (webview-based) with a formatting toolbar
- Documents: store Aadhaar, PAN, passport, marksheets and similar, with photos
- `src/DraggableSheet.tsx` - one shared draggable bottom sheet used by every add/edit sheet,
  rebuilt on react-native-gesture-handler + reanimated for smooth UI-thread motion
- Polish: custom launcher icons, empty states and accessibility

## In flight (pull requests pending)
- **Security**: real app lock (biometric + passcode with a hint), encryption at rest,
  working Settings (auto-lock timing, change passcode), and dark mode. The earlier branch
  conflicted with main, so a clean re-apply task is queued in `.jules/tasks.json`.
- **PR #12 - Sheet motion + rich-text notes editor**: open, currently failing CI at the
  Typecheck step (`src/RichEditor.tsx`).

## Quality rules (do not break these)
- No stray or temporary files in commits (`.diff`, `.patch`, `.orig`, `.rej`, `.bak`, editor backups)
- No reasoning / thinking-out-loud comments left in the code
- `npm run typecheck`, `npm run lint` and `npm test` must pass
- Keep the existing visual language (Apple-style, gold accent)

## Roadmap (not built yet)
- Document expiry dates and an "expiring soon" view; document packs / checklists
- Release signing; distribution decisions
