import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';

import { parseCourse } from '../../scripts/lib/course-parser.mjs';

const root = resolve('tests/fixtures/course');

test('monta a hierarquia oficial do curso', async () => {
  const course = await parseCourse(root);

  assert.equal(course.phases[0].title, 'Fundamentos');
  assert.equal(course.phases[0].modules[0].id, '00');
  assert.equal(
    course.phases[0].modules[0].summary,
    'Aprender como usar a formação.',
  );
  assert.deepEqual(
    course.phases[0].modules[0].lessons.map(({ id }) => id),
    ['00.00'],
  );
  assert.equal(course.phases[0].modules[0].exercises.length, 1);
});

test('rejeita aula indexada sem arquivo', async () => {
  await assert.rejects(
    () => parseCourse(root, {
      readFile: async (file, encoding) => {
        if (file.endsWith('README.md')) {
          return [
            '# Introdução',
            '## Aulas',
            '| Ordem | Aula | Tipo | Status |',
            '|---|---|---|---|',
            '| 00.99 | [Ausente](00.99-ausente.md) | Específica | Auditada |',
          ].join('\n');
        }

        return (await import('node:fs/promises')).readFile(file, encoding);
      },
    }),
    /00\.99-ausente\.md/,
  );
});
