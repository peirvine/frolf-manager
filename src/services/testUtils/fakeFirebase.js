// An in-memory stand-in for src/firebase.js, for service tests. Use it with:
//   jest.mock('../firebase', () => require('./testUtils/fakeFirebase'))
// Data lives in one tree laid out like the Realtime Database, and each function reads and writes the same paths,
// returning what the real one does for missing data ([] / 'null' / "error" / ...). Values are copied on the way in
// and out, and empty lists and objects aren't kept, like a real database. `fail("name")` makes that function behave as if the database call failed.
let tree = {}
let failing = new Set()
let nextId = 1

const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value))

// Firebase doesn't store empty lists or objects; undefined means "remove"
const prune = (value) => {
  if (value === null || typeof value !== 'object') return value
  const entries = Object.entries(value).map(([key, child]) => [key, prune(child)]).filter(([, child]) => child !== undefined)
  if (entries.length === 0) return undefined
  return Array.isArray(value) ? entries.map(([, child]) => child) : Object.fromEntries(entries)
}
const split = (path) => path.split('/').filter(Boolean)

export const read = (path) => {
  let node = tree
  for (const part of split(path)) {
    if (node === null || typeof node !== 'object' || !(part in node)) return undefined
    node = node[part]
  }
  return clone(node)
}

export const write = (path, value) => {
  const parts = split(path)
  const last = parts.pop()
  let node = tree
  for (const part of parts) {
    if (node[part] === null || typeof node[part] !== 'object') node[part] = {}
    node = node[part]
  }
  const stored = prune(clone(value))
  if (stored === null || stored === undefined) delete node[last]
  else node[last] = stored
}

// Starts every test from a known database; `data` is the whole tree, e.g. { users: {...}, maftb: { info: {...} } }
export const reset = (data = {}) => {
  tree = clone(data)
  failing = new Set()
  nextId = 1
}

export const fail = (...names) => names.forEach(name => failing.add(name))
const failed = (name) => failing.has(name)

const ok = { code: "success", message: "" }
const error = { code: "error", message: "Fake failure" }
const writeResult = (name, path, value) => {
  if (failed(name)) return Promise.resolve(error)
  write(path, value)
  return Promise.resolve(ok)
}
const readResult = (name, path, missing, onError) => {
  if (failed(name)) return Promise.resolve(onError)
  const value = read(path)
  return Promise.resolve(value === undefined ? missing : value)
}

/****************** Scorecards ******************/
export const writeScorecardToDatabase = (league, card, season) => {
  if (failed('writeScorecardToDatabase')) return Promise.resolve({ code: "error", message: "Error, card not added." })
  const id = nextId++
  const key = card.course + " " + card.date + " " + id
  write(`${league}/scorecards/${season}/${key}`, {
    Course: card.course, Layout: card.layout, Players: card.playerArray, Date: card.date, Par: card.par, id,
    dateAdded: new Date(2026, 0, id).toString(), rawUDiscCard: card.rawUDiscCard, isOffSeason: card.isOffSeason,
    handicapsApplied: Boolean(card.handicapsApplied),
  })
  return Promise.resolve({ code: "success", message: "Scorecard added successfully.", key })
}
export const getScorecards = (league, season) => readResult('getScorecards', `${league}/scorecards/${season}`, [], undefined)
export const getAllScorecards = (league) => readResult('getAllScorecards', `${league}/scorecards`, {}, undefined)
export const getSpecificScorecard = (league, season, id) => readResult('getSpecificScorecard', `${league}/scorecards/${season}/${id}`, null, null)
export const setSpecificScorecard = (league, season, id, card) => writeResult('setSpecificScorecard', `${league}/scorecards/${season}/${id}`, card)
export const deleteSpecificScorecard = (league, season, id) => writeResult('deleteSpecificScorecard', `${league}/scorecards/${season}/${id}`, null)
export const setCardHatWinners = (league, season, key, winners) => (
  writeResult('setCardHatWinners', `${league}/scorecards/${season}/${key}/hatWinners`, winners.length ? winners : null)
)

/****************** Handicaps ******************/
export const getStoredHandicaps = (league) => readResult('getStoredHandicaps', `${league}/handicaps`, null, null)
export const setStoredHandicaps = (league, handicaps) => writeResult('setStoredHandicaps', `${league}/handicaps`, handicaps)

/****************** Elo ******************/
export const writeEloTracking = (league, elo, season) => (
  writeResult('writeEloTracking', `${league}/eloTracking/${season}/${elo.course} ${elo.layout} ${nextId++}`, {
    Course: elo.course, Layout: elo.layout, Players: elo.players, cardAverage: elo.average, strokesPerHole: elo.strokesPerHole,
    pointsPerThrow: elo.pointsPerThrow, averageEloOfPlayers: elo.averageEloOfPlayers,
  })
)
export const getELOHistory = (league, season) => readResult('getELOHistory', `${league}/eloTracking/${season}`, undefined, undefined)
export const addEloToPlayerV2 = (league, elo, season) => writeResult('addEloToPlayerV2', `${league}/playerEloHistory/${season}/${elo.player}`, elo.elo)
export const getElosOfPlayer = (player, season, league) => readResult('getElosOfPlayer', `${league}/playerEloHistory/${season}/${player}`, 'null', undefined)
export const getElosOfAllPlayers = (season, league) => readResult('getElosOfAllPlayers', `${league}/playerEloHistory/${season}`, 'null', undefined)
export const getCurrentElo = (league, season) => readResult('getCurrentElo', `${league}/currentElo/${season}`, [], undefined)
export const updateCurrentEloV2 = (league, season, elos) => writeResult('updateCurrentEloV2', `${league}/currentElo/${season}`, elos)
export const getDelta = (league, season) => readResult('getDelta', `${league}/eloDelta/${season}`, undefined, undefined)
export const setDeltaV2 = (league, season, delta) => writeResult('setDeltaV2', `${league}/eloDelta/${season}`, delta)
export const getEloGraphData = (league, season) => readResult('getEloGraphData', `${league}/eloGraphData/${season}`, undefined, undefined)
export const setEloGraphDataV2 = (league, season, graph) => writeResult('setEloGraphDataV2', `${league}/eloGraphData/${season}/${graph.course} ${nextId++}`, graph)
export const resetEloData = (league, season, entry) => writeResult('resetEloData', `${league}/${entry}/${season}`, null)
export const getSeasonStats = (league, season) => readResult('getSeasonStats', `${league}/stats/${season}`, null, null)
export const setSeasonStats = (league, season, stats) => writeResult('setSeasonStats', `${league}/stats/${season}`, stats)

/****************** Hats ******************/
export const getHatCounts = (league) => readResult('getHatCounts', `${league}/hatCount`, {}, {})
export const getHatCount = (league, player) => readResult('getHatCount', `${league}/hatCount/${player}`, 0, 0)
export const resetHatCounts = (league) => writeResult('resetHatCounts', `${league}/hatCount`, null)
export const incrementHatCount = (league, player, change = 1) => (
  writeResult('incrementHatCount', `${league}/hatCount/${player}`, Math.max(0, (read(`${league}/hatCount/${player}`) || 0) + change))
)

/****************** League and users ******************/
export const getLeagueSettings = (league) => readResult('getLeagueSettings', `${league}/info`, "error", undefined)
export const updateLeagueSettings = (league, info) => {
  if (failed('updateLeagueSettings')) return Promise.resolve({ code: "error", message: "League Not Updated" })
  write(`${league}/info`, { ...(read(`${league}/info`) || {}), ...info })
  return Promise.resolve({ code: "success", message: "League setting updated successfully!" })
}
export const getLeagueMembers = (league) => {
  if (failed('getLeagueMembers')) return Promise.resolve(undefined)
  return Promise.resolve(Object.values(read(`${league}/players`) || {}).filter(member => member && member.id))
}
export const getUserDataV2 = (user) => readResult('getUserDataV2', `users/${user.displayName} ${user.uid}`, undefined, undefined)
export const getDoinkFundPlayers = (league) => readResult('getDoinkFundPlayers', `${league}/doinkfund/players`, undefined, undefined)
