export async function loadCatalog(fetcher = fetch) {
  const response = await fetcher('data/catalog.json');

  if (!response.ok) {
    throw new Error(`Catálogo indisponível (${response.status})`);
  }

  return response.json();
}

export async function loadLesson(url, fetcher = fetch) {
  const response = await fetcher(url);

  if (!response.ok) {
    throw new Error(`Aula indisponível (${response.status})`);
  }

  return response.text();
}
