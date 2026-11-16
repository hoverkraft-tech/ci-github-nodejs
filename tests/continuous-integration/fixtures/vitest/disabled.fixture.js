import { expect, test } from "vitest";
import { answer } from "./source.js";

test("disabled answer", () => {
  expect(answer(false)).toBe(0);
});
