import { loadCatalog } from './catalog-api.js';
import { createLessonDialog } from './lesson-dialog.js';
import { renderPhase } from './map-view.js';
import { createProgressStore, progressFor } from './progress-store.js';
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
