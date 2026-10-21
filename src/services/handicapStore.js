import { getAllScorecards, getLeagueSettings, getStoredHandicaps, setStoredHandicaps } from "../firebase";
import { buildHandicaps, toStored, fromStored, handicapsGoingInto, toCardHandicaps } from "./handicapService";

// Rebuilds a league's saved handicaps from every season's scorecards. Run after a scorecard is added, edited or
// deleted. Leagues without handicaps are skipped; theirs are rebuilt when the setting is turned on.
// Pass `settings` if they've already been read.
export const refreshHandicaps = async (league, settings) => {
  const leagueSettings = settings || await getLeagueSettings(league)
  if (!leagueSettings || leagueSettings === "error") return { code: "error", message: "Could not read league settings" }
  if (!leagueSettings.handicaps) return { code: "success", message: "" }

  const cards = await getAllScorecards(league)
  // Never overwrite good handicaps after a failed read
  if (cards === undefined) return { code: "error", message: "Could not read scorecards" }
  return setStoredHandicaps(league, toStored(buildHandicaps(cards)))
}

// The saved handicaps in buildHandicaps' shape. If none are saved yet (or they're from an older formula), they're
// worked out here and saved for next time.
export const loadHandicaps = async (league) => {
  const stored = fromStored(await getStoredHandicaps(league))
  if (stored) return stored

  const cards = await getAllScorecards(league)
  if (cards === undefined) return null
  const handicaps = buildHandicaps(cards)
  // Best effort: if this viewer can't write, the next scorecard change saves them instead
  setStoredHandicaps(league, toStored(handicaps))
  return handicaps
}

// The handicaps each player has going into a card that's about to be saved, as a list to store on the card. Take
// this before the card is written so the rebuild that follows can't change them. null if they couldn't be worked out.
export const snapshotHandicaps = async (league, card) => {
  const cards = await getAllScorecards(league)
  if (cards === undefined) return null
  return toCardHandicaps(handicapsGoingInto(cards, card))
}
