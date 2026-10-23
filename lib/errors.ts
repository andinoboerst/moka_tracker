/** Safely extract a message from an unknown thrown value. */
export function getErrorMessage(err: unknown, fallback = 'Internal server error'): string {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err) return err
  return fallback
}

/** Safely extract a stack trace from an unknown thrown value. */
export function getErrorStack(err: unknown): string | undefined {
  return err instanceof Error ? err.stack : undefined
}
