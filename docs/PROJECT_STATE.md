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
  `@react-native-clipboard/clipboard` (copy), `react-native-webview` (rich-text notes),
  `crypto-js` + `react-native-get-random-values` (encryption at rest)
- Navigation: hand-rolled tab state in `App.tsx` (no React Navigation)
- Design tokens in `src/theme.ts` - Apple system greys with a single warm gold accent

## Already merged to main
- Lock, Vault home, Passwords, Birthdays, Settings screens
- Passwords: CRUD, search, categories, favourites, copy-to-clipboard with auto-clear,
  a flexible "Username / ID" field, and an eye toggle inside the password box
- Birthdays: CRUD and a month calendar with marked dates
- Notes and Cards sections; Vault home shows real counts and opens each section
- `src/DraggableSheet.tsx` - one shared draggable bottom sheet used by every add/edit sheet
- Password generator + strength meter; Vault health (weak / reused / old passwords)
- Documents: Aadhaar, PAN, passport, driving licence, marksheets and similar, with photos
- Rich-text notes editor (WebView contenteditable) with a formatting toolbar
- Sheet motion rebuilt on Reanimated + Gesture Handler (springs, animated backdrop)

## In flight (pull requests pending)
- **Security - passcode lock and encryption at rest**: a first-run screen creates a
  passcode; the app is gated behind an unlock screen; every stored value is encrypted
  with AES-256-CBC under a key derived from the passcode via PBKDF2 (SHA-256);
  Settings can change the passcode. No biometrics and no native keychain were used,
  to avoid a fragile native build. Forgetting the passcode means the data cannot be
  recovered - this is stated on the setup screen.

## Quality rules (do not break these)
- No stray or temporary files in commits (`.diff`, `.patch`, `.orig`, `.rej`, `.bak`, editor backups)
- No reasoning / thinking-out-loud comments left in the code
- `npm run typecheck`, `npm run lint` and `npm test` must pass
- Keep the existing visual language (Apple-style, gold accent)

## Roadmap (not built yet)
- Document expiry dates and an "expiring soon" view; document packs / checklists
- A proper gold vault launcher icon; release signing with the user's own keystore;
  distribution decisions
