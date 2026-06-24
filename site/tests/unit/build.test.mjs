import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

import { buildSite } from '../../scripts/build.mjs';

test('gera catálogo, fragmentos, shell, assets e relatório', async (t) => {
  const outputRoot = await mkdtemp(join(tmpdir(), 'course-site-'));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));

  const result = await buildSite({
    courseRoot: resolve('tests/fixtures/course'),
    sourceRoot: resolve('tests/fixtures/site'),
    outputRoot,
    now: () => new Date('2026-06-22T12:00:00Z'),
  });
  const catalog = JSON.parse(await readFile(
    join(outputRoot, 'data/catalog.json'),
    'utf8',
  ));
  const lesson = catalog.phases[0].modules[0].lessons[0];
  const report = JSON.parse(await readFile(
    join(outputRoot, 'build-report.json'),
    'utf8',
  ));

  assert.deepEqual(catalog.counts, {
    phases: 1,
    modules: 1,
    lessons: 1,
    exercises: 1,
  });
  assert.equal(catalog.generatedAt, '2026-06-22T12:00:00.000Z');
  assert.equal('sourcePath' in lesson, false);
  assert.match(
    await readFile(join(outputRoot, lesson.contentUrl), 'utf8'),
    /Boas-vindas/,
  );
  assert.equal(
    await readFile(join(
      outputRoot,
      'course-assets/assets/banner.png',
    ), 'utf8'),
    'fixture-image\n',
  );
  assert.equal(
    await readFile(join(outputRoot, 'marker.txt'), 'utf8'),
    'shell-fixture\n',
  );
  assert.deepEqual(report.errors, []);
  assert.deepEqual(result, report);
});

test('gera conteúdo antes de a pasta src existir', async (t) => {
  const outputRoot = await mkdtemp(join(tmpdir(), 'course-site-no-src-'));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));

  const result = await buildSite({
    courseRoot: resolve('tests/fixtures/course'),
    sourceRoot: resolve('tests/fixtures/source-that-does-not-exist'),
    outputRoot,
    now: () => new Date('2026-06-22T12:00:00Z'),
  });

  assert.equal(result.counts.lessons, 1);
  assert.equal(
    JSON.parse(await readFile(
      join(outputRoot, 'data/catalog.json'),
      'utf8',
    )).counts.lessons,
    1,
  );
});
