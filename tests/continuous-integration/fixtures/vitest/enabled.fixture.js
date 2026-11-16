import { expect, test } from "vitest";
import { answer } from "./source.js";

test("enabled answer", () => {
  expect(answer(true)).toBe(
    process.env.EXPECT_TEST_FAILURE === "true" ? -1 : 42,
  );
});
