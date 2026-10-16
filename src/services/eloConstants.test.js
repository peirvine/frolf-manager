import { weighting, pointPerThrowRef } from './eloConstants'

test("round weights start at 1 and never increase", () => {
  expect(weighting[0]).toBe(1)
  weighting.slice(1).forEach((weight, i) => expect(weight).toBeLessThanOrEqual(weighting[i]))
})

test("points per throw cover every strokes-per-hole step from 2.6 to 5.5", () => {
  // calculateElo looks these up after rounding to one decimal, so a gap here gives a NaN rating
  for (let tenths = 26; tenths <= 55; tenths++) {
    expect(Number.isFinite(pointPerThrowRef[tenths / 10])).toBe(true)
  }
})

test("harder courses are worth fewer points per throw", () => {
  const values = Object.keys(pointPerThrowRef).map(Number).sort((a, b) => a - b).map(key => pointPerThrowRef[key])
  values.slice(1).forEach((value, i) => expect(value).toBeLessThan(values[i]))
})
