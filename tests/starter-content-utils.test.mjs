import test from "node:test";
import assert from "node:assert/strict";
import { buildBlankFaqTextRepair } from "../starter-content-utils.js";

test("repairs only blank required FAQ text from the starter pack", () => {
  const result = buildBlankFaqTextRepair(
    {
      blankQuestion: { question: "   ", answer: "My custom answer", enabled: true },
      blankAnswer: { question: "My custom question", answer: "" },
      complete: { question: "Existing question?", answer: "Existing answer." },
      unrelated: { question: "", answer: "" }
    },
    {
      blankQuestion: { question: "Starter question?", answer: "Starter answer." },
      blankAnswer: { question: "Starter second question?", answer: "Starter second answer." },
      complete: { question: "Default question?", answer: "Default answer." },
      notPresent: { question: "New question?", answer: "New answer." }
    }
  );

  assert.deepEqual(result, {
    blankQuestion: { question: "Starter question?" },
    blankAnswer: { answer: "Starter second answer." }
  });
});

test("does not repair absent records or overwrite non-empty custom text", () => {
  const result = buildBlankFaqTextRepair(
    { custom: { question: "A custom question?", answer: "A custom answer." } },
    {
      custom: { question: "Starter question?", answer: "Starter answer." },
      absent: { question: "New question?", answer: "New answer." }
    }
  );

  assert.deepEqual(result, {});
});
