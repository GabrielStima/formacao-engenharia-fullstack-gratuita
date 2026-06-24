import { importProgress } from './progress-store.js';

const BACKUP_FILENAME = 'progresso-formacao-fullstack.json';

function messageForIgnored(ids) {
  if (ids.length === 0) {
    return 'Progresso importado.';
  }

  const label = ids.length === 1 ? 'código desconhecido foi ignorado' : 'códigos desconhecidos foram ignorados';
  return `Progresso importado. ${ids.length} ${label}.`;
}

export function createProgressDownload(json, {
  documentRef = globalThis.document,
  urlApi = globalThis.URL,
  BlobClass = globalThis.Blob,
  schedule = globalThis.setTimeout,
} = {}) {
  const url = urlApi.createObjectURL(new BlobClass([json], { type: 'application/json' }));
  const link = documentRef.createElement('a');
  link.href = url;
  link.download = BACKUP_FILENAME;
  documentRef.body.append(link);
  link.click();
  link.remove();
  schedule(() => urlApi.revokeObjectURL(url), 0);
}

export function bindSettings({ dialog, store, knownIds, onChange, notify }) {
  const content = dialog.querySelector('#settings-dialog-content');

  content.innerHTML = `
    <div class="settings-shell">
      <h2 id="settings-title">Seu progresso</h2>
      <p>As conclusões ficam somente neste navegador. Exporte um backup para levá-las a outro dispositivo.</p>
      <div class="settings-actions">
        <button type="button" data-export>Exportar JSON</button>
        <label class="file-button">
          Importar backup
          <input data-import type="file" accept="application/json,.json">
        </label>
        <button type="button" data-clear>Limpar progresso</button>
      </div>
      <button type="button" data-close>Fechar</button>
    </div>
  `;

  content.querySelector('[data-export]').addEventListener('click', () => {
    createProgressDownload(store.export());
  });

  content.querySelector('[data-import]').addEventListener('change', async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    try {
      const imported = importProgress(await file.text(), knownIds);
      const replace = globalThis.confirm('OK para substituir o progresso atual. Cancelar para mesclar.');

      if (replace) {
        store.replace(imported.completedLessonIds);
      } else {
        store.merge(imported.completedLessonIds);
      }

      onChange();
      notify(messageForIgnored(imported.ignoredLessonIds));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Não foi possível importar o backup.');
    } finally {
      input.value = '';
    }
  });

  content.querySelector('[data-clear]').addEventListener('click', () => {
    if (!globalThis.confirm('Apagar todo o progresso deste navegador?')) {
      return;
    }

    store.clear();
    onChange();
    notify('Progresso apagado.');
  });

  content.querySelector('[data-close]').addEventListener('click', () => dialog.close());
}
