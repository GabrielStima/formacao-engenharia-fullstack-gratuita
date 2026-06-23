import { loadLesson } from './catalog-api.js';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function collectContents(catalog) {
  return catalog.phases.flatMap((phase) => phase.modules.flatMap((module) => [
    ...module.lessons.map((item) => ({
      ...item,
      kind: 'lesson',
      phaseId: phase.id,
      moduleTitle: module.title,
    })),
    ...module.exercises.map((item) => ({
      ...item,
      kind: 'exercise',
      phaseId: phase.id,
      moduleTitle: module.title,
    })),
  ]));
}

export function lessonNeighbors(contents, slug) {
  const lessons = contents.filter(({ kind }) => kind === 'lesson');
  const index = lessons.findIndex((item) => item.slug === slug);

  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: lessons[index - 1] ?? null,
    next: lessons[index + 1] ?? null,
  };
}

export function renderToc(headings) {
  return headings.map((heading) => {
    const label = heading.textContent.replace(/#$/, '').trim();
    return `<a href="#${escapeHtml(heading.id)}">${escapeHtml(label)}</a>`;
  }).join('');
}

export function renderLessonShell(current, { completed, previous, next }) {
  const isLesson = current.kind === 'lesson';
  const completion = isLesson ? `
    <button type="button" data-complete aria-pressed="${completed}">
      ${completed ? '✓ Concluída' : 'Marcar como concluída'}
    </button>
  ` : '';
  const adjacency = isLesson ? `
    <nav class="lesson-navigation" aria-label="Aulas adjacentes">
      <button type="button" data-previous ${previous ? '' : 'disabled'}>← Anterior</button>
      <button type="button" data-next ${next ? '' : 'disabled'}>Próxima →</button>
    </nav>
  ` : '';

  return `
    <article class="lesson-shell">
      <header class="lesson-toolbar">
        <div>
          <small>${escapeHtml(current.moduleTitle)} · ${isLesson ? 'Aula' : 'Exercício'}</small>
          <h2 id="lesson-title">${escapeHtml(current.id)} · ${escapeHtml(current.title)}</h2>
        </div>
        <div class="lesson-actions">
          ${completion}
          <a href="${escapeHtml(current.sourceUrl)}" target="_blank" rel="noopener noreferrer">GitHub</a>
          <button type="button" data-close aria-label="Fechar conteúdo">✕</button>
        </div>
      </header>
      <div class="lesson-body">
        <nav class="lesson-toc" aria-label="Nesta aula" data-toc></nav>
        <div class="lesson-content" aria-busy="true">Carregando…</div>
      </div>
      ${adjacency}
    </article>
  `;
}

export function focusContentOpener(documentRef, opener, closedContent) {
  if (closedContent?.kind !== 'lesson') {
    opener?.focus?.();
    return;
  }

  if (
    opener?.isConnected !== false
    && opener?.dataset?.lessonSlug === closedContent.slug
  ) {
    opener.focus();
    return;
  }

  const replacement = [...documentRef.querySelectorAll('[data-lesson-slug]')]
    .find((element) => element.dataset.lessonSlug === closedContent.slug);
  replacement?.closest('.module-card')?.setAttribute('open', '');
  if (replacement) {
    replacement.focus();
  } else {
    opener?.focus?.();
  }
}

export function shouldDismissForKey(key) {
  return key === 'Escape';
}

export function createLessonDialog({
  dialog,
  catalog,
  store,
  onProgressChange,
  onNavigate,
  onDismiss = () => {},
  notify,
  loadContent = loadLesson,
  documentRef = globalThis.document,
}) {
  const contents = collectContents(catalog);
  let current = null;
  let opener = null;
  let requestId = 0;

  function close({ emit = true, restoreFocus = true } = {}) {
    const closedContent = current;
    requestId += 1;

    if (dialog.open) {
      dialog.close();
    }

    current = null;
    if (restoreFocus) {
      focusContentOpener(documentRef, opener, closedContent);
    }
    if (emit && closedContent) {
      onDismiss(closedContent);
    }
  }

  async function open(slug, trigger) {
    const selectedContent = contents.find((item) => item.slug === slug);

    if (!selectedContent) {
      notify('Conteúdo não encontrado.');
      return false;
    }

    if (trigger || !dialog.open) {
      opener = trigger ?? documentRef.activeElement;
    }

    current = selectedContent;
    const neighbors = lessonNeighbors(contents, selectedContent.slug);
    const currentRequestId = ++requestId;
    const contentRoot = dialog.querySelector('#lesson-dialog-content');
    contentRoot.innerHTML = renderLessonShell(selectedContent, {
      completed: selectedContent.kind === 'lesson' && store.isCompleted(selectedContent.id),
      ...neighbors,
    });

    if (!dialog.open) {
      dialog.showModal();
    }

    dialog.querySelector('[data-close]').addEventListener('click', () => close());
    dialog.querySelector('[data-complete]')?.addEventListener('click', async () => {
      store.toggle(selectedContent.id);
      onProgressChange();
      await open(selectedContent.slug);
    });
    dialog.querySelector('[data-previous]')?.addEventListener('click', () => {
      if (neighbors.previous) {
        onNavigate(neighbors.previous);
      }
    });
    dialog.querySelector('[data-next]')?.addEventListener('click', () => {
      if (neighbors.next) {
        onNavigate(neighbors.next);
      }
    });

    const lessonContent = dialog.querySelector('.lesson-content');
    try {
      const html = await loadContent(selectedContent.contentUrl);
      if (currentRequestId !== requestId) {
        return false;
      }
      lessonContent.innerHTML = html;
      const headings = [...lessonContent.querySelectorAll('h2,h3')];
      dialog.querySelector('[data-toc]').innerHTML = renderToc(headings);
    } catch (error) {
      if (currentRequestId !== requestId) {
        return false;
      }
      const message = error instanceof Error ? error.message : 'Tente novamente em instantes.';
      lessonContent.innerHTML = `
        <section role="alert">
          <h3>Aula indisponível</h3>
          <p>${escapeHtml(message)}</p>
        </section>
      `;
    }
    lessonContent.setAttribute('aria-busy', 'false');
    return true;
  }

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });

  dialog.addEventListener('keydown', (event) => {
    if (!shouldDismissForKey(event.key)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    close();
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      close();
      return;
    }

    const lesson = event.target.closest?.('[data-lesson-slug]');
    const exercise = event.target.closest?.('[data-exercise-slug]');
    if (lesson) {
      event.preventDefault();
      onNavigate({ kind: 'lesson', slug: lesson.dataset.lessonSlug });
    }
    if (exercise) {
      event.preventDefault();
      onNavigate({ kind: 'exercise', slug: exercise.dataset.exerciseSlug });
    }
  });

  return {
    open,
    close,
    current: () => current,
  };
}
