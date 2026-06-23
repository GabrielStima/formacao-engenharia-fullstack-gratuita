import assert from 'node:assert/strict';
import test from 'node:test';

import {
  collectContents,
  focusContentOpener,
  lessonNeighbors,
  renderLessonShell,
  renderToc,
  shouldDismissForKey,
} from '../../src/js/lesson-dialog.js';

const catalog = {
  phases: [{
    id: 'fase-1',
    modules: [
      {
        id: '01',
        title: 'Internet',
        lessons: [
          { id: '01.01', slug: 'internet', title: 'Internet', contentUrl: 'content/internet.html' },
          { id: '01.02', slug: 'web', title: 'Web', contentUrl: 'content/web.html' },
        ],
        exercises: [{ id: '01.ex01', slug: 'atividade', title: 'Atividade' }],
      },
      {
        id: '02',
        title: 'HTML',
        lessons: [{ id: '02.01', slug: 'html', title: 'HTML' }],
        exercises: [],
      },
    ],
  }],
};

test('reúne aulas e exercícios com o contexto do módulo e da fase', () => {
  const contents = collectContents(catalog);

  assert.deepEqual(contents.map(({ kind, slug, phaseId, moduleTitle }) => ({
    kind,
    slug,
    phaseId,
    moduleTitle,
  })), [
    { kind: 'lesson', slug: 'internet', phaseId: 'fase-1', moduleTitle: 'Internet' },
    { kind: 'lesson', slug: 'web', phaseId: 'fase-1', moduleTitle: 'Internet' },
    { kind: 'exercise', slug: 'atividade', phaseId: 'fase-1', moduleTitle: 'Internet' },
    { kind: 'lesson', slug: 'html', phaseId: 'fase-1', moduleTitle: 'HTML' },
  ]);
});

test('encontra aulas adjacentes atravessando módulos e ignora exercícios', () => {
  const contents = collectContents(catalog);

  assert.deepEqual(lessonNeighbors(contents, 'web'), {
    previous: contents[0],
    next: contents[3],
  });
  assert.deepEqual(lessonNeighbors(contents, 'internet'), {
    previous: null,
    next: contents[1],
  });
});

test('renderiza aula concluível com navegação e valores escapados', () => {
  const current = {
    kind: 'lesson',
    id: '01.01',
    title: '<script>Aula</script>',
    moduleTitle: 'Internet & Web',
    sourceUrl: 'https://example.test/aula" onclick="alert(1)',
  };

  const html = renderLessonShell(current, {
    completed: true,
    previous: null,
    next: { slug: 'web' },
  });

  assert.match(html, /aria-pressed="true"[^>]*>\s*✓ Concluída/);
  assert.match(html, /data-previous[^>]*disabled/);
  assert.match(html, /data-next/);
  assert.match(html, /&lt;script&gt;Aula&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>|onclick="alert/);
  assert.match(html, /href="https:\/\/example\.test\/aula&quot; onclick=&quot;alert\(1\)"/);
});

test('renderiza exercício sem conclusão nem aulas adjacentes', () => {
  const html = renderLessonShell({
    kind: 'exercise',
    id: '01.ex01',
    title: 'Atividade',
    moduleTitle: 'Internet',
    sourceUrl: 'https://example.test/atividade',
  }, { completed: false, previous: null, next: null });

  assert.doesNotMatch(html, /data-complete|data-previous|data-next/);
  assert.match(html, /Exercício/);
});

test('monta sumário escapando identificadores e removendo o marcador da âncora', () => {
  const html = renderToc([
    { id: 'visao-geral', textContent: 'Visão geral #' },
    { id: 'risco" onclick="alert(1)', textContent: '<Risco>' },
  ]);

  assert.equal(
    html,
    '<a href="#visao-geral">Visão geral</a><a href="#risco&quot; onclick=&quot;alert(1)">&lt;Risco&gt;</a>',
  );
});

test('reabre o módulo antes de devolver foco a um botão recriado', () => {
  let moduleOpened = false;
  let focused = false;
  const replacement = {
    dataset: { lessonSlug: 'internet' },
    closest(selector) {
      assert.equal(selector, '.module-card');
      return {
        setAttribute(name, value) {
          assert.equal(name, 'open');
          assert.equal(value, '');
          moduleOpened = true;
        },
      };
    },
    focus() {
      focused = true;
    },
  };
  const documentRef = {
    querySelectorAll(selector) {
      assert.equal(selector, '[data-lesson-slug]');
      return [replacement];
    },
  };

  focusContentOpener(documentRef, { isConnected: false }, { kind: 'lesson', slug: 'internet' });

  assert.equal(moduleOpened, true);
  assert.equal(focused, true);
});

test('prefere o botão da aula quando o opener conectado não representa a aula', () => {
  let unrelatedFocused = false;
  let lessonFocused = false;
  const replacement = {
    dataset: { lessonSlug: 'internet' },
    closest: () => ({ setAttribute() {} }),
    focus() {
      lessonFocused = true;
    },
  };
  const documentRef = { querySelectorAll: () => [replacement] };
  const unrelatedOpener = {
    isConnected: true,
    dataset: {},
    focus() {
      unrelatedFocused = true;
    },
  };

  focusContentOpener(documentRef, unrelatedOpener, { kind: 'lesson', slug: 'internet' });

  assert.equal(unrelatedFocused, false);
  assert.equal(lessonFocused, true);
});

test('reconhece Escape como comando explícito para fechar o leitor', () => {
  assert.equal(shouldDismissForKey('Escape'), true);
  assert.equal(shouldDismissForKey('Enter'), false);
});
