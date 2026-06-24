import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const source = resolve('src');

test('shell possui landmarks e controles essenciais', async () => {
  const html = await readFile(resolve(source, 'index.html'), 'utf8');

  assert.match(html, /<html lang="pt-BR" data-theme="dark">/);
  assert.match(html, /<header class="site-header">/);
  assert.match(html, /<main>/);
  assert.match(html, /<footer/);
  assert.match(html, /id="course-map"/);
  assert.match(html, /id="lesson-dialog"/);
  assert.match(html, /id="search-dialog"/);
  assert.match(html, /id="settings-dialog"/);
  assert.match(html, /class="skip-link" href="#course-map"/);
});

test('shell não usa handlers inline', async () => {
  const html = await readFile(resolve(source, 'index.html'), 'utf8');

  assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
});

test('shell referencia os estilos e JavaScript esperados', async () => {
  const html = await readFile(resolve(source, 'index.html'), 'utf8');

  assert.match(html, /href="styles\/tokens\.css"/);
  assert.match(html, /href="styles\/layout\.css"/);
  assert.match(html, /href="styles\/lesson\.css"/);
  assert.match(html, /type="module" src="js\/app\.js"/);
});
