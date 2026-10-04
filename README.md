# oto

A quiet place to listen, together. oto is an audiobook social network. You find a book, listen to it, say where you are in it, and talk it over with the people who are listening too.

This repository is a React Native app. It started out as **Eyy** and is being rebranded to oto. The source of truth for the design is the [oto design canvas](https://claude.ai/artifact/NtXhA3VnydXvCvepVidLL6).

## Requirements

- Node 18 (see `.nvmrc`)
- Xcode with CocoaPods for iOS, and Android Studio with JDK 11 for Android. Follow the React Native 0.70 [environment setup](https://reactnative.dev/docs/0.70/environment-setup).

## Getting started

```sh
npm install
(cd ios && pod install)   # iOS only
npm start                 # Metro bundler
npm run ios               # or: npm run android
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm start` | Starts Metro |
| `npm run ios` / `npm run android` | Builds the app and runs it on a simulator or device |
| `npm test` | Runs the Jest test suite |
| `npm run lint` | Runs ESLint over JS/TS sources |
| `npm run typecheck` | Type-checks the project with `tsc --noEmit` |
| `npm run build:tailwind` | Regenerates `tailwind.json` for `tailwind-rn` |

## Project layout

```
app/
  assets/      images and fonts
  components/  shared UI components
  navigator/   stack and tab navigators
  screens/     one folder per screen
  utils/       mock data and helpers
__tests__/     Jest tests
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
