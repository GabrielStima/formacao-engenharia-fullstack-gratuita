import { loadCatalog } from './catalog-api.js';
import { createLessonDialog } from './lesson-dialog.js';
import { renderPhase } from './map-view.js';
import { createProgressStore, progressFor } from './progress-store.js';
import {
  createSearchIndex,
  searchCatalog,
  searchResultsMarkup,
} from './search.js';
import { bindSettings } from './settings-dialog.js';
import {
  onRouteChange,
  pushRoute,
  readRoute,
  replaceRoute,
} from './router.js';

const map = document.querySelector('#course-map');
const phaseSelect = document.querySelector('#phase-select');
const previousPhaseButton = document.querySelector('#previous-phase');
const nextPhaseButton = document.querySelector('#next-phase');
const overallProgress = document.querySelector('#overall-progress');
const toast = document.querySelector('#toast');

function notify(message) {
  toast.textContent = message;
}

function findContent(catalog, kind, slug) {
  for (const [phaseIndex, phase] of catalog.phases.entries()) {
    for (const module of phase.modules) {
      const collection = kind === 'lesson' ? module.lessons : module.exercises;
      const item = collection.find((content) => content.slug === slug);
      if (item) {
        return { phaseIndex, module, item };
      }
    }
  }

  return null;
}

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

  const themeButton = document.querySelector('#theme-button');
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeButton.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro',
    );
    themeButton.setAttribute('aria-pressed', String(theme === 'light'));
  }
  applyTheme(store.state.theme);
  themeButton.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    store.setTheme(theme);
  });

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

  const lessonDialog = createLessonDialog({
    dialog: document.querySelector('#lesson-dialog'),
    catalog,
    store,
    onProgressChange: () => {
      render();
      if (!store.available) {
        notify('Seu navegador bloqueou a persistência do progresso.');
      }
    },
    onNavigate: (content) => openContent(content.kind, content.slug),
    onDismiss: () => {
      pushRoute({ phaseId: catalog.phases[phaseIndex].id });
    },
    notify,
  });

  async function openContent(kind, slug, trigger, { push = true } = {}) {
    const contentLocation = findContent(catalog, kind, slug);
    if (!contentLocation) {
      notify('Conteúdo não encontrado.');
      return false;
    }

    phaseIndex = contentLocation.phaseIndex;
    render();
    const route = {
      phaseId: catalog.phases[phaseIndex].id,
      lessonSlug: kind === 'lesson' ? slug : null,
      exerciseSlug: kind === 'exercise' ? slug : null,
    };
    if (push) {
      pushRoute(route);
    } else {
      replaceRoute(route);
    }
    return lessonDialog.open(slug, trigger);
  }

  function showPhase(nextPhaseIndex) {
    lessonDialog.close({ emit: false });
    phaseIndex = nextPhaseIndex;
    replaceRoute({ phaseId: catalog.phases[phaseIndex].id });
    render();
  }

  const searchDialog = document.querySelector('#search-dialog');
  const searchInput = document.querySelector('#search-input');
  const searchResults = document.querySelector('#search-results');
  const searchIndex = createSearchIndex(catalog);

  document.querySelector('#search-button').addEventListener('click', () => {
    searchDialog.showModal();
    searchInput.focus();
  });
  searchDialog.querySelector('[data-close-dialog]').addEventListener('click', () => {
    searchDialog.close();
  });
  searchInput.addEventListener('input', () => {
    searchResults.innerHTML = searchResultsMarkup(searchCatalog(searchIndex, searchInput.value));
  });
  searchResults.addEventListener('click', (event) => {
    const result = event.target.closest?.('[data-result-type]');
    if (!result) {
      return;
    }

    searchDialog.close();
    if (result.dataset.lessonSlug) {
      openContent('lesson', result.dataset.lessonSlug);
      return;
    }

    const nextPhaseIndex = catalog.phases.findIndex(({ id }) => id === result.dataset.phaseId);
    showPhase(nextPhaseIndex);
    const moduleCard = [...map.querySelectorAll('[data-module-id]')]
      .find((element) => element.dataset.moduleId === result.dataset.moduleId);
    moduleCard?.setAttribute('open', '');
    moduleCard?.querySelector('summary')?.focus();
  });

  const settingsDialog = document.querySelector('#settings-dialog');
  bindSettings({
    dialog: settingsDialog,
    store,
    knownIds: new Set(allLessonIds),
    onChange: render,
    notify,
  });
  document.querySelector('#settings-button').addEventListener('click', () => {
    settingsDialog.showModal();
  });

  phaseSelect.addEventListener('change', () => {
    showPhase(catalog.phases.findIndex(({ id }) => id === phaseSelect.value));
  });

  previousPhaseButton.addEventListener('click', () => {
    showPhase(Math.max(0, phaseIndex - 1));
  });

  nextPhaseButton.addEventListener('click', () => {
    showPhase(Math.min(catalog.phases.length - 1, phaseIndex + 1));
  });

  map.addEventListener('click', (event) => {
    const lesson = event.target.closest?.('[data-lesson-slug]');
    const exercise = event.target.closest?.('[data-exercise-slug]');
    if (lesson) {
      openContent('lesson', lesson.dataset.lessonSlug, lesson);
    }
    if (exercise) {
      openContent('exercise', exercise.dataset.exerciseSlug, exercise);
    }
  });

  onRouteChange(({ phaseId, lessonSlug, exerciseSlug }) => {
    const routedPhaseIndex = catalog.phases.findIndex((phase) => phase.id === phaseId);
    phaseIndex = Math.max(0, routedPhaseIndex);

    if (lessonSlug) {
      openContent('lesson', lessonSlug, undefined, { push: false });
      return;
    }
    if (exerciseSlug) {
      openContent('exercise', exerciseSlug, undefined, { push: false });
      return;
    }

    render();
    lessonDialog.close({ emit: false });
  });

  render();
  const initialRoute = readRoute();
  if (initialRoute.lessonSlug) {
    await openContent('lesson', initialRoute.lessonSlug, undefined, { push: false });
  } else if (initialRoute.exerciseSlug) {
    await openContent('exercise', initialRoute.exerciseSlug, undefined, { push: false });
  }
} catch (error) {
  renderLoadError(error);
}
