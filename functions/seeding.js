// Every active member of a league has a rating for the current season: 1000 until they play. Kept free of Firebase so
// it can be tested on its own.
const { memberList, roleFor } = require('./membership')

const START_ELO = 1000

// Rating names are UDisc names used as database keys, which can't be empty or contain . # $ [ ] /
const validKey = (name) => typeof name === 'string' && name.trim() !== '' && !/[.#$[\]/]/.test(name)

// What to write so every active member has a rating and a rating change (0) this season, leaving existing ones alone.
// Returns { "<league>/currentElo/<season>/<name>": 1000, "<league>/eloDelta/<season>/<name>": 0 }.
const eloSeedWrites = ({ league, season, players, currentElo, eloDelta }) => {
  const writes = {}
  if (!league || season === undefined || season === null || season === '') return writes
  const names = memberList(players)
    .filter(member => roleFor(member.membershipStatus))
    .map(member => member.uDiscDisplayName)
    .filter(validKey)
  for (const name of new Set(names)) {
    if (!currentElo || currentElo[name] === undefined) writes[`${league}/currentElo/${season}/${name}`] = START_ELO
    if (!eloDelta || eloDelta[name] === undefined) writes[`${league}/eloDelta/${season}/${name}`] = 0
  }
  return writes
}

module.exports = { START_ELO, validKey, eloSeedWrites }
