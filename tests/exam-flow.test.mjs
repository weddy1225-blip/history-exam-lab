import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const backend = await readFile(new URL("../apps-script/Code.gs", import.meta.url), "utf8");

test("retry reuses the pending submission id", () => {
  assert.match(app, /const record=state\.pendingRecord\|\|/);
  assert.match(app, /state\.pendingRecord=record;saveDraft\(\)/);
  assert.match(app, /delete record\.syncError/);
});

test("local leaderboard deduplicates by submission id", () => {
  assert.match(app, /list\.find\(x=>x\.submissionId===record\.submissionId\)/);
});

test("expired draft submits without creating a timer interval", () => {
  const expired = app.indexOf("if(d.endAt<=Date.now()){submitExam(true);return}");
  const interval = app.indexOf("tick();state.tick=setInterval(tick,1000)", expired);
  assert.ok(expired >= 0);
  assert.ok(interval > expired);
});

test("backend returns the existing row for duplicate ids", () => {
  assert.match(backend, /if \(duplicate\) \{/);
  assert.match(backend, /duplicate:true/);
  assert.match(backend, /sheet\.appendRow/);
});

test("timer alerts cannot be skipped by crossing a second boundary", () => {
  assert.match(app, /sec<=300&&!state\.alerted5/);
  assert.match(app, /sec<=60&&!state\.alerted1/);
});
