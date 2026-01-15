export function getRarityColor(value: number): string {
  if (value >= 100) return "#9333ea" // Purple
  if (value >= 50) return "#eab308" // Yellow
  if (value >= 20) return "#9ca3af" // Gray
  return "#b45309" // Brown
}

export function getRarityTextColor(value: number): string {
  if (value >= 100) return "white" // Purple
  if (value >= 50) return "black" // Yellow
  if (value >= 20) return "black" // Gray
  return "white" // Brown
}

export function getRarityLabel(value: number): string {
  if (value >= 100) return "Legendary"
  if (value >= 50) return "Rare"
  if (value >= 20) return "Uncommon"
  return "Common"
}
