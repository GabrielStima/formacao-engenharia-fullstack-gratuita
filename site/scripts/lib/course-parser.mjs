import {
  access,
  readFile as fsReadFile,
  readdir,
} from 'node:fs/promises';
import { basename, join } from 'node:path';

const MODULE_ID = /^(\d{2}(?:[ab])?)-/i;
const LESSON_ROW = /^\|\s*([^|]+?)\s*\|\s*\[([^\]]+)\]\(([^)]+\.md)\)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/;

const plainText = (value = '') => value
  .replace(/<[^>]*>/g, '')
  .replace(/[*_`]/g, '')
  .trim();

function section(markdown, heading) {
  const start = markdown.indexOf(`## ${heading}`);
  if (start < 0) return '';

  const rest = markdown.slice(start + heading.length + 3);
  const end = rest.search(/^##\s/m);
  return end < 0 ? rest : rest.slice(0, end);
}

function moduleDirectories(entries) {
  return entries
    .filter((entry) => entry.isDirectory() && MODULE_ID.test(entry.name))
    .sort((a, b) => a.name.localeCompare(
      b.name,
      'pt-BR',
      { numeric: true },
    ));
}

function phaseForModule(phases, curriculum, moduleId) {
  const marker = new RegExp(
    `^###\\s+${moduleId.replace('a', 'A').replace('b', 'B')}\\.`,
    'm',
  );

  return phases.findIndex((phase, index) => {
    const start = curriculum.indexOf(`Fase ${phase.number}:`);
    const nextPhase = phases[index + 1];
    const end = nextPhase
      ? curriculum.indexOf(`Fase ${nextPhase.number}:`)
      : undefined;

    return marker.test(curriculum.slice(start, end));
  });
}

export async function parseCourse(root, dependencies = {}) {
  const readFile = dependencies.readFile ?? fsReadFile;
  const curriculum = await readFile(join(root, 'curriculo.md'), 'utf8');
  const phases = [...curriculum.matchAll(
    /^##\s+.+?Fase\s+(\d+):\s*(.+)$/gm,
  )].map((match) => ({
    id: `fase-${match[1]}`,
    number: Number(match[1]),
    title: plainText(match[2]),
    modules: [],
  }));
  const entries = await readdir(join(root, 'modulos'), {
    withFileTypes: true,
  });

  for (const entry of moduleDirectories(entries)) {
    const id = entry.name.match(MODULE_ID)[1].toLowerCase();
    const moduleRoot = join(root, 'modulos', entry.name);
    const readme = await readFile(join(moduleRoot, 'README.md'), 'utf8');
    const title = plainText(readme.match(/^#\s+(.+)$/m)?.[1]);
    const lessons = section(readme, 'Aulas')
      .split('\n')
      .map((line) => line.match(LESSON_ROW))
      .filter(Boolean)
      .map((match) => ({
        id: match[1].trim().toLowerCase(),
        title: plainText(match[2]),
        sourcePath: join(moduleRoot, match[3]),
        fileName: basename(match[3]),
        type: plainText(match[4]),
        status: plainText(match[5]),
      }));

    for (const lesson of lessons) {
      await access(lesson.sourcePath).catch(() => {
        throw new Error(
          `Aula indexada não encontrada: ${lesson.sourcePath}`,
        );
      });
    }

    const exerciseRoot = join(moduleRoot, 'exercicios');
    const exerciseEntries = await readdir(exerciseRoot, {
      withFileTypes: true,
    }).catch(() => []);
    const exercises = exerciseEntries
      .filter((item) => item.isFile()
        && !item.name.startsWith('._')
        && item.name.endsWith('.md'))
      .sort((a, b) => a.name.localeCompare(
        b.name,
        'pt-BR',
        { numeric: true },
      ))
      .map((item) => ({
        id: `${id}:${item.name.replace(/\.md$/, '')}`,
        title: item.name.replace(/\.md$/, '').replaceAll('-', ' '),
        sourcePath: join(exerciseRoot, item.name),
        fileName: item.name,
      }));
    const summary = plainText(section(readme, 'Objetivo do Módulo')
      .trim()
      .split(/\n\s*\n/)[0]
      .replace(/\s+/g, ' '));
    const module = {
      id,
      slug: entry.name,
      title,
      summary,
      root: moduleRoot,
      lessons,
      exercises,
    };
    const phaseIndex = phaseForModule(phases, curriculum, id);

    if (phaseIndex < 0) {
      throw new Error(`Módulo ${id} não está associado a uma fase`);
    }

    phases[phaseIndex].modules.push(module);
  }

  for (const phase of phases) {
    phase.summary = `Esta fase reúne ${phase.modules.length} módulos, de ${phase.modules.at(0).title} a ${phase.modules.at(-1).title}.`;
  }

  return { phases };
}
