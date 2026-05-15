import { translateStoredExpertValue } from './dbValues'

/** @deprecated Use translateStoredExpertValue from dbValues */
export function translateExpertValue(
  value: string | undefined,
  t: (path: string) => string,
  fallback = 'Boiling'
): string {
  return translateStoredExpertValue(value, t, fallback)
}
