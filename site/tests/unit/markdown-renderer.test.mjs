import assert from 'node:assert/strict';
import test from 'node:test';

import { renderMarkdown } from '../../scripts/lib/markdown-renderer.mjs';

const options = {
  sourcePath: 'modulos/01/aula.md',
  contentLookup: new Map(),
  assetUrlFor: (path) => `course-assets/${path}`,
  sourceUrlFor: (path) => {
    throw new Error(`Link interno não encontrado: ${path}`);
  },
};

test('renderiza GFM, alertas e headings com ids', () => {
  const html = renderMarkdown([
    '# Aula',
    '',
    '> [!WARNING]',
    '> **Cuidado** [MDN](https://developer.mozilla.org)',
    '',
    '| A | B |',
    '|---|---|',
    '| 1 | 2 |',
  ].join('\n'), options);

  assert.match(html, /<h1 id="aula">/);
  assert.match(
    html,
    /class="markdown-alert markdown-alert-warning"/,
  );
  assert.match(html, /<strong>Cuidado<\/strong>/);
  assert.match(html, /href="https:\/\/developer\.mozilla\.org"/);
  assert.match(html, /<table>/);
});

test('remove execução e protocolos perigosos', () => {
  const html = renderMarkdown([
    '<script>alert(1)</script>',
    '<img src=x onerror="alert(2)">',
    '<a href="javascript:alert(3)">x</a>',
  ].join('\n'), options);

  assert.doesNotMatch(html, /<script|onerror|javascript:/i);
});

test('transforma aulas Markdown conhecidas em deep links', () => {
  const contentLookup = new Map([
    [
      'modulos/01/proxima.md',
      { kind: 'lesson', slug: '01.02-proxima' },
    ],
  ]);
  const html = renderMarkdown('[Próxima](proxima.md)', {
    ...options,
    sourcePath: 'modulos/01/atual.md',
    contentLookup,
  });

  assert.match(html, /href="\?aula=01\.02-proxima"/);
  assert.match(html, /data-lesson-slug="01\.02-proxima"/);
});

test('preserva o identificador de exercício após sanitização', () => {
  const contentLookup = new Map([
    [
      'modulos/01/exercicios/atividade.md',
      { kind: 'exercise', slug: 'atividade' },
    ],
  ]);
  const html = renderMarkdown(
    '[Atividade](exercicios/atividade.md)',
    { ...options, contentLookup },
  );

  assert.match(html, /href="\?exercicio=atividade"/);
  assert.match(html, /data-exercise-slug="atividade"/);
});

test('reescreve imagens locais pela função do build', () => {
  const html = renderMarkdown(
    '![Banner](../../assets/banner.png)',
    options,
  );

  assert.match(html, /src="course-assets\/assets\/banner\.png"/);
  assert.match(html, /loading="lazy"/);
});

test('protege links externos abertos em nova aba', () => {
  const html = renderMarkdown('[MDN](https://developer.mozilla.org)', options);

  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test('rejeita link Markdown interno desconhecido', () => {
  assert.throws(
    () => renderMarkdown('[Ausente](ausente.md)', options),
    /Link interno não encontrado/,
  );
});
