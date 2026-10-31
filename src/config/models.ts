const MODEL_REFERENCE_PATTERN = /^[^\s/]+\/[^\s]+$/;

/** `provider/model` de OpenCode. Un `modelName` vacío significa heredar. */
export function isModelReference(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length === 0 || MODEL_REFERENCE_PATTERN.test(trimmed);
}

export function validateModelReference(value: string): string | undefined {
  return isModelReference(value)
    ? undefined
    : 'Usa el formato provider/model, por ejemplo openai/gpt-5.';
}
