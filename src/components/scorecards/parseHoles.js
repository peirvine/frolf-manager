import './scorecards.scss'


// Maps a hole score and its par to the CSS class that colors it
export function getHoleClass (hole, par) {
  const score = hole - par
  let holeClass = "par"

  switch (score) {
    case -4:
      holeClass = 'condor'
      break
    case -3:
      holeClass = 'albatross'
      break
    case -2:
      holeClass = 'eagle'
      break
    case -1:
      holeClass = 'birdie'
      break
    case 1:
      holeClass = 'bogey'
      break
    case 2:
      holeClass = 'doubleBogey'
      break
    case 3:
      holeClass = 'overDoubleBogey'
      break
    default:
      break
  }

  if (score < "-3") {
    holeClass = 'condor'
  }

  if (score > "3") {
    holeClass = 'overDoubleBogey'
  }

  if (hole === "1") {
    holeClass = "ace"
  }

  if (hole === "0") {
    holeClass = "par"
  }

  return holeClass
}

// Splits a round into groups of 9 holes (front/back nine) so rows wrap between groups, never mid-group
export function chunkHoles (list, size = 9) {
  const groups = []
  for (let i = 0; i < list.length; i += size) groups.push(list.slice(i, i + size))
  return groups
}

export function sumHoles (holes) {
  return holes.reduce((sum, hole) => sum + (Number(hole) || 0), 0)
}

// "Out"/"In" for a standard 18 hole round, otherwise a generic label
export function groupLabel (groupIndex, totalHoles) {
  if (totalHoles === 18) return groupIndex === 0 ? "Front 9" : "Back 9"
  return "Sub"
}
