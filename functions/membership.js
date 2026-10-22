// League membership rules, kept free of Firebase so they can be tested on their own. The strings match what the app
// has always saved (the "Memership" typo included), since the pages compare against them.

const STATUS = {
  MEMBER: "Member",
  ADMIN: "Admin",
  PENDING: "Pending",
  REMOVED: "Removed, you may reapply",
  DENIED: "Memership Denied",
  BANNED: "Banned from the League",
}

// What each admin action does to a member's entry
const ACTIONS = {
  approve: { membershipStatus: STATUS.MEMBER, isAdmin: false },
  promote: { membershipStatus: STATUS.ADMIN, isAdmin: true },
  demote: { membershipStatus: STATUS.MEMBER, isAdmin: false },
  readd: { membershipStatus: STATUS.MEMBER, isAdmin: false },
  deny: { membershipStatus: STATUS.DENIED },
  kick: { membershipStatus: STATUS.REMOVED },
  ban: { membershipStatus: STATUS.BANNED },
  unban: { membershipStatus: STATUS.PENDING },
}

// The role the database rules know a person by: only active members have one
const roleFor = (membershipStatus) => (
  membershipStatus === STATUS.ADMIN ? "Admin" : membershipStatus === STATUS.MEMBER ? "Member" : null
)

// A league's players saved as a list or as an object keyed by slot, as just the real members
const memberList = (players) => Object.values(players || {}).filter(member => member && member.id)

// `member` after an admin action; null if it isn't one we know
const applyAction = (member, action) => (ACTIONS[action] ? { ...member, ...ACTIONS[action] } : null)

// A new entry for someone asking to join (or an admin adding them straight in)
const newMember = (user, { admin = false, active = false } = {}) => ({
  id: user.uid,
  name: user.name,
  isAdmin: admin,
  membershipStatus: admin ? STATUS.ADMIN : active ? STATUS.MEMBER : STATUS.PENDING,
  uDiscDisplayName: user.uDiscDisplayName || "",
  ...(user.uDiscAliases ? { uDiscAliases: user.uDiscAliases } : {}),
})

// The player's own league list (kept on their user record) with this league's entry set, or removed when `entry` is null
const withLeagueEntry = (leagues, league, entry) => {
  const others = Object.values(leagues || {}).filter(item => item && item.id && item.id !== league)
  return entry ? [...others, { id: league, ...entry }] : others
}

// { uid: role } for every active member, the map the database rules check
const rolesOf = (players) => Object.fromEntries(
  memberList(players).map(member => [member.id, roleFor(member.membershipStatus)]).filter(([, role]) => role)
)

// A league id from its name: the first letters of each word plus a number, as the app has always made them
const leagueIdFor = (name, random = Math.random) => {
  const initials = (String(name).match(/\b(\w)/g) || ["l"]).join("")
  return initials.concat(Math.floor(random() * 99)).toLowerCase()
}

module.exports = { STATUS, ACTIONS, roleFor, memberList, applyAction, newMember, withLeagueEntry, rolesOf, leagueIdFor }
