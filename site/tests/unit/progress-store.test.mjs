import assert from 'node:assert/strict';
import test from 'node:test';

import {
  STORAGE_KEY,
  createProgressStore,
  importProgress,
  progressFor,
} from '../../src/js/progress-store.js';

const NOW = '2026-06-22T12:00:00.000Z';

function createMemoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));

  return {
    data,
    getItem(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

test('alterna uma aula e persiste um estado versionado', () => {
  const storage = createMemoryStorage();
  const store = createProgressStore(storage, () => new Date(NOW));

  assert.equal(store.toggle('00.01'), true);
  assert.equal(store.isCompleted('00.01'), true);
  assert.deepEqual(JSON.parse(storage.data.get(STORAGE_KEY)), {
    schemaVersion: 1,
    completedLessonIds: ['00.01'],
    theme: 'dark',
    updatedAt: NOW,
  });

  assert.equal(store.toggle('00.01'), false);
  assert.equal(store.isCompleted('00.01'), false);
});

test('calcula o progresso somente para as aulas informadas', () => {
  assert.deepEqual(progressFor(['00.01', '99.99'], ['00.01', '00.02']), {
    completed: 1,
    total: 2,
    percent: 50,
  });
  assert.deepEqual(progressFor(['00.01'], []), {
    completed: 0,
    total: 0,
    percent: 0,
  });
});

test('importa apenas IDs conhecidos e informa os ignorados', () => {
  const result = importProgress(JSON.stringify({
    schemaVersion: 1,
    completedLessonIds: ['00.02', 'removida', '00.02'],
  }), new Set(['00.01', '00.02']));

  assert.deepEqual(result, {
    completedLessonIds: ['00.02'],
    ignoredLessonIds: ['removida'],
  });
});

test('rejeita backups inválidos ou de outra versão', () => {
  assert.throws(() => importProgress('{não é json', ['00.01']), /Backup incompatível/);
  assert.throws(() => importProgress(JSON.stringify({
    schemaVersion: 2,
    completedLessonIds: [],
  }), ['00.01']), /Backup incompatível/);
  assert.throws(() => importProgress(JSON.stringify({
    schemaVersion: 1,
    completedLessonIds: '00.01',
  }), ['00.01']), /Backup incompatível/);
});

test('mescla ou substitui o progresso importado de forma determinística', () => {
  const store = createProgressStore(createMemoryStorage(), () => new Date(NOW));
  store.replace(['00.02', '00.01', '00.02']);
  assert.deepEqual(store.state.completedLessonIds, ['00.01', '00.02']);

  store.merge(['00.03', '00.02']);
  assert.deepEqual(store.state.completedLessonIds, ['00.01', '00.02', '00.03']);

  store.replace(['00.04']);
  assert.deepEqual(store.state.completedLessonIds, ['00.04']);
});

test('limpa somente as conclusões e preserva a preferência de tema', () => {
  const store = createProgressStore(createMemoryStorage(), () => new Date(NOW));
  store.setTheme('light');
  store.replace(['00.01']);

  store.clear();

  assert.deepEqual(store.state.completedLessonIds, []);
  assert.equal(store.state.theme, 'light');
});

test('exporta um backup portátil com data e versão', () => {
  const store = createProgressStore(createMemoryStorage(), () => new Date(NOW));
  store.replace(['00.02', '00.01']);

  assert.deepEqual(JSON.parse(store.export()), {
    schemaVersion: 1,
    exportedAt: NOW,
    completedLessonIds: ['00.01', '00.02'],
  });
});

test('continua funcional em memória quando localStorage não está disponível', () => {
  const storage = {
    getItem() {
      throw new Error('bloqueado');
    },
    setItem() {
      throw new Error('bloqueado');
    },
  };
  const store = createProgressStore(storage, () => new Date(NOW));

  assert.equal(store.available, false);
  assert.equal(store.toggle('00.01'), true);
  assert.equal(store.isCompleted('00.01'), true);
});

test('identifica a ausência completa da API de storage', () => {
  const store = createProgressStore(undefined, () => new Date(NOW));

  assert.equal(store.available, false);
  assert.equal(store.toggle('00.01'), true);
});

test('normaliza um estado persistido parcialmente corrompido', () => {
  const storage = createMemoryStorage({
    [STORAGE_KEY]: JSON.stringify({
      schemaVersion: 1,
      completedLessonIds: ['00.02', null, '00.01', '00.02'],
      theme: 'ultravioleta',
      updatedAt: 42,
    }),
  });

  const store = createProgressStore(storage, () => new Date(NOW));

  assert.deepEqual(store.state, {
    schemaVersion: 1,
    completedLessonIds: ['00.01', '00.02'],
    theme: 'dark',
    updatedAt: null,
  });
});
