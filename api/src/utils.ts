export function formatTime(value: Date): string {
  return value instanceof Date ? value.toISOString().substring(11, 16) : value
}
