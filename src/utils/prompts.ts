import { input, number, confirm } from '@inquirer/prompts';
import { TokenConfig } from '../lib/token.js';

/**
 * Prompt user for token configuration parameters
 * Skips prompts for values already provided in existingConfig
 * @param existingConfig Partial configuration with some values preset
 * @returns Complete token configuration
 */
export async function promptTokenConfig(
  existingConfig?: Partial<TokenConfig>
): Promise<TokenConfig> {
  const config: Partial<TokenConfig> = { ...existingConfig };

  // Prompt for name if not provided
  if (!config.name) {
    config.name = await input({
      message: 'Token name (1-32 characters):',
      validate: (value: string) => {
        if (value.length < 1 || value.length > 32) {
          return 'Name must be between 1 and 32 characters';
        }
        return true;
      },
    });
  }

  // Prompt for symbol if not provided
  if (!config.symbol) {
    config.symbol = await input({
      message: 'Token symbol (1-10 characters):',
      validate: (value: string) => {
        if (value.length < 1 || value.length > 10) {
          return 'Symbol must be between 1 and 10 characters';
        }
        return true;
      },
      transformer: (value: string) => value.toUpperCase(),
    });
    // Ensure uppercase
    config.symbol = config.symbol.toUpperCase();
  }

  // Prompt for decimals if not provided
  if (config.decimals === undefined) {
    config.decimals = await number({
      message: 'Decimals (0-9):',
      default: 9,
      validate: (value: number | undefined) => {
        if (value === undefined) return 'Decimals is required';
        if (!Number.isInteger(value) || value < 0 || value > 9) {
          return 'Decimals must be an integer between 0 and 9';
        }
        return true;
      },
    });
  }

  // Prompt for supply if not provided
  if (!config.supply) {
    const supplyInput = await input({
      message: 'Initial supply:',
      validate: (value: string) => {
        const num = Number(value);
        if (isNaN(num) || num <= 0) {
          return 'Supply must be a positive number';
        }
        return true;
      },
    });
    config.supply = Number(supplyInput);
  }

  return config as TokenConfig;
}

/**
 * Prompt user for confirmation
 * @param message Confirmation message
 * @returns True if user confirmed, false otherwise
 */
export async function promptConfirmation(message: string): Promise<boolean> {
  return await confirm({
    message,
    default: false,
  });
}
