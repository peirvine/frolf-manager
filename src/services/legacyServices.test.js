// Services kept from before the Firebase move. Their bodies are stubbed out or hard-coded, so these only pin down
// what callers get back today.
import { getCourses, createCourse, createCourseInAmazon, updateCourse, deleteCourse } from './courseService'
import { getRankings } from './rankingsService'
import { mockCard } from './mockData'

test("course functions are no-ops until a course store is wired back up", async () => {
  expect(await getCourses()).toBeUndefined()
  expect(createCourse({ name: "Bryant" })).toBeUndefined()
  expect(await createCourseInAmazon({ name: "Bryant" })).toBeUndefined()
  expect(await updateCourse({ id: 1 })).toBeUndefined()
  expect(await deleteCourse({ id: 1 })).toBeUndefined()
})

test("getRankings lists the original players, highest rated first", () => {
  const rankings = getRankings()
  expect(rankings[0]).toEqual({ name: "Benton", rating: 1093 })
  rankings.slice(1).forEach((player, i) => expect(player.rating).toBeLessThanOrEqual(rankings[i].rating))
})

test("the sample card is shaped like a parsed UDisc card", () => {
  expect(mockCard).toMatchObject({ course: expect.any(String), layout: expect.any(String), par: "63" })
  const par = mockCard.playerArray.find(player => player.player === "Par")
  mockCard.playerArray.forEach(player => expect(player.holes).toHaveLength(par.holes.length))
})
