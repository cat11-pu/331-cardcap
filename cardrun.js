// cardrun.js：按处理预算处理并留账
import { bumpLabel, overflowLeft } from "./cards.js";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function errorCodes(spec) {
  return {
    label: spec.label_error_code || "E_BAD_LABEL",
    value: spec.value_error_code || "E_BAD_VALUE",
    overflow: spec.overflow_error_code || "E_OVERFLOW_FULL",
    event: spec.event_error_code || "E_BAD_EVENT"
  };
}

function validateEvent(event, codes) {
  const label = event ? event.label : undefined;
  const value = event ? event.value : undefined;
  if (typeof label !== "string" || label.length === 0) {
    fail(codes.label, "标签必须是非空字符串");
  }
  if (!Number.isInteger(value) || value < 0) {
    fail(codes.value, "数值必须是非负整数");
  }
  if (typeof event !== "object" || event === null || Array.isArray(event) || event.kind !== "report") {
    fail(codes.event, "事件结构不合法");
  }
}

function copyState(state) {
  const source = state || {};
  return {
    labels: (source.labels || []).map(function (row) { return [row[0], row[1]]; }),
    overflow: source.overflow || 0,
    ledger: (source.ledger || []).map(function (entry) { return entry.slice(); }),
    applied: (source.applied || []).slice()
  };
}

function applyLabel(state, spec, codes, label, value) {
  for (const row of state.labels) {
    if (row[0] === label) {
      row[1] += value;
      return;
    }
  }
  if (state.labels.length < spec.cap) {
    state.labels = bumpLabel(state.labels, label, value);
    return;
  }
  if (overflowLeft(state.overflow, spec.overflow_cap) <= 0) {
    fail(codes.overflow, "溢出桶已经折满");
  }
  state.overflow += value;
}

export function step(spec) {
  const state = copyState(spec.state);
  const events = spec.events || [];
  const codes = errorCodes(spec);
  let budget = spec.budget || 0;
  let served = 0;
  let judged = 0;
  for (const event of events) {
    if (event && state.applied.indexOf(event.id) !== -1) {
      continue;
    }
    validateEvent(event, codes);
    judged += 1;
    if (budget <= 0) {
      state.ledger.push([event.kind, event.label, event.value]);
      state.applied.push(event.id);
      continue;
    }
    budget -= 1;
    applyLabel(state, spec, codes, event.label, event.value);
    state.applied.push(event.id);
    served += 1;
  }
  return {
    state: state,
    served: served,
    ledger_before: state.ledger.length,
    ledger: state.ledger,
    judged: judged,
    judged_bound: events.length
  };
}

export function close(spec) {
  const state = copyState(spec.state);
  const codes = errorCodes(spec);
  let catchup = 0;
  while (state.ledger.length > 0) {
    const entry = state.ledger.shift();
    applyLabel(state, spec, codes, entry[1], entry[2]);
    catchup += 1;
  }
  return { state: state, catchup: catchup };
}
