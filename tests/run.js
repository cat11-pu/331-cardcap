import assert from "node:assert";
import { bumpLabel, overflowLeft } from "../cards.js";
import { step, close } from "../cardrun.js";
import { render } from "../app.js";

const base = {
  budget: 1, cap: 2, overflow_cap: 3,
  state: { labels: [], overflow: 0, ledger: [], applied: [] },
  events: [{ id: 1, kind: "report", label: "a", value: 5 }],
  label_error_code: "E_BAD_LABEL", value_error_code: "E_BAD_VALUE",
  overflow_error_code: "E_OVERFLOW_FULL", event_error_code: "E_BAD_EVENT"
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("bumpLabel returns rows", () => {
  assert.ok(Array.isArray(bumpLabel([], "z", 1)));
});

check("overflowLeft returns a number", () => {
  assert.strictEqual(typeof overflowLeft(0, 3), "number");
});

check("step returns a state", () => {
  assert.strictEqual(typeof step(base).state, "object");
});

check("close returns a state", () => {
  assert.strictEqual(typeof close(base).state, "object");
});

check("render counts events", () => {
  assert.strictEqual(typeof render(base).count_events, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
