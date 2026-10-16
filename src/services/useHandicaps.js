import { useEffect, useState } from "react";
import { getLeagueSettings } from "../firebase";
import { loadHandicaps } from "./handicapStore";

// Handicaps for a league, or null while loading or if the league hasn't turned them on.
// Reads the handicaps saved in the database (see handicapStore).
export default function useHandicaps(league) {
  const [handicaps, setHandicaps] = useState(null)

  useEffect(() => {
    setHandicaps(null)
    if (!league) return
    let cancelled = false
    getLeagueSettings(league).then(async settings => {
      if (!settings || settings === "error" || !settings.handicaps) return
      const handicaps = await loadHandicaps(league)
      if (!cancelled) setHandicaps(handicaps)
    })
    return () => { cancelled = true }
  }, [league])

  return handicaps
}
