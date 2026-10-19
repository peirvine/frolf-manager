import { act, renderHook, waitFor } from '@testing-library/react'
import { LeagueProvider, useLeague } from './leagueContext'
import { closeAllLive } from './liveStore'
import * as db from '../services/testUtils/fakeFirebase'
import { leagueData } from '../services/testUtils/fixtures'

jest.mock('../firebase', () => require('../services/testUtils/fakeFirebase'))

const alice = { uid: "uid0", displayName: "Alice Google" }

const membership = (id, membershipStatus) => ({ id, isAdmin: membershipStatus === "Admin", membershipStatus })

// Alice's account, in the given leagues, and each league with her in it
const seed = (leagues) => {
  const data = { leagueIndex: {}, users: { "Alice Google uid0": { uid: "uid0", uDiscDisplayName: "Alice", leagues: leagues.map(([id, status]) => membership(id, status)) } } }
  leagues.forEach(([id]) => {
    Object.assign(data, leagueData(id, ["Alice"], { currentSeason: "Season 2" }), { users: data.users })
    data.leagueIndex[id] = id.toUpperCase()
  })
  db.reset(data)
}

const renderLeague = (user = alice) => renderHook(() => useLeague(), {
  wrapper: ({ children }) => <LeagueProvider user={user}>{children}</LeagueProvider>,
})

beforeEach(() => {
  closeAllLive()
  window.localStorage.clear()
})

test("is signed out without a user", () => {
  db.reset({})
  const { result } = renderLeague(null)
  expect(result.current.status).toBe("signedOut")
  expect(result.current.leagueId).toBeNull()
})

test("loads the person's league, its settings and its members", async () => {
  seed([["maftb", "Admin"]])
  const { result } = renderLeague()
  expect(result.current.status).toBe("loading")
  await waitFor(() => expect(result.current.status).toBe("ready"))
  expect(result.current).toMatchObject({ leagueId: "maftb", leagueName: "MAFTB", season: "Season 2", isLeagueAdmin: true })
  expect(result.current.members.map(member => member.uDiscDisplayName)).toEqual(["Alice"])
  expect(result.current.userData.uDiscDisplayName).toBe("Alice")
})

test("uses the first league they're active in", async () => {
  seed([["pending", "Pending"], ["maftb", "Member"], ["other", "Admin"]])
  const { result } = renderLeague()
  await waitFor(() => expect(result.current.status).toBe("ready"))
  expect(result.current.leagueId).toBe("maftb")
  expect(result.current.activeLeagues.map(x => x.id)).toEqual(["maftb", "other"])
  expect(result.current.isLeagueAdmin).toBe(false)
})

test("switches league and remembers the choice", async () => {
  seed([["maftb", "Member"], ["other", "Member"]])
  const { result, unmount } = renderLeague()
  await waitFor(() => expect(result.current.status).toBe("ready"))
  act(() => result.current.selectLeague("other"))
  await waitFor(() => expect(result.current.leagueId).toBe("other"))
  await waitFor(() => expect(result.current.status).toBe("ready"))
  unmount()

  // A later visit starts on the league they chose
  const { result: later } = renderLeague()
  await waitFor(() => expect(later.current.status).toBe("ready"))
  expect(later.current.leagueId).toBe("other")
})

test("ignores a saved league they're no longer in, and one they only asked to join", async () => {
  seed([["maftb", "Member"], ["pending", "Pending"]])
  window.localStorage.setItem("dgm.league.uid0", "gone")
  const { result } = renderLeague()
  await waitFor(() => expect(result.current.status).toBe("ready"))
  expect(result.current.leagueId).toBe("maftb")
  act(() => result.current.selectLeague("pending"))
  expect(result.current.leagueId).toBe("maftb")
})

test("says when they only have a pending request, or no league at all", async () => {
  seed([["maftb", "Pending"]])
  const { result, unmount } = renderLeague()
  await waitFor(() => expect(result.current.status).toBe("pending"))
  expect(result.current.leagueId).toBeNull()
  unmount()

  closeAllLive()
  db.reset({ leagueIndex: {}, users: { "Alice Google uid0": { uid: "uid0" } } })
  const { result: noLeague } = renderLeague()
  await waitFor(() => expect(noLeague.current.status).toBe("noLeague"))
})

test("follows changes to their league memberships", async () => {
  seed([["maftb", "Pending"]])
  const { result } = renderLeague()
  await waitFor(() => expect(result.current.status).toBe("pending"))
  act(() => db.write("users/Alice Google uid0/leagues", [membership("maftb", "Member")]))
  await waitFor(() => expect(result.current.status).toBe("ready"))
  expect(result.current.leagueId).toBe("maftb")
})

test("follows changes to the league's settings and members", async () => {
  seed([["maftb", "Member"]])
  const { result } = renderLeague()
  await waitFor(() => expect(result.current.status).toBe("ready"))
  act(() => db.write("maftb/info/currentSeason", "Season 3"))
  await waitFor(() => expect(result.current.season).toBe("Season 3"))
  act(() => db.write("maftb/players/1", { id: "uid9", name: "Bob Google", uDiscDisplayName: "Bob" }))
  await waitFor(() => expect(result.current.members).toHaveLength(2))
})
