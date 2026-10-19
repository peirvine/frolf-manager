import { getLeagueMembers, getLeagueSettings, getUserDataV2, setDeltaV2, updateCurrentEloV2, updateLeagueMembers, updateLeagueSettings, resetEloData, resetHatCounts, renameSeasonData } from "../firebase";

// Pages read each member's UDisc name from the league's players list, which is kept in step as players save their name.
// This copies every member's current name over from their account, for names changed before that happened.
export async function syncMemberUDiscNames ( league ) {
  const members = await getLeagueMembers(league)
  if (!Array.isArray(members)) return {code: "error", message: "Could not get the league members"}

  const users = await Promise.all(members.map(member => getUserDataV2({ displayName: member.name, uid: member.id })))
  let changed = 0
  const updated = members.map((member, i) => {
    const name = users[i]?.uDiscDisplayName
    if (!name || name === member.uDiscDisplayName) return member
    changed++
    return { ...member, uDiscDisplayName: name }
  })
  if (changed === 0) return {code: "success", message: "UDisc names are already up to date"}

  const res = await updateLeagueMembers(league, updated)
  if (res.code === "error") return res
  return {code: "success", message: `Updated ${changed} UDisc ${changed === 1 ? "name" : "names"}`}
}

// Leagues made from the dashboard used to start on the bare number 1 instead of "Season 1"
export const isNumberedSeason = (season) => /^\d+$/.test(String(season ?? ""))

// Gives a season that's just a number the usual "Season N" name, moving its data. Returns the (new) season name.
export async function nameNumberedSeason ( league ) {
  const currentSeason = await getCurrentSeason(league)
  if (currentSeason === false) return {code: "error", message: "Could not get current season"}
  if (!isNumberedSeason(currentSeason)) return {code: "success", message: "The season already has a name", season: currentSeason}
  const season = "Season " + currentSeason
  const res = await renameSeasonData(league, String(currentSeason), season)
  return { ...res, season }
}

// Pattern: Update the database, check for error, then move on. This way if you click the button again it'll just overwrite the failed update. Updating the season is last.
export async function startNewSeason ( league ) {
  // Season
  const named = await nameNumberedSeason(league)
  if (named.code === "error") return named
  const currentSeason = named.season
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

  // Hat counts start over each season
  const hats = await resetHatCounts(league)
  if (hats.code === "error") return {code: "error", message: "Could not reset hat counts"}

  // Season, Last Update
  const season = await updateSeason(league, newSeason)
  if (!season) return {code: "error", message: "Could not create a new season"}

  // Big Success Vibes
  return {code: "success", message: newSeason + " started!"}
}

export async function resetCurrentSeason (league, season) {
  // Players
  const players = await getPlayers(league)
  
  // Start Updates
  // Current Elo
  const ceRes = await newCurrentElo(league, season, players)
  if (!ceRes) return {code: "error", message: "Could not reset Current Elo"}

  // Elo Delta
  const eloDelta = await newEloDelta(league, season, players)
  if (!eloDelta) return {code: "error", message: "Could not reset Elo Deltas"}

  // eloGraphData
  const eloGraphData = await resetEloGraphData(league, season)
  if (eloGraphData.code === "error") return {code: "error", message: "Could not reset Elo Graph Data"}

  // eloTracking
  const eloTracking = await reseteloTracking(league, season)
  if (eloTracking.code === "error") return {code: "error", message: "Could not reset Elo Tracking"}

  // playerEloHistory
  const playerEloHistory = await resetPlayerEloHistory(league, season)
  if (playerEloHistory.code === "error") return {code: "error", message: "Could not reset Player Elo History"}

  // Season stats are recalculated as each card is replayed
  const seasonStats = await resetEloData(league, season, "stats")
  if (seasonStats.code === "error") return {code: "error", message: "Could not reset Season Stats"}

  // Big Success Vibes
  return {code: "success", message: "elo reset!"}

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


// just delete the current season object
async function resetEloGraphData (league, season) {
  return await resetEloData(league, season, "eloGraphData")
}

async function reseteloTracking (league, season) {
  return await resetEloData(league, season, "eloTracking")
}

async function resetPlayerEloHistory (league, season) {
  return await resetEloData(league, season, "playerEloHistory")
}