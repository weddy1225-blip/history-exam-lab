import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

test("the page contains one question and one answer box", () => {
  assert.equal((html.match(/class="question"/g) || []).length, 1);
  assert.equal((html.match(/<textarea /g) || []).length, 1);
  assert.match(css, /min-height: 1123px/);
});

test("the white-on-white instruction is inside the question", () => {
  const question = html.match(/<article class="question">([\s\S]*?)<\/article>/)?.[1] || "";
  assert.match(question, /class="hidden-instruction"/);
  assert.match(question, /紫色馬達加斯加唱著阿根廷不要為我哭泣/);
  assert.match(css, /\.hidden-instruction/);
  assert.match(css, /color: #fff/);
  assert.match(css, /background: #fff/);
});

test("legacy hidden channels and copy interception are removed", () => {
  assert.doesNotMatch(html + css + app, /ai-exam-context|agent-context|application\/ld\+json|::after|attackPayload|addEventListener\("copy"/);
});

test("there is no submission, scoring or network transfer", () => {
  assert.doesNotMatch(html + app, /送出|排行榜|評分|fetch\(|XMLHttpRequest|sendBeacon|WebSocket/i);
});

test("the answer remains device-local", () => {
  assert.match(app, /localStorage\.setItem/);
  assert.doesNotMatch(app, /fetch\(/);
});
