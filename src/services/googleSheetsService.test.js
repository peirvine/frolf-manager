// The original MAFTB rankings lived in a Google Sheet; these cover the old sheet integration.
// Google's APIs are never called: axios and the JWT signing are mocked.
import axios from 'axios'

jest.mock('axios', () => ({ post: jest.fn(), request: jest.fn() }))
jest.mock('jose', () => ({
  importPKCS8: jest.fn(async () => 'private key'),
  SignJWT: class {
    setProtectedHeader () { return this }
    async sign () { return 'signed.jwt' }
  },
}))

let sheets

// The service reads its settings from the environment when it loads
beforeAll(() => {
  Object.assign(process.env, {
    REACT_APP_SHEET_ID: 'sheet',
    REACT_APP_SHEET_RANKINGS_RANGE: 'Rankings!A1:B9',
    REACT_APP_SHEET_HISTORICAL_RANGE: 'History!A1:I9',
    REACT_APP_SHEET_SCORECARD_RANGE: 'Cards!A1',
    REACT_APP_GOOGLE_PRIVATE_KEY: 'line one\\nline two',
  })
  sheets = require('./googleSheetsService')
})

beforeEach(() => {
  jest.clearAllMocks()
  axios.post.mockResolvedValue({ data: { access_token: 'token' } })
})

test("getRankingsFromGoogle reads the rankings range with a service account token", async () => {
  axios.request.mockResolvedValue({ data: { values: [["Alice", "1010"]] } })
  expect(await sheets.getRankingsFromGoogle()).toEqual({ values: [["Alice", "1010"]] })
  expect(axios.post.mock.calls[0][0]).toContain('assertion=signed.jwt')
  expect(axios.request).toHaveBeenCalledWith(expect.objectContaining({
    method: 'GET',
    url: 'https://sheets.googleapis.com/v4/spreadsheets/sheet/values/Rankings!A1:B9',
    headers: expect.objectContaining({ Authorization: 'Bearer token' }),
  }))
})

test("addScorecardToGoogle appends one row with each regular's score", async () => {
  axios.request.mockResolvedValue({})
  const card = {
    course: "Bryant", layout: "Long", par: "54",
    playerArray: [
      { player: "Par", total: "54", holes: Array(18).fill("3") },
      { player: "Peter", total: "60" },
      { player: "Rob Renkor", total: "58" },
      { player: "Visitor", total: "50" },
    ],
  }
  expect(await sheets.addScorecardToGoogle(card)).toBe(true)
  const { method, url, data } = axios.request.mock.calls[0][0]
  expect(method).toBe('POST')
  expect(url).toContain('/values/Cards!A1:append')
  // Course, layout, par, holes, then alex, benton, greg, jimmy, lane, peter, rob, samir
  expect(data.values).toEqual([["Bryant", "Long", 54, 18, "", "", "", "", "", 60, 58, ""]])
})

test("addScorecardToGoogle reports a failed save", async () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
  axios.request.mockRejectedValue(new Error('offline'))
  expect(await sheets.addScorecardToGoogle({ course: "Bryant", layout: "Long", par: "54", playerArray: [{ player: "Par", holes: [] }] })).toBe(false)
  spy.mockRestore()
})

test("getHistoricalRankingsFromGoogle turns each row into a graph point", async () => {
  axios.request.mockResolvedValue({ data: { values: [["Bryant", 1, 2, 3, 4, 5, 6, 7, 8]] } })
  expect(await sheets.getHistoricalRankingsFromGoogle()).toEqual([
    { name: "Bryant", alex: 1, benton: 2, greg: 3, jimmy: 4, lane: 5, peter: 6, rob: 7, samir: 8 },
  ])
})
