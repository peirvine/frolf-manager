import { render, screen } from '@testing-library/react'
import { RoundDetails } from './roundList'
import { storedCard } from '../../services/testUtils/fixtures'

// Alice shoots 1 over par (55) with a -2 handicap, Bob 1 under (53) on his first league round
const round = (extra) => storedCard({ scores: { Alice: 1, Bob: -1 } }, extra)
const cardHandicaps = { Alice: { handicap: -2 } }
// The phone leaderboard's rows: rank, name, +/-, total, then handicap and adjusted total when shown
const leaderboard = () => screen.getAllByRole("button").map(row => row.textContent.replace("▼", ""))

describe("RoundDetails", () => {
  test("shows the handicapped standings below the scorecard for leagues that use handicaps", () => {
    render(<RoundDetails round={round()} cardHandicaps={cardHandicaps} />)
    expect(screen.getByText("Start")).toBeInTheDocument()
    expect(screen.queryByText("Adjusted Total")).not.toBeInTheDocument()
    expect(leaderboard()).toEqual(["1Bob-153", "2Alice+155"])
  })

  test("adds Handicap and Adjusted Total columns instead when the handicaps were applied in UDisc", () => {
    render(<RoundDetails round={round({ handicapsApplied: true })} cardHandicaps={cardHandicaps} />)
    expect(screen.queryByText("Start")).not.toBeInTheDocument()
    expect(screen.getByText("Handicap")).toBeInTheDocument()
    expect(screen.getByText("Adjusted Total")).toBeInTheDocument()
    expect(screen.getByText("Total")).toBeInTheDocument()
    // Ranked by adjusted total, so Alice's -2 ties her with Bob
    expect(leaderboard()).toEqual(["1Alice+155-253", "1Bob-153–53"])
  })

  test("shows neither for leagues that don't use handicaps", () => {
    render(<RoundDetails round={round({ handicapsApplied: true })} />)
    expect(screen.queryByText("Start")).not.toBeInTheDocument()
    expect(screen.queryByText("Adjusted Total")).not.toBeInTheDocument()
  })
})
