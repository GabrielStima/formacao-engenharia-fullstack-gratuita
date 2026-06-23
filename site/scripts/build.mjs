import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import {
  isAbsolute,
  normalize,
  relative,
  resolve,
  sep,
} from 'node:path';
import { pathToFileURL } from 'node:url';

import { parseCourse } from './lib/course-parser.mjs';
import { renderMarkdown } from './lib/markdown-renderer.mjs';
import {
  copyAsset,
  copySource,
  prepareOutput,
  writeText,
} from './lib/output-writer.mjs';

const REPOSITORY_SOURCE_URL = [
  'https://github.com/GabrielStima',
  'formacao-engenharia-fullstack-gratuita/blob/main',
].join('/');

function repositoryRelativePath(courseRoot, source) {
  const sourceRelative = relative(courseRoot, source);

  if (sourceRelative.startsWith(`..${sep}`) || isAbsolute(sourceRelative)) {
    throw new Error(`Caminho fora do repositório: ${source}`);
  }

  return sourceRelative.replaceAll('\\', '/');
}

export async function buildSite({
  courseRoot = resolve('..'),
  sourceRoot = resolve('src'),
  outputRoot = resolve('dist'),
  now = () => new Date(),
} = {}) {
  const course = await parseCourse(courseRoot);
  const modules = course.phases.flatMap((phase) => phase.modules);
  const lessons = modules.flatMap((module) => module.lessons);
  const exercises = modules.flatMap((module) => module.exercises);
  const lookup = new Map([
    ...lessons.map((lesson) => [
      normalize(lesson.sourcePath),
      {
        kind: 'lesson',
        slug: lesson.fileName.replace(/\.md$/, ''),
      },
    ]),
    ...exercises.map((exercise) => [
      normalize(exercise.sourcePath),
      {
        kind: 'exercise',
        slug: exercise.fileName.replace(/\.md$/, ''),
      },
    ]),
  ]);
  const assets = new Map();

  await prepareOutput(outputRoot);
  await copySource(sourceRoot, outputRoot);

  for (const content of [...lessons, ...exercises]) {
    const markdown = await readFile(content.sourcePath, 'utf8');

    if (content.id.includes(':')) {
      content.title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim()
        ?? content.title;
    }

    const moduleId = content.id.split(/[.:]/)[0];
    const slug = content.fileName.replace(/\.md$/, '');
    content.slug = slug;
    content.contentUrl = `content/${moduleId}/${slug}.html`;
    content.sourceUrl = `${REPOSITORY_SOURCE_URL}/${repositoryRelativePath(
      courseRoot,
      content.sourcePath,
    )}`;
    const assetUrlFor = (source) => {
      const sourceRelative = repositoryRelativePath(courseRoot, source);
      const target = `course-assets/${sourceRelative}`;
      assets.set(source, target);
      return target;
    };
    const sourceUrlFor = (source) => {
      if (!existsSync(source)) {
        throw new Error(
          `Link interno não encontrado em ${content.sourcePath}: ${source}`,
        );
      }

      return `${REPOSITORY_SOURCE_URL}/${repositoryRelativePath(
        courseRoot,
        source,
      )}`;
    };
    const html = renderMarkdown(markdown, {
      sourcePath: content.sourcePath,
      contentLookup: lookup,
      assetUrlFor,
      sourceUrlFor,
    });

    await writeText(outputRoot, content.contentUrl, html);
    delete content.sourcePath;
    delete content.fileName;
  }

  for (const [source, target] of assets) {
    await copyAsset(source, outputRoot, target);
  }

  for (const module of modules) delete module.root;

  const counts = {
    phases: course.phases.length,
    modules: modules.length,
    lessons: lessons.length,
    exercises: exercises.length,
  };
  const catalog = {
    schemaVersion: 1,
    generatedAt: now().toISOString(),
    counts,
    phases: course.phases,
  };
  const report = { counts, errors: [], warnings: [] };

  await writeText(
    outputRoot,
    'data/catalog.json',
    JSON.stringify(catalog),
  );
  await writeText(
    outputRoot,
    'build-report.json',
    JSON.stringify(report, null, 2),
  );

  return report;
}

if (
  process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const result = await buildSite();
  console.log([
    'Build concluído:',
    `${result.counts.phases} fases,`,
    `${result.counts.modules} módulos,`,
    `${result.counts.lessons} aulas,`,
    `${result.counts.exercises} exercícios.`,
  ].join(' '));
}
