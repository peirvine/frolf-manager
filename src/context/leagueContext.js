import { createContext, useContext, useMemo, useState } from 'react'
import { useLive } from './liveStore'

// Everything the pages need to know about who is signed in and which league they're looking at, kept up to date
// from the database. Pages read it from here instead of each asking the database (and each showing their own
// league picker). The league is chosen on the home page and remembered between visits.
const ACTIVE_STATUSES = ["Member", "Admin"]

const LeagueContext = createContext(null)

const storageKey = (user) => `dgm.league.${user.uid}`
const readSaved = (user) => {
  try { return user ? window.localStorage.getItem(storageKey(user)) : null } catch { return null }
}
const writeSaved = (user, league) => {
  try { window.localStorage.setItem(storageKey(user), league) } catch { /* the choice just isn't remembered */ }
}

export const userPath = (user) => `users/${user.displayName} ${user.uid}`

export function LeagueProvider ({ user, children }) {
  const userSnap = useLive(user ? userPath(user) : null)
  const namesSnap = useLive(user ? 'leagueIndex' : null)
  // Set when they pick a league this visit; until then the one saved from last time is used
  const [picked, setPicked] = useState(null)
  const chosen = picked || readSaved(user)

  const userData = userSnap.value
  const memberships = useMemo(
    () => (Array.isArray(userData?.leagues) ? userData.leagues.filter(x => x?.id) : []),
    [userData]
  )
  const activeLeagues = useMemo(() => memberships.filter(x => ACTIVE_STATUSES.includes(x.membershipStatus)), [memberships])

  // The saved choice only counts while it's still a league the person can use
  const leagueId = activeLeagues.find(x => x.id === chosen)?.id || activeLeagues[0]?.id || null

  const settingsSnap = useLive(leagueId ? `${leagueId}/info` : null)
  const membersSnap = useLive(leagueId ? `${leagueId}/players` : null)

  const selectLeague = (id) => {
    if (!activeLeagues.some(x => x.id === id)) return
    setPicked(id)
    writeSaved(user, id)
  }

  const members = useMemo(() => Object.values(membersSnap.value || {}).filter(member => member && member.id), [membersSnap.value])
  const settings = settingsSnap.value
  const leagueNames = namesSnap.value || {}

  // 'signedOut' | 'loading' | 'noLeague' | 'pending' | 'ready'
  let status = 'ready'
  if (!user) status = 'signedOut'
  else if (!userSnap.loaded || !namesSnap.loaded) status = 'loading'
  else if (!leagueId) status = memberships.some(x => x.membershipStatus === "Pending") ? 'pending' : 'noLeague'
  else if (!settingsSnap.loaded || !membersSnap.loaded) status = 'loading'

  const value = useMemo(() => ({
    user,
    userData,
    leagueNames,
    activeLeagues,
    leagueId,
    leagueName: leagueId ? leagueNames[leagueId] || leagueId : "",
    selectLeague,
    isLeagueAdmin: activeLeagues.find(x => x.id === leagueId)?.membershipStatus === "Admin",
    settings,
    season: settings?.currentSeason,
    members,
    status,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, userData, namesSnap.value, activeLeagues, leagueId, settings, members, status])

  return <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>
}

export const useLeague = () => {
  const value = useContext(LeagueContext)
  if (!value) throw new Error("useLeague must be used inside a LeagueProvider")
  return value
}

// Live data for the signed-in person's current league: `${league}/${subPath}`, or `${league}/${subPath}/${season}`
// for data kept per season. Nothing is read until a league (and season) is known.
export const useLeagueData = (subPath, { perSeason = false } = {}) => {
  const { leagueId, season } = useLeague()
  const path = leagueId && (!perSeason || season) ? `${leagueId}/${subPath}${perSeason ? `/${season}` : ""}` : null
  return useLive(path)
}
