# Tijori

An Apple-style personal vault for Android — passwords and birthday reminders, built with React Native.

"Tijori" (तिजोरी) is the Hindi word for a locker or safe. This app is the home for the things
you want kept safe: your passwords, the people whose birthdays you must not forget, and the
notes and cards that go with them.

## What this is

A clean React Native implementation of the **Tijori** design, plus a GitHub Actions pipeline that
builds a debug `.apk` on every push.

The visual language is the iOS 18 idiom — inset grouped lists, translucent tab bars, generous
whitespace and soft depth — on Apple's system greys, with a single warm gold as the brand
signature. Typography pairs a serif (Fraunces in the design mockups; the platform serif on
device) for the brand and large moments with the system sans for UI text.

## Screens

| # | Screen | What it does |
|---|--------|--------------|
| 01 | Lock | Face ID / passcode entry point |
| 02 | Vault | Greeting, a "vault secured" summary card and the category grid |
| 03 | Passwords | Search, a security alert and the password list |
| 04 | Password detail | A single entry: fields, reveal, copy, change |
| 05 | Birthdays | "Next up" highlight and month-grouped reminders |
| 06 | Settings | Profile, security, data and about |

## Project structure

```
.
├── App.tsx                 # Root: lock state, tab state, nav bar
├── index.js                # React Native entry point
├── src/
│   ├── theme.ts            # Design tokens (colour, spacing, radius)
│   ├── data.ts             # Sample passwords and birthdays
│   ├── components.tsx      # Icon, Monogram, Card, ListRow, TabBar, …
│   └── screens.tsx         # Lock, Vault, Passwords, Birthdays, Settings
├── __tests__/              # Jest component tests
└── android/                # Native Android project (Gradle)
```

## Getting started

Requires Node 20+ and JDK 17 for the Android build.

```bash
npm install
npm start                # Metro bundler
npm run android          # Build and install on a device/emulator
```

## Checks

```bash
npm run typecheck        # tsc --noEmit
npm run lint             # eslint
npm test                 # jest
```

## Building the APK

Locally:

```bash
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

In CI, `.github/workflows/android.yml` runs on every push to `main` (and on pull requests and
manual dispatch). It installs Node 20, JDK 17 and the Android SDK, runs the typecheck, lint and
unit tests, then builds the debug APK and uploads it as the `tijori-debug-apk` artifact.

To install the built APK on a device:

```bash
adb install app-debug.apk
```

## Tech

- React Native 0.81.5, React 19.1, Hermes, New Architecture
- react-native-svg for iconography
- TypeScript, ESLint, Jest
