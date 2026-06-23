function normalizeText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
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
