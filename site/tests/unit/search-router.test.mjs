import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createSearchIndex,
  searchCatalog,
  searchResultsMarkup,
} from '../../src/js/search.js';
import {
  onRouteChange,
  pushRoute,
  readRoute,
  replaceRoute,
  routeUrl,
} from '../../src/js/router.js';

const catalog = {
  phases: [{
    id: 'fase-1',
    modules: [{
      id: '01',
      title: 'Fundamentos da Internet',
      lessons: [
        { id: '01.04', slug: '01.04-dns', title: 'DNS e resolução de domínios' },
        { id: '01.05', slug: '01.05-http', title: 'Requisições HTTP' },
      ],
    }],
  }],
};

test('busca ignora acentos e encontra módulos por múltiplos termos', () => {
  const index = createSearchIndex(catalog);

  const results = searchCatalog(index, 'fundamentos internet');

  assert.equal(results[0].type, 'module');
  assert.equal(results[0].moduleId, '01');
  assert.deepEqual(results.slice(1).map(({ type }) => type), ['lesson', 'lesson']);
});

test('busca encontra aulas por código, título sem acento e módulo', () => {
  const index = createSearchIndex(catalog);

  assert.equal(searchCatalog(index, '01.04')[0].slug, '01.04-dns');
  assert.equal(searchCatalog(index, 'resolucao dominios')[0].slug, '01.04-dns');
  assert.equal(searchCatalog(index, 'http fundamentos')[0].slug, '01.05-http');
});

test('busca vazia não apresenta resultados', () => {
  const index = createSearchIndex(catalog);

  assert.deepEqual(searchCatalog(index, '   '), []);
});

test('renderiza resultados escapando títulos e atributos do catálogo', () => {
  const html = searchResultsMarkup([{
    type: 'lesson',
    phaseId: 'fase-1" autofocus="true',
    moduleId: '01',
    id: '01.04',
    slug: 'dns" onclick="alert(1)',
    title: '<script>DNS</script>',
  }]);

  assert.match(html, /data-result-type="lesson"/);
  assert.match(html, /data-lesson-slug="dns&quot; onclick=&quot;alert\(1\)"/);
  assert.match(html, /01\.04 · &lt;script&gt;DNS&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>|onclick="alert/);
});

test('explica quando a busca não encontra resultados', () => {
  assert.equal(
    searchResultsMarkup([]),
    '<p>Nenhum resultado. Tente outro código ou termo.</p>',
  );
});

test('lê a rota compartilhável e representa parâmetros ausentes como nulos', () => {
  assert.deepEqual(
    readRoute('https://example.test/repo/?fase=fase-1&aula=01.04-dns'),
    { phaseId: 'fase-1', lessonSlug: '01.04-dns', exerciseSlug: null },
  );
  assert.deepEqual(
    readRoute('https://example.test/repo/'),
    { phaseId: null, lessonSlug: null, exerciseSlug: null },
  );
});

test('escreve rotas compatíveis com uma subpasta estática', () => {
  assert.equal(
    routeUrl('/repo/', { phaseId: 'fase-1', lessonSlug: '01.04-dns' }),
    '/repo/?fase=fase-1&aula=01.04-dns',
  );
  assert.equal(
    routeUrl('/repo/', { phaseId: 'fase-1', exerciseSlug: 'atividade-final-modulo' }),
    '/repo/?fase=fase-1&exercicio=atividade-final-modulo',
  );
  assert.equal(routeUrl('/repo/', {}), '/repo/');
});

test('adiciona e substitui entradas no histórico do navegador', () => {
  const calls = [];
  const browser = {
    location: { pathname: '/repo/' },
    history: {
      pushState(state, unused, url) {
        calls.push(['push', state, unused, url]);
      },
      replaceState(state, unused, url) {
        calls.push(['replace', state, unused, url]);
      },
    },
  };
  const lessonRoute = { phaseId: 'fase-1', lessonSlug: '01.04-dns' };
  const phaseRoute = { phaseId: 'fase-2' };

  pushRoute(lessonRoute, browser);
  replaceRoute(phaseRoute, browser);

  assert.deepEqual(calls, [
    ['push', lessonRoute, '', '/repo/?fase=fase-1&aula=01.04-dns'],
    ['replace', phaseRoute, '', '/repo/?fase=fase-2'],
  ]);
});

test('notifica mudanças do histórico com a rota atual', () => {
  let popstateListener;
  let receivedRoute;
  const browser = {
    location: { href: 'https://example.test/repo/?fase=fase-3&exercicio=desafio' },
    addEventListener(type, listener) {
      assert.equal(type, 'popstate');
      popstateListener = listener;
    },
  };

  onRouteChange((route) => {
    receivedRoute = route;
  }, browser);
  popstateListener();

  assert.deepEqual(receivedRoute, {
    phaseId: 'fase-3',
    lessonSlug: null,
    exerciseSlug: 'desafio',
  });
});
