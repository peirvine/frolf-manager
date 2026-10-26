import { isOpen, isPastDeadline, roundCards } from './futureRoundService'

jest.mock('../firebase', () => ({ addCardToFutureRound: jest.fn(), updateFutureRound: jest.fn() }))
jest.mock('./scorecardService', () => ({ uDiscDump: jest.fn() }))

describe('futureRoundService', () => {
  it('is open until it is locked or its deadline passes', () => {
    expect(isOpen({ status: "open" }, 100)).toBe(true)
    expect(isOpen({ status: "open", deadline: 200 }, 100)).toBe(true)
    expect(isOpen({ status: "open", deadline: 100 }, 100)).toBe(false)
    expect(isOpen({ status: "locked" }, 100)).toBe(false)
    expect(isPastDeadline({ status: "open" }, 100)).toBe(false)
  })

  it('lists cards in the order they were added', () => {
    const cards = roundCards({ cards: { b: { submittedAt: 2 }, a: { submittedAt: 1 } } })
    expect(cards.map(c => c.key)).toEqual(["a", "b"])
  })
})
