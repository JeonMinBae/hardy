import { expect, it } from "vitest";
import { formatElapsed } from "./time";

it.each([
  [0, "00:00"],
  [59, "00:59"],
  [3599, "59:59"],
  [3600, "1:00:00"],
  [3725, "1:02:05"],
])("formatElapsed(%i) = %s", (seconds, text) => {
  expect(formatElapsed(seconds)).toBe(text);
});
