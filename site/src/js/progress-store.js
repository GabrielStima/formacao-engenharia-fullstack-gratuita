export const STORAGE_KEY = 'fullstack-course-progress';

const SCHEMA_VERSION = 1;
const DEFAULT_THEME = 'dark';
const THEMES = new Set(['dark', 'light']);

function sortedUniqueIds(value) {
  if (
    !Array.isArray(value)
    && !(value instanceof Set)
  ) {
    return [];
  }

  return [...new Set([...value].filter((id) => typeof id === 'string' && id.length > 0))]
    .sort((left, right) => left.localeCompare(right));
}

function emptyState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    completedLessonIds: [],
    theme: DEFAULT_THEME,
    updatedAt: null,
  };
}

function normalizeState(value) {
  if (!value || value.schemaVersion !== SCHEMA_VERSION) {
    return emptyState();
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    completedLessonIds: sortedUniqueIds(value.completedLessonIds),
    theme: THEMES.has(value.theme) ? value.theme : DEFAULT_THEME,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
  };
}

function backupError() {
  return new Error('Backup incompatível com esta versão do curso.');
}

export function progressFor(completedLessonIds, lessonIds) {
  const completedSet = new Set(sortedUniqueIds(completedLessonIds));
  const lessons = sortedUniqueIds(lessonIds);
  const completed = lessons.filter((id) => completedSet.has(id)).length;
  const total = lessons.length;

  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function importProgress(json, knownLessonIds) {
  let backup;

  try {
    backup = JSON.parse(json);
  } catch {
    throw backupError();
  }

  if (
    !backup
    || backup.schemaVersion !== SCHEMA_VERSION
    || !Array.isArray(backup.completedLessonIds)
    || backup.completedLessonIds.some((id) => typeof id !== 'string')
  ) {
    throw backupError();
  }

  const knownIds = new Set(sortedUniqueIds(knownLessonIds));
  const importedIds = sortedUniqueIds(backup.completedLessonIds);

  return {
    completedLessonIds: importedIds.filter((id) => knownIds.has(id)),
    ignoredLessonIds: importedIds.filter((id) => !knownIds.has(id)),
  };
}

export function createProgressStore(storage = globalThis.localStorage, now = () => new Date()) {
  let available = Boolean(
    storage
    && typeof storage.getItem === 'function'
    && typeof storage.setItem === 'function'
  );
  let state = emptyState();

  if (available) {
    try {
      const storedState = storage.getItem(STORAGE_KEY);
      state = storedState ? normalizeState(JSON.parse(storedState)) : emptyState();
    } catch {
      available = false;
    }
  }

  function snapshot() {
    return {
      ...state,
      completedLessonIds: [...state.completedLessonIds],
    };
  }

  function save() {
    state.updatedAt = now().toISOString();

    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      available = false;
    }
  }

  function replace(completedLessonIds) {
    state.completedLessonIds = sortedUniqueIds(completedLessonIds);
    save();
    return snapshot();
  }

  function isCompleted(lessonId) {
    return state.completedLessonIds.includes(lessonId);
  }

  return {
    get available() {
      return available;
    },

    get state() {
      return snapshot();
    },

    isCompleted,

    toggle(lessonId) {
      const completed = !isCompleted(lessonId);
      const lessonIds = new Set(state.completedLessonIds);

      if (completed) {
        lessonIds.add(lessonId);
      } else {
        lessonIds.delete(lessonId);
      }

      replace([...lessonIds]);
      return completed;
    },

    setTheme(theme) {
      if (!THEMES.has(theme)) {
        throw new Error(`Tema inválido: ${theme}`);
      }

      state.theme = theme;
      save();
      return theme;
    },

    replace,

    merge(completedLessonIds) {
      return replace([...state.completedLessonIds, ...sortedUniqueIds(completedLessonIds)]);
    },

    clear() {
      return replace([]);
    },

    export() {
      return JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        exportedAt: now().toISOString(),
        completedLessonIds: [...state.completedLessonIds],
      }, null, 2);
    },
  };
}
