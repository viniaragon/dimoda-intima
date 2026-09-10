import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagnosticRecord } from '../src/diagnostics.js';

test('diagnostics classify serializer failure without leaking exception data', () => {
  const error = new TypeError('private token phone message');
  error.stack = 'TypeError: private token phone message\n at window.WWebJS.getMessageModel (private-path:1:2)';
  error.code = 'SECRET_CODE';
  assert.deepEqual(diagnosticRecord('send_failed', error), {
    event: 'send_failed', kind: 'TypeError', code: 'unclassified', category: 'message_serialization',
  });
});
test('diagnostics use only enumerated values for arbitrary and hostile exceptions', () => {
  assert.deepEqual(diagnosticRecord('secret-event', { name: 'secret', code: 'secret', message: 'secret' }), {
    event: 'unclassified', kind: 'UnknownError', code: 'unclassified', category: 'unclassified',
  });
  const hostile = { get name() { throw Error('secret'); } };
  assert.equal(diagnosticRecord('unhandled_rejection', hostile).kind, 'UnknownError');
  assert.equal(diagnosticRecord('uncaught_exception', { name: 'Error', code: 'SQLITE_FULL', message: 'disk I/O private-path' }).category, 'storage');
  assert.equal(diagnosticRecord('send_failed', { name: 'Error', code: 'GATEWAY_MISSING_MESSAGE_ID' }).category, 'missing_message_id');
});
