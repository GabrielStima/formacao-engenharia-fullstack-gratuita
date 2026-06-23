import assert from 'node:assert/strict';
import test from 'node:test';

import { contentTypeFor, safeFilePath } from '../../scripts/serve.mjs';

test('returns the expected content types', () => {
  assert.equal(contentTypeFor('catalog.json'), 'application/json; charset=utf-8');
  assert.equal(contentTypeFor('app.js'), 'text/javascript; charset=utf-8');
});

test('rejects paths that traverse outside the distribution directory', () => {
  assert.throws(
    () => safeFilePath('/tmp/dist', '/../README.md'),
    /Caminho inválido/,
  );
});
