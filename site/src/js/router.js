export function readRoute(url = globalThis.location.href) {
  const params = new URL(url).searchParams;

  return {
    phaseId: params.get('fase'),
    lessonSlug: params.get('aula'),
    exerciseSlug: params.get('exercicio'),
  };
}

export function routeUrl(pathname, { phaseId, lessonSlug, exerciseSlug }) {
  const params = new URLSearchParams();

  if (phaseId) {
    params.set('fase', phaseId);
  }
  if (lessonSlug) {
    params.set('aula', lessonSlug);
  }
  if (exerciseSlug) {
    params.set('exercicio', exerciseSlug);
  }

  return `${pathname}${params.size > 0 ? `?${params}` : ''}`;
}

export function pushRoute(route, browser = globalThis) {
  browser.history.pushState(route, '', routeUrl(browser.location.pathname, route));
}

export function replaceRoute(route, browser = globalThis) {
  browser.history.replaceState(route, '', routeUrl(browser.location.pathname, route));
}

export function onRouteChange(listener, browser = globalThis) {
  browser.addEventListener('popstate', () => listener(readRoute(browser.location.href)));
}
