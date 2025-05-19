export const entriesChronologically = (a: [string, Room], b: [string, Room]) => {
  return Number(b[1]?.index || 0) - Number(a[1].index || 0)
}

export const entriesByVisit = (a: [string, Room], b: [string, Room]) => {
  const aVisitCount = Number(a[1]?.visitCount || 0)
  const bVisitCount = Number(b[1]?.visitCount || 0)
  return bVisitCount - aVisitCount
}

export const entriesByBalance = (a: [string, Room], b: [string, Room]) => {
  return Number(b[1].balance || 0) - Number(a[1].balance || 0)
}

export const entriesByKillCount = (a: [string, Room], b: [string, Room]) => {
  const aKillCount = Number(a[1]?.killCount || 0)
  const bKillCount = Number(b[1]?.killCount || 0)
  return bKillCount - aKillCount
}