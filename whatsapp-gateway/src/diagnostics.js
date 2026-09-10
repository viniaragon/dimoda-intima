// Only fixed classifications leave this function. Never serialize an exception,
// its message/stack, IDs, arguments, request bodies, or third-party properties.
export function classifyError(error) {
  try {
    const kinds = new Set(['Error', 'TypeError', 'RangeError', 'SyntaxError', 'TimeoutError', 'ProtocolError', 'TargetCloseError']);
    const kind = kinds.has(error?.name) ? error.name : 'UnknownError';
    const codes = new Set(['GATEWAY_MISSING_MESSAGE_ID', 'SQLITE_BUSY', 'SQLITE_FULL', 'SQLITE_IOERR', 'SQLITE_READONLY', 'ERR_SQLITE_ERROR', 'ECONNRESET', 'EPIPE']);
    const code = codes.has(error?.code) ? error.code : 'unclassified';
    const text = [error?.message, error?.stack].filter(value => typeof value === 'string').join('\n');
    let category = 'unclassified';
    if (code === 'GATEWAY_MISSING_MESSAGE_ID') category = 'missing_message_id';
    else if (/getMessageModel|Message\._patch|Message\.js:\d/.test(text)) category = 'message_serialization';
    else if (/Target closed|TargetCloseError|Session closed|Connection closed/.test(text)) category = 'browser_closed';
    else if (/ProtocolError|Runtime\.callFunctionOn|Runtime\.evaluate/.test(text)) category = 'browser_protocol';
    else if (/timeout|timed out/i.test(text)) category = 'timeout';
    else if (/SQLITE|database is|disk I\/O/i.test(text)) category = 'storage';
    return { kind, code, category };
  } catch { return { kind: 'UnknownError', code: 'unclassified', category: 'unclassified' }; }
}

const EVENTS = new Set(['send_failed', 'send_timeout', 'initialization_failed', 'verification_failed', 'uncaught_exception', 'unhandled_rejection']);
export function diagnosticRecord(event, error) {
  return { event: EVENTS.has(event) ? event : 'unclassified', ...classifyError(error) };
}
