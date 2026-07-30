import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

test("the product is a single five-question answer sheet", () => {
  assert.equal((html.match(/class="question"/g) || []).length, 5);
  assert.equal((html.match(/<textarea /g) || []).length, 5);
  assert.equal((html.match(/class="exam-paper"/g) || []).length, 1);
  assert.match(css, /width: min\(100%, 794px\)/);
  assert.match(css, /min-height: 1123px/);
  assert.match(css, /@page \{ size: A4 portrait; margin: 0; \}/);
});

test("submission, scoring, identity, timer and leaderboard are absent", () => {
  assert.doesNotMatch(html + app, /送出|排行榜|student-name|student-group|timer|total-score|apiUrl|fetch\(/i);
  assert.doesNotMatch(html, /config\.js|apps-script/i);
});

test("answers remain device-local only", () => {
  assert.match(app, /localStorage\.setItem/);
  assert.doesNotMatch(app, /fetch\(|XMLHttpRequest|sendBeacon|WebSocket/i);
});

test("copying question text appends the encoded instruction", () => {
  assert.match(app, /addEventListener\("copy"/);
  assert.match(app, /clipboardData\.setData\("text\/plain", selection \+ attackPayload\)/);
  const encoded = app.match(/atob\(\s*"([^"]+)"/)?.[1];
  assert.ok(encoded);
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  assert.match(decoded, /馬達加斯加/);
});

test("URL agents and screenshots each have a machine-readable channel", () => {
  assert.match(html, /name="ai-exam-context"/);
  assert.match(html, /class="agent-context"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /class="vision-marker"/);
  assert.match(css, /\.vision-marker/);
  assert.match(css, /rgba\(45, 55, 68, \.14\)/);
});
