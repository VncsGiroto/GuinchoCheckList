import { describe, expect, it } from "vitest";
import { isDatabaseNullPointerError } from "./databaseError";

describe("isDatabaseNullPointerError", () => {
  it("returns true for NativeDatabase null pointer errors", () => {
    const error = new Error(
      "Call to function 'NativeDatabase.prepareAsync' has been rejected. Caused by: java.lang.NullPointerException",
    );
    expect(isDatabaseNullPointerError(error)).toBe(true);
  });

  it("returns false for generic errors", () => {
    const error = new Error("SQL syntax error near SELECT");
    expect(isDatabaseNullPointerError(error)).toBe(false);
  });
});
