export const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'flash', description: 'fast & efficient' },
  { id: 'gemini-2.5-pro', name: 'pro', description: 'most capable' },
  { id: 'gemini-2.5-flash-lite', name: 'flash-lite', description: 'lightweight' },
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];
