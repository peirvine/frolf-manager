const { HttpsError } = require('firebase-functions/v2/https')
const { memberList, roleFor, withLeagueEntry } = require('./membership')

// The site's owner: always a site admin, and nobody (including themselves) can take it away
const PERMANENT_SITE_ADMIN_UID = "sVg8LJeG6SOuNHbIGdS5g2UVGI82"

// firebase-admin is slow to load, so it's loaded on first use: the emulator gives up if loading the functions takes
// too long (it does on slow disks)
let app
const db = () => {
  const admin = require('firebase-admin')
  // DATABASE_URL (in functions/.env) is only needed if the Realtime Database isn't the project's default one
  if (!app) app = admin.initializeApp(process.env.DATABASE_URL ? { databaseURL: process.env.DATABASE_URL } : undefined)
  return admin.database()
}

const read = async (path) => (await db().ref(path).get()).val()

const requireSignIn = (auth) => {
  if (!auth) throw new HttpsError('unauthenticated', 'Sign in first.')
  return auth.uid
}

const requireText = (value, name, max = 200) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new HttpsError('invalid-argument', `Missing or invalid ${name}.`)
  return value.trim()
}

// Users are saved under "<name> <uid>", so they're found by reading the list
const allUsers = async () => Object.entries((await read('users')) || {}).filter(([, user]) => user).map(([key, user]) => ({ key, ...user }))
const findUser = async (uid) => (await allUsers()).find(user => user.uid === uid) || null

const isSiteAdmin = async (uid) => uid === PERMANENT_SITE_ADMIN_UID || (await findUser(uid))?.siteAdmin === true

const requireSiteAdmin = async (auth) => {
  const uid = requireSignIn(auth)
  if (!(await isSiteAdmin(uid))) throw new HttpsError('permission-denied', 'Site admins only.')
  return uid
}

const requireLeague = async (league) => {
  requireText(league, 'league')
  if (!(await read(`leagueIndex/${league}`))) throw new HttpsError('not-found', 'No such league.')
  return league
}

// The caller's role in the league ("Admin", "Member" or null), from the league's players list
const roleIn = async (league, uid) => roleFor(memberList(await read(`${league}/players`)).find(member => member.id === uid)?.membershipStatus)

// League admins (and site admins) may run a league's admin actions
const requireLeagueAdmin = async (auth, league) => {
  const uid = requireSignIn(auth)
  await requireLeague(league)
  if ((await roleIn(league, uid)) === 'Admin' || (await isSiteAdmin(uid))) return uid
  throw new HttpsError('permission-denied', 'Only league admins can do that.')
}

// Replaces a league's players with what `change` makes of the current list of real members. Returning undefined from
// `change` leaves the list alone. Saved as a list, and the role map the database rules use is kept in step.
const changePlayers = async (league, change) => {
  const { rolesOf } = require('./membership')
  // The update can run more than once (first against a guess at the data, then the real thing), so `change` must set
  // anything it reports from scratch each time
  // A transaction first tries a guess of null before it has seen the real data. Giving up on the guess would stop it
  // there, so a "no change" answer to it returns null instead, which the database rejects and retries with the real list.
  const result = await db().ref(`${league}/players`).transaction((current) => {
    const next = change(memberList(current))
    return next === undefined && current === null ? null : next
  })
  if (result.committed) await db().ref(`${league}/memberRoles`).set(rolesOf(result.snapshot.val()))
  return { committed: result.committed, players: memberList(result.snapshot.val()) }
}

// Makes sure every active member has a rating (1000) and a rating change (0) for the league's current season. It only
// adds what's missing, so it's safe to call whenever members or their names change.
const seedLeagueElo = async (league) => {
  const { eloSeedWrites } = require('./seeding')
  const season = await read(`${league}/info/currentSeason`)
  if (season === null || season === undefined) return
  const [players, currentElo, eloDelta] = await Promise.all([
    read(`${league}/players`), read(`${league}/currentElo/${season}`), read(`${league}/eloDelta/${season}`),
  ])
  const writes = eloSeedWrites({ league, season, players, currentElo, eloDelta })
  if (Object.keys(writes).length) await db().ref().update(writes)
}

// Sets (or, with null, removes) this league on the player's own record
const setUserLeague = async (user, league, entry) => {
  if (!user) return
  await db().ref(`users/${user.key}/leagues`).transaction(current => withLeagueEntry(current, league, entry))
}

module.exports = {
  PERMANENT_SITE_ADMIN_UID, db, read, requireSignIn, requireText, allUsers, findUser, isSiteAdmin, requireSiteAdmin,
  requireLeague, roleIn, requireLeagueAdmin, changePlayers, setUserLeague, seedLeagueElo,
}
