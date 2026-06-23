import { loadCatalog } from './catalog-api.js';

const map = document.querySelector('#course-map');

function appendTextElement(parent, tagName, text, className) {
  const element = document.createElement(tagName);
  element.textContent = text;
  if (className) element.className = className;
  parent.append(element);
  return element;
}

function renderCatalogSummary(catalog) {
  const phaseSelect = document.querySelector('#phase-select');
  const phaseOption = document.createElement('option');
  phaseOption.textContent = `${catalog.phases.length} fases disponíveis`;
  phaseSelect.replaceChildren(phaseOption);
  phaseSelect.disabled = true;
  document.querySelector('#previous-phase').disabled = true;
  document.querySelector('#next-phase').disabled = true;

  const summary = document.createElement('div');
  summary.className = 'phase-heading';
  appendTextElement(
    summary,
    'p',
    'A FORMAÇÃO ESTÁ PRONTA PARA EXPLORAR',
    'eyebrow',
  );
  appendTextElement(
    summary,
    'h2',
    `${catalog.counts.modules} módulos conectados em uma única jornada`,
  );

  const stats = document.createElement('div');
  stats.className = 'phase-stats';
  for (const [value, label] of [
    [catalog.counts.lessons, 'aulas principais'],
    [catalog.counts.exercises, 'exercícios e atividades'],
  ]) {
    const stat = document.createElement('div');
    stat.className = 'phase-stat';
    appendTextElement(stat, 'strong', String(value));
    appendTextElement(stat, 'span', label);
    stats.append(stat);
  }
  summary.append(stats);

  map.replaceChildren(summary);
  map.dataset.catalogLoaded = 'true';
  map.setAttribute('aria-busy', 'false');
}

function renderLoadError(error) {
  const section = document.createElement('section');
  section.className = 'load-error';
  section.setAttribute('role', 'alert');
  appendTextElement(section, 'h2', 'Não foi possível carregar o mapa');
  appendTextElement(
    section,
    'p',
    error instanceof Error ? error.message : 'Tente novamente em instantes.',
  );
  const retry = appendTextElement(section, 'button', 'Tentar novamente');
  retry.type = 'button';
  retry.addEventListener('click', () => location.reload());
  map.replaceChildren(section);
  map.setAttribute('aria-busy', 'false');
}

try {
  renderCatalogSummary(await loadCatalog());
} catch (error) {
  renderLoadError(error);
}
