/**
 * OpenAI Configuration
 * Centralized configuration for all OpenAI API usage
 */

export const OPENAI_CONFIG = {
  /**
   * Default model for all AI operations
   * GPT-4o-mini: Cheaper, faster, higher rate limits
   * - Cost: $0.15 per 1M input tokens, $0.60 per 1M output tokens
   * - Rate limits: 200K TPM (tokens per minute)
   * - Speed: ~2x faster than GPT-4
   * - Quality: Excellent for most tasks
   */
  DEFAULT_MODEL: 'gpt-4o-mini',
  
  /**
   * Model for complex reasoning tasks (if needed)
   * Use sparingly - 15x more expensive than gpt-4o-mini
   */
  PREMIUM_MODEL: 'gpt-4',
  
  /**
   * Default temperature for consistent results
   */
  DEFAULT_TEMPERATURE: 0.3,
  
  /**
   * Max tokens for responses
   */
  DEFAULT_MAX_TOKENS: 400,
} as const;

/**
 * Get the model to use based on environment or default
 */
export function getOpenAIModel(taskType?: 'default' | 'premium'): string {
  // Allow override via environment variable
  if (process.env.OPENAI_MODEL) {
    return process.env.OPENAI_MODEL;
  }
  
  // Use premium model for complex tasks if specified
  if (taskType === 'premium') {
    return OPENAI_CONFIG.PREMIUM_MODEL;
  }
  
  return OPENAI_CONFIG.DEFAULT_MODEL;
}
