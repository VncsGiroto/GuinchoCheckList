export const isDatabaseNullPointerError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("NativeDatabase.") && message.includes("NullPointerException");
};
