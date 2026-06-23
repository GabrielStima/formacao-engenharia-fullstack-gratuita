import { loadCatalog } from './catalog-api.js';
import { renderPhase } from './map-view.js';
import { createProgressStore, progressFor } from './progress-store.js';
import { readRoute, replaceRoute } from './router.js';

const map = document.querySelector('#course-map');
const phaseSelect = document.querySelector('#phase-select');
const previousPhaseButton = document.querySelector('#previous-phase');
const nextPhaseButton = document.querySelector('#next-phase');
const overallProgress = document.querySelector('#overall-progress');

function appendTextElement(parent, tagName, text, className) {
  const element = document.createElement(tagName);
  element.textContent = text;
  if (className) {
    element.className = className;
  }
  parent.append(element);
  return element;
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
  retry.addEventListener('click', () => globalThis.location.reload());

  const unavailableOption = document.createElement('option');
  unavailableOption.textContent = 'Formação indisponível';
  phaseSelect.replaceChildren(unavailableOption);
  phaseSelect.disabled = true;
  previousPhaseButton.disabled = true;
  nextPhaseButton.disabled = true;
  map.replaceChildren(section);
  map.setAttribute('aria-busy', 'false');
}

try {
  const catalog = await loadCatalog();
  const store = createProgressStore();
  const allLessonIds = catalog.phases.flatMap((phase) => (
    phase.modules.flatMap((module) => module.lessons.map(({ id }) => id))
  ));
  const requestedPhaseIndex = catalog.phases.findIndex(({ id }) => id === readRoute().phaseId);
  let phaseIndex = Math.max(0, requestedPhaseIndex);

  const options = catalog.phases.map((phase) => {
    const option = document.createElement('option');
    option.value = phase.id;
    option.textContent = `Fase ${phase.number}: ${phase.title}`;
    return option;
  });
  phaseSelect.replaceChildren(...options);
  phaseSelect.disabled = false;

  function render() {
    const phase = catalog.phases[phaseIndex];
    const completedLessonIds = store.state.completedLessonIds;

    phaseSelect.value = phase.id;
    previousPhaseButton.disabled = phaseIndex === 0;
    nextPhaseButton.disabled = phaseIndex === catalog.phases.length - 1;
    renderPhase(map, phase, completedLessonIds);
    overallProgress.value = `${progressFor(completedLessonIds, allLessonIds).percent}%`;
    map.dataset.catalogLoaded = 'true';
    map.setAttribute('aria-busy', 'false');

    const route = readRoute();
    replaceRoute({
      phaseId: phase.id,
      lessonSlug: route.lessonSlug,
      exerciseSlug: route.exerciseSlug,
    });
  }

  phaseSelect.addEventListener('change', () => {
    phaseIndex = catalog.phases.findIndex(({ id }) => id === phaseSelect.value);
    render();
  });

  previousPhaseButton.addEventListener('click', () => {
    phaseIndex = Math.max(0, phaseIndex - 1);
    render();
  });

  nextPhaseButton.addEventListener('click', () => {
    phaseIndex = Math.min(catalog.phases.length - 1, phaseIndex + 1);
    render();
  });

  render();
} catch (error) {
  renderLoadError(error);
}
