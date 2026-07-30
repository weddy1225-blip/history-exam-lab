import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const backend = await readFile(new URL("../apps-script/Code.gs", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

const groups = [
  "中高級教材組", "母語巢組", "初中級試題組", "來上客組", "哈客組",
  "研發組", "族語E樂園", "族語直播共學組", "逼萬行政組", "閩客直播共學組"
];

test("group options use the approved stroke-count order", () => {
  let cursor = -1;
  for (const group of groups) {
    const next = html.indexOf(`<option>${group}</option>`);
    assert.ok(next > cursor, `${group} is missing or out of order`);
    cursor = next;
    assert.ok(backend.includes(`'${group}'`), `${group} is missing from backend validation`);
  }
  assert.doesNotMatch(html, /<option>第[一二三四五六]組<\/option>/);
});

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
