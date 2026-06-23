import { progressFor } from './progress-store.js';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function moduleState(lessons, completedLessonIds) {
  const progress = progressFor(completedLessonIds, lessons.map(({ id }) => id));

  if (progress.completed === 0) {
    return 'new';
  }

  return progress.completed === progress.total ? 'done' : 'partial';
}

export function renderPhase(container, phase, completedLessonIds) {
  const completedIds = new Set(completedLessonIds);
  const phaseLessonIds = phase.modules.flatMap((module) => module.lessons.map(({ id }) => id));
  const phaseProgress = progressFor(completedLessonIds, phaseLessonIds);

  const modules = phase.modules.map((module) => {
    const moduleLessonIds = module.lessons.map(({ id }) => id);
    const moduleProgress = progressFor(completedLessonIds, moduleLessonIds);
    const lessons = module.lessons.map((lesson) => {
      const completed = completedIds.has(lesson.id);

      return `
        <li>
          <button
            class="lesson-button"
            type="button"
            data-lesson-slug="${escapeHtml(lesson.slug)}"
            data-lesson-id="${escapeHtml(lesson.id)}"
            aria-pressed="${completed}"
          >
            <span>${completed ? '✓' : '○'} ${escapeHtml(lesson.id)} · ${escapeHtml(lesson.title)}</span>
            <small>${escapeHtml(lesson.type)} · ${escapeHtml(lesson.status)}</small>
          </button>
        </li>
      `;
    }).join('');

    const exercises = module.exercises.length === 0 ? '' : `
      <details class="exercise-group">
        <summary>Exercícios (${module.exercises.length})</summary>
        <ul>
          ${module.exercises.map((exercise) => `
            <li>
              <button type="button" data-exercise-slug="${escapeHtml(exercise.slug)}">
                ${escapeHtml(exercise.title)}
              </button>
            </li>
          `).join('')}
        </ul>
      </details>
    `;

    return `
      <details
        class="module-card"
        data-module-id="${escapeHtml(module.id)}"
        data-state="${moduleState(module.lessons, completedLessonIds)}"
      >
        <summary>
          <strong>${escapeHtml(module.id)} · ${escapeHtml(module.title)}</strong>
          <span>${moduleProgress.completed}/${moduleProgress.total}</span>
        </summary>
        <p>${escapeHtml(module.summary)}</p>
        <ol class="lesson-list">${lessons}</ol>
        ${exercises}
      </details>
    `;
  }).join('');

  container.innerHTML = `
    <header class="phase-heading">
      <p class="eyebrow">FASE ${escapeHtml(phase.number)} DE 8</p>
      <h2>${escapeHtml(phase.title)}</h2>
      <p>${escapeHtml(phase.summary)}</p>
      <p class="phase-progress">${phaseProgress.completed} de ${phaseProgress.total} aulas · ${phaseProgress.percent}%</p>
    </header>
    <div class="course-track">${modules}</div>
  `;
}
