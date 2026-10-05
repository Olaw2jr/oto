# ADR-001: Local database driver

Status: Accepted

## Decision

oto will use SQLite for durable application state and keep database access behind the `SqlDatabase`, repository and storage contracts.

The intended native driver is `@op-engineering/op-sqlite`.

## Why

- supports bare React Native on Android and iOS;
- works with the React Native New Architecture;
- provides synchronous and asynchronous SQLite APIs;
- supports SQLCipher if oto later needs encrypted database files;
- exposes reactive queries if offline-first UI needs them;
- uses the MIT license;
- does not require oto to adopt libSQL or Turso.

Application code must not import OP-SQLite directly. Only the native database adapter may depend on it.

## Alternatives considered

### react-native-nitro-sqlite

A strong alternative built on Nitro Modules and compatible with React Native 0.75+. Its smaller API is attractive, but OP-SQLite currently gives oto more room for SQLCipher, reactive queries and future database features.

### expo-sqlite

Well maintained, but oto is a bare React Native application and does not otherwise depend on Expo modules.

## References

- https://op-engineering.github.io/op-sqlite/docs/installation/
- https://github.com/OP-Engineering/op-sqlite
- https://sqlite.margelo.com/docs
