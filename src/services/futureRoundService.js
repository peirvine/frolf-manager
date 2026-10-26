import { addCardToFutureRound, updateFutureRound } from '../firebase'
import { parseUDiscCsv } from './uDiscCsv'
import { uDiscDump } from './scorecardService'

export const isPastDeadline = (round, now = Date.now()) => Boolean(round.deadline) && now >= round.deadline

// A round takes cards until it is locked or its deadline passes
export const isOpen = (round, now = Date.now()) => round.status === "open" && !isPastDeadline(round, now)

// Cards in the order they were added, each with its key
export const roundCards = (round) => (
  Object.entries(round.cards || {})
    .map(([key, card]) => ({ key, ...card }))
    .sort((a, b) => a.submittedAt - b.submittedAt)
)

// Saves the pasted export on the round without scoring it; scoring happens when the round is locked
export async function submitRoundCard (league, roundId, round, user, text, handicapsApplied = false) {
  if (!isOpen(round)) return {code: "error", message: "This round is no longer taking cards."}
  const rows = parseUDiscCsv(text)
  if (!rows) return {code: "error", message: "Error, card input not valid. Paste the full UDisc CSV export, starting with PlayerName."}
  return addCardToFutureRound(league, roundId, {
    raw: text,
    handicapsApplied: Boolean(handicapsApplied),
    submittedBy: user.uid,
    submittedByName: user.displayName || "",
    course: rows[0].course || "",
    players: rows.filter(({ player }) => player !== "Par").length,
  })
}

// Locks the round and scores its cards together as one round, the way a single export is scored. If that fails the
// round stays locked with the reason shown, and locking again tries once the problem card has been removed.
export async function lockRound (league, roundId, round) {
  const cards = roundCards(round)
  if (cards.length === 0) return {code: "error", message: "Add at least one card before locking the round."}
  const locked = await updateFutureRound(league, roundId, { status: "locked", lockedAt: Date.now() })
  if (locked.code === "error") return locked
  const res = await uDiscDump(cards.map(card => card.raw), league, false, { handicapsApplied: cards.every(card => card.handicapsApplied) })
  if (res.code === "error") {
    await updateFutureRound(league, roundId, { error: res.message })
    return {code: "error", message: `Round locked, but it could not be scored: ${res.message} Remove the problem card if there is one and lock again.`}
  }
  await updateFutureRound(league, roundId, { status: "scored", scoredAt: Date.now(), error: null })
  return {code: "success", message: `Round locked and ${cards.length} card${cards.length === 1 ? "" : "s"} scored as one round.`}
}
