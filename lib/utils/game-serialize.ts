// Serialization helpers for usedPositions and usedSequences
export function serializeUsedPositions(set: Set<string>): string[] {
  return Array.from(set)
}

export function deserializeUsedPositions(arr: string[] | undefined | null): Set<string> {
  if (!arr) return new Set()
  return new Set(arr)
}

export function serializeUsedSequences(sequences: Array<Array<[number, number]>>): string[][] {
  // Convert positions to 'r,c' strings for each sequence
  return sequences.map((seq) => seq.map(([r, c]) => `${r},${c}`))
}

export function deserializeUsedSequences(arr: string[][] | undefined | null): Array<Array<[number, number]>> {
  if (!arr) return []
  return arr.map((seq) => seq.map((s) => {
    const [r, c] = s.split(",")
    return [Number(r), Number(c)] as [number, number]
  }))
}
