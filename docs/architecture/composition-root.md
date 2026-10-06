# Application composition root

`app/composition/ApplicationContainer.ts` is the only application-level place
that chooses concrete implementations for the current runtime graph.

The container currently composes:

- seed catalogue and audio-rendition repositories for the prototype catalogue;
- observable library/progress repositories;
- `LibraryService`;
- the React-facing `LibraryProviderAdapter`;
- a lazy OP-SQLite database factory.

React providers receive already-composed dependencies. They do not choose the
catalogue, repository, database or service implementations themselves.

The SQLite factory is deliberately lazy so importing the app graph in unit
tests does not install a native JSI module. Persistence migration to the
provider UI can therefore happen incrementally without coupling React tests to
the native database.
