export function generateRandomBytes32(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return '0x' + Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

export function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export function pickRandomMultiple<T>(array: T[], count: number): T[] {
  return array.sort(() => Math.random() - 0.5).slice(0, count)
}