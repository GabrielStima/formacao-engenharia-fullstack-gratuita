import assert from 'node:assert/strict';
import test from 'node:test';

import { createProgressDownload } from '../../src/js/settings-dialog.js';

test('anexa, aciona e remove o link antes de revogar o download', () => {
  const events = [];
  const link = {
    click() {
      events.push('click');
    },
    remove() {
      events.push('remove');
    },
  };
  const documentRef = {
    body: {
      append(element) {
        assert.equal(element, link);
        events.push('append');
      },
    },
    createElement(tagName) {
      assert.equal(tagName, 'a');
      return link;
    },
  };
  const urlApi = {
    createObjectURL(blob) {
      assert.deepEqual(blob, { parts: ['{"schemaVersion":1}'], options: { type: 'application/json' } });
      events.push('create-url');
      return 'blob:progress';
    },
    revokeObjectURL(url) {
      assert.equal(url, 'blob:progress');
      events.push('revoke');
    },
  };
  class FakeBlob {
    constructor(parts, options) {
      return { parts, options };
    }
  }
  const schedule = (callback) => {
    events.push('schedule');
    callback();
  };

  createProgressDownload('{"schemaVersion":1}', {
    documentRef,
    urlApi,
    BlobClass: FakeBlob,
    schedule,
  });

  assert.equal(link.href, 'blob:progress');
  assert.equal(link.download, 'progresso-formacao-fullstack.json');
  assert.deepEqual(events, ['create-url', 'append', 'click', 'remove', 'schedule', 'revoke']);
});
