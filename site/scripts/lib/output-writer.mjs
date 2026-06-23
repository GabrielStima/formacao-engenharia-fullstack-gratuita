import {
  copyFile,
  cp,
  mkdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';

export async function prepareOutput(outputRoot) {
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
}

export async function writeText(outputRoot, relativePath, content) {
  const target = join(outputRoot, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
}

export async function copySource(sourceRoot, outputRoot) {
  await cp(sourceRoot, outputRoot, { recursive: true }).catch((error) => {
    if (error?.code !== 'ENOENT') throw error;
  });
}

export async function copyAsset(source, outputRoot, relativeTarget) {
  const target = join(outputRoot, relativeTarget);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
}
