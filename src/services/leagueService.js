import { getLeagueMembers, getLeagueSettings, getUserDataV2, setDeltaV2, updateCurrentEloV2, updateLeagueSettings } from "../firebase";

// Pattern: Update the database, check for error, then move on. This way if you click the button again it'll just overwrite the failed update. Updating the season is last.
export async function startNewSeason ( league ) {
  // Season
  const currentSeason = await getCurrentSeason(league)
  if (currentSeason === false) return {code: "error", message: "Could not get current season"}
  let newSeason
  if (currentSeason === undefined) {
    newSeason = "Season 1"
  } else {
    const num = currentSeason.match(/\d*$/)
    newSeason = currentSeason.substr(0, num.index) + (++num[0])
  }
  

  // Players
  const players = await getPlayers(league)
  
  // Start Updates
  // Current Elo
  const ceRes = await newCurrentElo(league, newSeason, players)
  if (!ceRes) return {code: "error", message: "Could not create a new season in Current Elo"}

  // Elo Delta
  const eloDelta = await newEloDelta(league, newSeason, players)
  if (!eloDelta) return {code: "error", message: "Could not create a new season in Elo Deltas"}

  // Season, Last Update
  const season = await updateSeason(league, newSeason)
  if (!season) return {code: "error", message: "Could not create a new season"}

  // Big Success Vibes
  return {code: "success", message: newSeason + " started!"}
}

async function getCurrentSeason ( league ) {
  const info = await getLeagueSettings(league)
  if (info === "error") {
    return false
  }
  return info.currentSeason
}

async function getPlayers (league) {
  const leaguePlayers = await getLeagueMembers(league)
  let players = []

  for (let i = 0; i < leaguePlayers.length; i++) {
    let userPayload = {
      displayName: leaguePlayers[i].name,
      uid: leaguePlayers[i].id
    }

    const res = await getUserDataV2(userPayload)
    players.push(res.uDiscDisplayName)
  }

  return players
}

async function newCurrentElo (league, newSeason, players) {
  let eloObj = {}
  // eslint-disable-next-line array-callback-return
  players.map(player => {
    eloObj[player] = 1000
  })

  const res = await updateCurrentEloV2(league, newSeason, eloObj)
  if (res.code === "success") {
    return true
  } else {
    return false
  }
}

async function newEloDelta (league, newSeason, players) {
  let deltaObj = {}
  // eslint-disable-next-line array-callback-return
  players.map(player => {
    deltaObj[player] = 0
  })

  const res = await setDeltaV2(league, newSeason, deltaObj)
  if (res.code === "success") {
    return true
  } else {
    return false
  }
}

async function updateSeason (league, newSeason) {
  const update = {
    currentSeason: newSeason
  }
  const res = await updateLeagueSettings(league, update)
  if (res.code === "success") {
    return true
  } else {
    return false
  }
}