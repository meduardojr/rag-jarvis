export const FREE_MODELS = [
  'gemini-flash',
  'groq-llama3-8b',
  'groq-llama3-70b',
] as const;

export const PAID_MODELS = [
  'claude-3-opus',
  'claude-3-sonnet',
  'claude-3-haiku',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
  'deepseek-chat',
  'qwen-flash',
] as const;

export type FreeModel = typeof FREE_MODELS[number];
export type PaidModel = typeof PAID_MODELS[number];
export type Model = FreeModel | PaidModel;

export function isPaidModel(model: Model): model is PaidModel {
  return PAID_MODELS.includes(model as PaidModel);
}