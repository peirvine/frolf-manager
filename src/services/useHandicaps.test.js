import { renderHook, waitFor } from '@testing-library/react'
import useHandicaps from './useHandicaps'
import * as db from './testUtils/fakeFirebase'
import { leagueData, storedCard } from './testUtils/fixtures'

jest.mock('../firebase', () => require('./testUtils/fakeFirebase'))

const seed = (league, info) => {
  const data = leagueData(league, ["Alice"], info)
  data[league].scorecards = { "Season 1": { a: storedCard({ scores: { Alice: 3 } }) } }
  return data
}

test("loads a league's handicaps", async () => {
  db.reset(seed("maftb", { handicaps: true }))
  const { result } = renderHook(() => useHandicaps("maftb"))
  expect(result.current).toBeNull()
  await waitFor(() => expect(result.current?.current.Alice.handicap).toBe(-3))
})

test("stays null for a league without handicaps", async () => {
  db.reset(seed("maftb", { handicaps: false }))
  const { result } = renderHook(() => useHandicaps("maftb"))
  // Give the settings read time to finish
  await new Promise(resolve => setTimeout(resolve, 10))
  expect(result.current).toBeNull()
})

test("stays null without a league", () => {
  db.reset({})
  const { result } = renderHook(() => useHandicaps(undefined))
  expect(result.current).toBeNull()
})

test("switches to the new league's handicaps", async () => {
  db.reset({ ...seed("maftb", { handicaps: true }), other: seed("other", { handicaps: true }).other })
  db.write("other/scorecards/Season 1/a", storedCard({ scores: { Alice: 8 } }))
  const { result, rerender } = renderHook(({ league }) => useHandicaps(league), { initialProps: { league: "maftb" } })
  await waitFor(() => expect(result.current?.current.Alice.handicap).toBe(-3))
  rerender({ league: "other" })
  await waitFor(() => expect(result.current?.current.Alice.handicap).toBe(-8))
})
