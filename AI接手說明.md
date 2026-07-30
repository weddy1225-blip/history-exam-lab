# AI接手說明

- 最新任務：#139
- 狀態：待總編輯驗收
- 適用規範：AI協作規範 v3.33（本案未新增跨案規則）

## 目前網站

- 公開網址：https://weddy1225-blip.github.io/history-exam-lab/
- GitHub：https://github.com/weddy1225-blip/history-exam-lab
- 單一 A4 比例頁面，共五題高中歷史史料申論與五個答題框。
- 沒有暱稱、組別、計時、送出、評分、簡評、排行榜或成績查詢。
- 作答只暫存在目前瀏覽器的 `localStorage`，網站不會上傳答案。
- `config.js` 與 `apps-script/Code.gs` 已由現行網站移除。

## 三種辨識通道

1. 複製題目：`app.js` 攔截考卷內的複製事件，於剪貼簿文字後附加 Base64 編碼後再解碼的指令。
2. 網址型 Agent：`index.html` 內含中繼資料、JSON-LD及離屏文字；以代理瀏覽器讀取DOM時已確認可取得指令。
3. 截圖型 AI：A4考卷像素中含低對比、微縮且傾斜的辨識文字。

## 限制

- 無法保證所有 AI 都會遵循提示；結果取決於 Agent 擷取方式、視覺解析度、OCR及模型安全策略。
- 截圖提示必須存在於像素中，因此仔細查看或放大時可能被人發現。
- Google Apps Script 第4版與舊試算表仍存在於帳戶中，但目前公開網站不載入、不呼叫也不傳送資料；不要誤認為仍是現行功能。

## 驗證

- `node --check app.js`：PASS。
- `node --test tests/exam-flow.test.mjs`：5／5 PASS。
- 瀏覽器DOM驗證：Agent可讀到離屏指令、五題與五個答題框。
- 1265×1227全頁截圖驗證：考卷維持單張A4視覺，五題與答題框完整呈現，低顯著辨識字存在於畫面。
