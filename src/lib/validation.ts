/**
 * Validate token name (1-32 characters)
 * @param name Token name
 * @returns True if valid
 */
export function validateName(name: string): boolean {
  return name.length >= 1 && name.length <= 32;
}

/**
 * Validate token symbol (1-10 characters)
 * @param symbol Token symbol
 * @returns True if valid
 */
export function validateSymbol(symbol: string): boolean {
  return symbol.length >= 1 && symbol.length <= 10;
}

/**
 * Validate decimals (0-9 integer)
 * @param decimals Number of decimal places
 * @returns True if valid
 */
export function validateDecimals(decimals: number): boolean {
  return Number.isInteger(decimals) && decimals >= 0 && decimals <= 9;
}

/**
 * Validate supply (positive number)
 * @param supply Initial token supply
 * @returns True if valid
 */
export function validateSupply(supply: number): boolean {
  return typeof supply === 'number' && !isNaN(supply) && supply > 0;
}
