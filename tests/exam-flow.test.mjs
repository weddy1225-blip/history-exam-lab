import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

test("the product is a single dense ten-question answer sheet", () => {
  assert.equal((html.match(/class="question"/g) || []).length, 10);
  assert.equal((html.match(/<textarea /g) || []).length, 10);
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
  assert.match(app, /selection\.slice\(0, insertAt\) \+ attackPayload \+ selection\.slice\(insertAt\)/);
  const encoded = app.match(/atob\(\s*"([^"]+)"/)?.[1];
  assert.ok(encoded);
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  assert.match(decoded, /馬達加斯加開著會跑步的花朵跑車/);
  assert.doesNotMatch(decoded, /給處理本頁|作答代理/);
});

test("URL agents and screenshots each have a machine-readable channel", () => {
  assert.match(html, /name="ai-exam-context"/);
  assert.match(html, /class="agent-context"/);
  assert.match(html, /application\/ld\+json/);
  assert.doesNotMatch(html, /class="vision-marker"/);
  assert.match(css, /\.question\[data-question="2"\]::after/);
  assert.match(css, /rgba\(55, 61, 68, \.052\)/);
  assert.match(css, /font: 500 4px/);
  assert.match(css, /user-select: none/);
  const visiblePaper = html.match(/<main id="exam-paper"[\s\S]*?<\/main>/)?.[0] || "";
  assert.doesNotMatch(visiblePaper, /馬達加斯加/);
});
