import { act, renderHook, waitFor } from '@testing-library/react'
import { LeagueProvider } from './leagueContext'
import { useScorecards, useHandicaps, useDoinkFund, useHatCounts, useCurrentElo } from './leagueData'
import { closeAllLive } from './liveStore'
import { toStored, buildHandicaps } from '../services/handicapService'
import * as db from '../services/testUtils/fakeFirebase'
import { leagueData, storedCard } from '../services/testUtils/fixtures'

jest.mock('../firebase', () => require('../services/testUtils/fakeFirebase'))

const alice = { uid: "uid0", displayName: "Alice Google" }

// Alice is a member of the league, which has a round in each of two seasons
const seed = (league = "maftb", info = {}) => {
  const data = leagueData(league, ["Alice"], { currentSeason: "Season 2", ...info })
  data.users["Alice Google uid0"].leagues = [{ id: league, isAdmin: false, membershipStatus: "Member" }]
  data.leagueIndex = { [league]: league }
  data[league].scorecards = {
    "Season 1": { a: storedCard({ scores: { Alice: 3 } }) },
    "Season 2": { b: storedCard({ scores: { Alice: 5 } }) },
  }
  db.reset(data)
}

const renderData = (hook) => renderHook(hook, {
  wrapper: ({ children }) => <LeagueProvider user={alice}>{children}</LeagueProvider>,
})

beforeEach(() => {
  closeAllLive()
  window.localStorage.clear()
})

describe("useScorecards", () => {
  test("splits out the current season", async () => {
    seed()
    const { result } = renderData(() => useScorecards())
    await waitFor(() => expect(Object.keys(result.current.current)).toEqual(["b"]))
    expect(Object.keys(result.current.bySeason)).toEqual(["Season 1", "Season 2"])
  })

  test("follows a round being added", async () => {
    seed()
    const { result } = renderData(() => useScorecards())
    await waitFor(() => expect(result.current.loaded).toBe(true))
    act(() => db.write("maftb/scorecards/Season 2/c", storedCard({ scores: { Alice: 1 } })))
    await waitFor(() => expect(Object.keys(result.current.current).sort()).toEqual(["b", "c"]))
  })
})

describe("useHandicaps", () => {
  test("works them out and saves them when the league has none yet", async () => {
    seed("maftb", { handicaps: true })
    const { result } = renderData(() => useHandicaps())
    expect(result.current).toBeNull()
    await waitFor(() => expect(result.current?.current.Alice.handicap).toBe(-3))
    // Saved for next time
    expect(db.read("maftb/handicaps").version).toBeDefined()
  })

  test("uses the saved handicaps, following changes to them", async () => {
    seed("maftb", { handicaps: true })
    const cards = db.read("maftb/scorecards")
    db.write("maftb/handicaps", toStored(buildHandicaps(cards)))
    const { result } = renderData(() => useHandicaps())
    await waitFor(() => expect(result.current?.current.Alice.handicap).toBe(-3))

    act(() => {
      db.write("maftb/scorecards/Season 1/a", storedCard({ scores: { Alice: 8 } }))
      db.write("maftb/handicaps", toStored(buildHandicaps(db.read("maftb/scorecards"))))
    })
    await waitFor(() => expect(result.current?.current.Alice.handicap).toBe(-5))
  })

  test("stays null for a league without handicaps", async () => {
    seed("maftb", { handicaps: false })
    const { result } = renderData(() => useHandicaps())
    await waitFor(() => expect(db.read("maftb/info")).toBeDefined())
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(result.current).toBeNull()
    expect(db.read("maftb/handicaps")).toBeUndefined()
  })
})

describe("useDoinkFund", () => {
  test("holds the fund's players, expenses and limit", async () => {
    seed("maftb", { doinkFund: true })
    db.write("maftb/doinkfund", { players: { p0: { uid: "uid0", doinks: 2 } }, expenses: { e0: { expense: "Beer", amount: "10" } }, maxDoink: 30 })
    const { result } = renderData(() => useDoinkFund())
    await waitFor(() => expect(result.current.loaded).toBe(true))
    expect(result.current).toMatchObject({ players: { p0: { doinks: 2 } }, expenses: { e0: { amount: "10" } }, maxDoink: 30 })
  })

  test("follows a doink being added", async () => {
    seed("maftb", { doinkFund: true })
    db.write("maftb/doinkfund", { players: { p0: { uid: "uid0", doinks: 2 } } })
    const { result } = renderData(() => useDoinkFund())
    await waitFor(() => expect(result.current.players.p0?.doinks).toBe(2))
    act(() => db.write("maftb/doinkfund/players/p0/doinks", 3))
    await waitFor(() => expect(result.current.players.p0.doinks).toBe(3))
  })

  test("is empty, with the default limit, for a league without a fund", async () => {
    seed("maftb", { doinkFund: false })
    db.write("maftb/doinkfund/players", { p0: { uid: "uid0", doinks: 2 } })
    const { result } = renderData(() => useDoinkFund())
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(result.current).toMatchObject({ players: {}, expenses: {}, maxDoink: 50 })
  })
})

describe("per season data", () => {
  test("reads the current season's elo", async () => {
    seed()
    db.write("maftb/currentElo", { "Season 1": { Alice: 900 }, "Season 2": { Alice: 1010 } })
    const { result } = renderData(() => useCurrentElo())
    await waitFor(() => expect(result.current.value).toEqual({ Alice: 1010 }))
  })

  test("only the MAFTB league has hat counts", async () => {
    seed("maftb")
    db.write("maftb/hatCount", { Alice: 3 })
    const { result, unmount } = renderData(() => useHatCounts())
    await waitFor(() => expect(result.current.value).toEqual({ Alice: 3 }))
    unmount()

    closeAllLive()
    seed("other")
    db.write("other/hatCount", { Alice: 3 })
    const { result: otherLeague } = renderData(() => useHatCounts())
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(otherLeague.current.value).toBeNull()
  })
})
