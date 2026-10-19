import { getLeagueMembers, getUserDataV2 } from '../firebase'

// UDisc doesn't always export the same name for a player: a league round or an event can show a different one than a
// casual round. Those are saved as uDiscAliases ({ league, event }), by the player on their user record or by a league
// admin on the player's entry in the league's player list. Rounds are saved under the main uDiscDisplayName from the
// user record, which is the name everything else (Elo, hats, handicaps, stats) is keyed by.
export const UDISC_ALIAS_TYPES = [
  { key: "league", label: "League round name" },
  { key: "event", label: "Event round name" },
]

// Case and stray spaces vary between exports too ("Lane " and "lane")
const normalize = (name) => String(name || "").trim().toLowerCase()

// { normalized name: main UDisc name } covering every name either the member or an admin saved for each league member.
// A name that would match two members is left out, so neither gets the other's round.
export const getUDiscNameLookup = async (league) => {
  const members = (await getLeagueMembers(league)) || []
  const users = await Promise.all(members.map(member => getUserDataV2({ displayName: member.name, uid: member.id })))
  const lookup = new Map()
  const shared = new Set()
  members.forEach((member, i) => {
    const user = users[i] || {}
    const main = user.uDiscDisplayName || member.uDiscDisplayName
    if (!main) return
    const saved = [main, member.uDiscDisplayName, ...Object.values(user.uDiscAliases || {}), ...Object.values(member.uDiscAliases || {})]
    const names = new Set(saved.map(normalize).filter(Boolean))
    for (const name of names) {
      if (lookup.has(name) && lookup.get(name) !== main) shared.add(name)
      lookup.set(name, main)
    }
  })
  shared.forEach(name => lookup.delete(name))
  return lookup
}

// The member's main name for a name on a card, or the name as written if it isn't a member's
export const toMainUDiscName = (lookup, name) => (name === "Par" ? name : lookup.get(normalize(name)) || name)
