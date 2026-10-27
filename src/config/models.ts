const MODEL_REFERENCE_PATTERN = /^[^\s/]+\/[^\s]+$/;

const PROVIDER_ENV_KEYS: Record<string, string> = {
  openai: 'OPENAI_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  gemini: 'GEMINI_API_KEY',
  google: 'GEMINI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  groq: 'GROQ_API_KEY',
  xai: 'XAI_API_KEY',
  azure: 'AZURE_API_KEY',
  ollama: ''
};

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

export function providerOf(modelName: string): string {
  const trimmed = modelName.trim();
  const separator = trimmed.indexOf('/');
  return separator === -1 ? '' : trimmed.slice(0, separator).toLowerCase();
}

/** Variable de entorno que Aider espera para el proveedor del modelo. */
export function aiderEnvKey(modelName: string): string {
  const provider = providerOf(modelName);
  if (provider.length === 0) {
    return 'OPENAI_API_KEY';
  }
  return PROVIDER_ENV_KEYS[provider] ?? 'OPENAI_API_KEY';
}

/**
 * Aider usa `gemini/...` donde OpenCode usa `google/...`. El resto de los
 * proveedores comparten el mismo prefijo.
 */
export function aiderModelFor(modelName: string): string {
  const trimmed = modelName.trim();
  if (trimmed.startsWith('google/')) {
    return `gemini/${trimmed.slice('google/'.length)}`;
  }
  return trimmed;
}

export function aiderEnvFor(
  modelName: string,
  apiKey: string | undefined
): Record<string, string> {
  if (apiKey === undefined || apiKey.length === 0) {
    return {};
  }
  const key = aiderEnvKey(modelName);
  return key.length === 0 ? {} : { [key]: apiKey };
}
