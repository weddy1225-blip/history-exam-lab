"use strict";

const answer = document.getElementById("answer");
const draftKey = "historySingleQuestionDraft";

answer.value = localStorage.getItem(draftKey) || "";
answer.addEventListener("input", () => {
  localStorage.setItem(draftKey, answer.value);
});
