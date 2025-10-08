export function calculateDuration(value: number) {
  // 1 - 5 => 0.3
  // 6 - 10 => 0.1
  // 11 - 49 => 0.04
  // 50 - 99 => 0.02

  let timePerUnit = 0.01

  if (value >= 1 && value <= 5) {
    timePerUnit = 0.2
  } else if (value >= 6 && value <= 10) {
    timePerUnit = 0.07
  } else if (value >= 11 && value <= 49) {
    timePerUnit = 0.04
  } else if (value >= 50 && value <= 99) {
    timePerUnit = 0.02
  }

  const duration = timePerUnit * Math.abs(value)

  return duration
}
