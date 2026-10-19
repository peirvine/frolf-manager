import { useEffect, useMemo, useRef, useState } from 'react'
import { useLive } from './liveStore'
import { useLeague, useLeagueData } from './leagueContext'
import { loadHandicaps } from '../services/handicapStore'
import { fromStored } from '../services/handicapService'
import { leagueHasHats } from '../services/statsUtils'

// Live league data for the pages. Each one is downloaded the first time a page asks for it and kept current after
// that (see liveStore), so switching pages doesn't read it again. All of them use the league chosen on the home page.

// Every season's scorecards: { season: { key: card } }, and the current season's on its own
export const useScorecards = () => {
  const { season } = useLeague()
  const { value, loaded } = useLeagueData('scorecards')
  return useMemo(() => ({ bySeason: value || {}, current: value?.[season] || {}, loaded }), [value, season, loaded])
}

export const useCurrentElo = () => useLeagueData('currentElo', { perSeason: true })
export const useEloDeltas = () => useLeagueData('eloDelta', { perSeason: true })
export const useEloGraph = () => useLeagueData('eloGraphData', { perSeason: true })
export const usePlayerEloHistory = () => useLeagueData('playerEloHistory', { perSeason: true })
export const useEloTracking = () => useLeagueData('eloTracking', { perSeason: true })

// { uDiscName: count }; only MAFTB keeps hats
export const useHatCounts = () => {
  const { leagueId } = useLeague()
  return useLive(leagueId && leagueHasHats(leagueId) ? `${leagueId}/hatCount` : null)
}

// The league's doink fund, or nothing for leagues that don't run one
export const useDoinkFund = () => {
  const { leagueId, settings } = useLeague()
  const base = leagueId && settings?.doinkFund ? `${leagueId}/doinkfund` : null
  const players = useLive(base && `${base}/players`)
  const expenses = useLive(base && `${base}/expenses`)
  const maxDoink = useLive(base && `${base}/maxDoink`)
  return useMemo(() => ({
    players: players.value || {},
    expenses: expenses.value || {},
    maxDoink: maxDoink.value ?? 50,
    loaded: players.loaded && expenses.loaded && maxDoink.loaded,
  }), [players, expenses, maxDoink])
}

// Handicaps for the league, or null while loading or if the league hasn't turned them on. They're saved in the
// database whenever a card changes; if none are saved yet (or they're from an older formula) they're worked out
// once here and saved for next time.
export const useHandicaps = () => {
  const { leagueId, settings } = useLeague()
  const enabled = Boolean(leagueId && settings?.handicaps)
  const stored = useLive(enabled ? `${leagueId}/handicaps` : null)
  const [rebuilt, setRebuilt] = useState({})
  const requested = useRef(new Set())

  const saved = stored.loaded ? fromStored(stored.value) : null
  const needsRebuild = enabled && stored.loaded && !saved
  useEffect(() => {
    if (!needsRebuild || requested.current.has(leagueId)) return
    requested.current.add(leagueId)
    loadHandicaps(leagueId).then(handicaps => setRebuilt(previous => ({ ...previous, [leagueId]: handicaps })))
  }, [needsRebuild, leagueId])

  if (!enabled) return null
  return saved || rebuilt[leagueId] || null
}
