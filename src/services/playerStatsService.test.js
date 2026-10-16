import { getPlayerStats } from './playerStatsService'
import * as db from './testUtils/fakeFirebase'
import { leagueData, storedCard } from './testUtils/fixtures'

jest.mock('../firebase', () => require('./testUtils/fakeFirebase'))

const SEASON = "Season 1"

beforeEach(() => {
  const data = leagueData("maftb", ["Alice", "Bob"])
  Object.assign(data.maftb, {
    scorecards: {
      [SEASON]: {
        a: storedCard({ course: "Bryant", scores: { Alice: 0, Bob: 0 } }),
        b: storedCard({ course: "(Off-Season) Bryant", scores: { Alice: 18 } }, { isOffSeason: true }),
        c: storedCard({ course: "Hyland", scores: { Bob: 0 } }),
        d: storedCard({ course: "Hyland", scores: { Bob: 0 } }),
      },
    },
    eloTracking: {
      [SEASON]: {
        a: { Course: "Bryant", strokesPerHole: 3, Players: { Alice: 1010, Bob: 990 } },
        c: { Course: "Hyland", strokesPerHole: 4.5, Players: { Bob: 1000 } },
      },
    },
  })
  db.reset(data)
})

test("sums up a player's season", async () => {
  expect(await getPlayerStats({ uDiscDisplayName: "Alice" }, "maftb")).toEqual({
    season: SEASON,
    numberOfRounds: 2,
    // The off-season round counts as the same course
    mostPlayedCourse: [{ course: "Bryant", count: 2 }],
    // Hyland was harder, but Alice didn't play it; her off-season Bryant round averaged 4 a hole
    hardestCourse: [{ course: "Bryant", highestStrokesPerHole: 4 }],
  })
})

test("keeps ties", async () => {
  const stats = await getPlayerStats({ uDiscDisplayName: "Bob" }, "maftb")
  expect(stats.numberOfRounds).toBe(3)
  expect(stats.mostPlayedCourse).toEqual([{ course: "Hyland", count: 2 }])
  expect(stats.hardestCourse).toEqual([{ course: "Hyland", highestStrokesPerHole: 4.5 }])
})

test("is empty for a player with no rounds", async () => {
  expect(await getPlayerStats({ uDiscDisplayName: "Nobody" }, "maftb")).toEqual({
    season: SEASON, numberOfRounds: 0, mostPlayedCourse: [], hardestCourse: [],
  })
})
