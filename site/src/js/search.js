function normalizeText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function createSearchIndex(catalog) {
  return catalog.phases.flatMap((phase) => phase.modules.flatMap((module) => [
    {
      type: 'module',
      phaseId: phase.id,
      moduleId: module.id,
      title: module.title,
      haystack: normalizeText(`${module.id} ${module.title}`),
    },
    ...module.lessons.map((lesson) => ({
      type: 'lesson',
      phaseId: phase.id,
      moduleId: module.id,
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      haystack: normalizeText(`${lesson.id} ${lesson.title} ${module.title}`),
    })),
  ]));
}

export function searchCatalog(index, query) {
  const terms = normalizeText(query).trim().split(/\s+/).filter(Boolean);

  if (terms.length === 0) {
    return [];
  }

  return index
    .filter((item) => terms.every((term) => item.haystack.includes(term)))
    .slice(0, 30);
}

export function searchResultsMarkup(results) {
  if (results.length === 0) {
    return '<p>Nenhum resultado. Tente outro código ou termo.</p>';
  }

  return `
    <ul class="search-result-list">
      ${results.map((item) => `
        <li>
          <button
            type="button"
            data-result-type="${escapeHtml(item.type)}"
            data-phase-id="${escapeHtml(item.phaseId)}"
            data-module-id="${escapeHtml(item.moduleId)}"
            ${item.slug ? `data-lesson-slug="${escapeHtml(item.slug)}"` : ''}
          >
            <span>${escapeHtml(item.type === 'lesson' ? item.id : item.moduleId)} · ${escapeHtml(item.title)}</span>
            <small>${item.type === 'lesson' ? 'Aula' : 'Módulo'}</small>
          </button>
        </li>
      `).join('')}
    </ul>
  `;
}
