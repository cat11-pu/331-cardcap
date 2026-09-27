// cardrun.js：按处理预算处理并留账
import { bumpLabel, overflowLeft } from "./cards.js";

function codeOf(spec, key, fallback) {
  const code = spec[key];
  return typeof code === "string" && code ? code : fallback;
}

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function keyOf(kind, label, value) {
  return JSON.stringify([kind, label, value]);
}

function validateEvent(spec, event) {
  if (event === null || typeof event !== "object" || Array.isArray(event)) {
    fail(codeOf(spec, "event_error_code", "E_BAD_EVENT"), "event is not a plain object");
  }
  if (typeof event.label !== "string" || event.label.length === 0) {
    fail(codeOf(spec, "label_error_code", "E_BAD_LABEL"), "label must be a non-empty string");
  }
  if (typeof event.value !== "number" || !Number.isInteger(event.value) || event.value < 0) {
    fail(codeOf(spec, "value_error_code", "E_BAD_VALUE"), "value must be a non-negative integer");
  }
  if (event.kind !== "report") {
    fail(codeOf(spec, "event_error_code", "E_BAD_EVENT"), "event kind must be report");
  }
}

function validateEntry(spec, entry) {
  if (!Array.isArray(entry) || entry.length !== 3 || entry[0] !== "report") {
    fail(codeOf(spec, "event_error_code", "E_BAD_EVENT"), "ledger entry is malformed");
  }
  if (typeof entry[1] !== "string" || entry[1].length === 0) {
    fail(codeOf(spec, "label_error_code", "E_BAD_LABEL"), "label must be a non-empty string");
  }
  if (typeof entry[2] !== "number" || !Number.isInteger(entry[2]) || entry[2] < 0) {
    fail(codeOf(spec, "value_error_code", "E_BAD_VALUE"), "value must be a non-negative integer");
  }
}

function copyState(source) {
  return {
    labels: (source.labels || []).map(function (row) { return [row[0], row[1]]; }),
    overflow: source.overflow || 0,
    ledger: (source.ledger || []).map(function (row) { return row.slice(); }),
    applied: (source.applied || []).slice()
  };
}

function applyEntry(spec, state, label, value) {
  const registered = state.labels.some(function (row) { return row[0] === label; });
  if (registered || state.labels.length < spec.cap) {
    state.labels = bumpLabel(state.labels, label, value);
    return;
  }
  if (overflowLeft(state.overflow, spec.overflow_cap) <= 0) {
    fail(codeOf(spec, "overflow_error_code", "E_OVERFLOW_FULL"), "overflow bucket is full");
  }
  state.overflow += value;
}

export function step(spec) {
  const events = spec.events || [];
  const state = copyState(spec.state || {});
  for (const event of events) { validateEvent(spec, event); }
  let budget = spec.budget;
  let served = 0;
  let ledgered = 0;
  for (const event of events) {
    const key = keyOf(event.kind, event.label, event.value);
    if (state.applied.indexOf(key) >= 0) { continue; }
    if (budget > 0) {
      applyEntry(spec, state, event.label, event.value);
      state.applied.push(key);
      served += 1;
      budget -= 1;
    } else {
      state.ledger.push([event.kind, event.label, event.value]);
      ledgered += 1;
    }
  }
  return {
    state: state,
    served: served,
    ledger_before: state.ledger.length,
    ledger: state.ledger.map(function (row) { return row.slice(); }),
    judged: served + ledgered,
    judged_bound: events.length
  };
}

export function close(spec) {
  const state = copyState(spec.state || {});
  let catchup = 0;
  while (state.ledger.length > 0) {
    const entry = state.ledger[0];
    validateEntry(spec, entry);
    const key = keyOf(entry[0], entry[1], entry[2]);
    if (state.applied.indexOf(key) < 0) {
      applyEntry(spec, state, entry[1], entry[2]);
      state.applied.push(key);
    }
    state.ledger.shift();
    catchup += 1;
  }
  return { state: state, catchup: catchup };
}
