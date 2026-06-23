import assert from 'node:assert/strict';
import test from 'node:test';

import { moduleState, renderPhase } from '../../src/js/map-view.js';

test('classifica módulo como novo, parcial ou concluído', () => {
  const lessons = [{ id: '01.01' }, { id: '01.02' }];

  assert.equal(moduleState(lessons, []), 'new');
  assert.equal(moduleState(lessons, ['01.01']), 'partial');
  assert.equal(moduleState(lessons, ['01.01', '01.02']), 'done');
});

test('renderiza a fase com progresso, aulas e exercícios', () => {
  const container = { innerHTML: '' };
  const phase = {
    number: 1,
    title: 'Fundamentos & Web',
    summary: 'Primeiros passos',
    modules: [{
      id: '01',
      title: 'Internet',
      summary: 'Como a web funciona',
      lessons: [
        { id: '01.01', slug: '01.01-internet', title: 'Internet', type: 'Conceitual', status: 'Revisada' },
        { id: '01.02', slug: '01.02-web', title: 'Web', type: 'Prática', status: 'Roteirizada' },
      ],
      exercises: [{ id: '01.ex01', slug: 'atividade-internet', title: 'Mapeando uma requisição' }],
    }],
  };

  renderPhase(container, phase, ['01.01']);

  assert.match(container.innerHTML, /1 de 2 aulas · 50%/);
  assert.match(container.innerHTML, /data-state="partial"/);
  assert.match(container.innerHTML, /data-lesson-slug="01\.01-internet"[^>]+aria-pressed="true"/);
  assert.match(container.innerHTML, /data-lesson-slug="01\.02-web"[^>]+aria-pressed="false"/);
  assert.match(container.innerHTML, /Exercícios \(1\)/);
  assert.match(container.innerHTML, /data-exercise-slug="atividade-internet"/);
});

test('escapa conteúdo textual e atributos vindos do catálogo', () => {
  const container = { innerHTML: '' };
  const phase = {
    number: 1,
    title: '<script>alert(1)</script>',
    summary: 'Resumo & contexto',
    modules: [{
      id: '01" autofocus="true',
      title: '<img src=x onerror=alert(1)>',
      summary: 'Módulo seguro',
      lessons: [{
        id: '01.01',
        slug: 'aula" onclick="alert(1)',
        title: '<b>Aula</b>',
        type: 'Prática',
        status: 'Revisada',
      }],
      exercises: [],
    }],
  };

  renderPhase(container, phase, []);

  assert.doesNotMatch(container.innerHTML, /<script>|<img|onclick="alert/);
  assert.match(container.innerHTML, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(container.innerHTML, /data-lesson-slug="aula&quot; onclick=&quot;alert\(1\)"/);
  assert.match(container.innerHTML, /&lt;b&gt;Aula&lt;\/b&gt;/);
});
