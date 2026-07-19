// Модули приложения (db.ts) создают Dexie-инстанс на уровне модуля —
// без полифилла IndexedDB это падает при обычном импорте в Node.
import 'fake-indexeddb/auto';
