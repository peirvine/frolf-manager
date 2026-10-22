const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { STATUS, applyAction, newMember, leagueIdFor } = require('./membership')
const access = require('./access')
const { db, read, requireSignIn, requireText, allUsers, findUser, requireLeague, requireLeagueAdmin, changePlayers, setUserLeague, isSiteAdmin } = access

// League and membership changes. The browser can't change who is in a league or what they may do, so every one of
// these goes through here and checks who is asking.

const entryFor = (member) => ({ isAdmin: Boolean(member.isAdmin), membershipStatus: member.membershipStatus })

// Someone asking to join a league that takes new players (or reapplying after being removed)
exports.joinLeague = onCall(async ({ auth, data }) => {
  const uid = requireSignIn(auth)
  const league = await requireLeague(data?.league)
  const info = (await read(`${league}/info`)) || {}
  if (info.suspended) throw new HttpsError('failed-precondition', 'This league is closed.')
  const user = await findUser(uid)
  if (!user) throw new HttpsError('failed-precondition', 'Your account is not set up yet.')

  let problem = null
  let joined = null
  await changePlayers(league, (members) => {
    problem = null
    joined = null
    const existing = members.find(member => member.id === uid)
    if (existing && existing.membershipStatus !== STATUS.REMOVED) { problem = 'You already have a place in this league.'; return undefined }
    if (!existing && !info.acceptingPlayers) { problem = 'This league is not taking new players.'; return undefined }
    joined = { ...(existing || newMember({ ...user, uDiscAliases: undefined })), membershipStatus: STATUS.PENDING, isAdmin: false }
    if (user.uDiscAliases) joined.userAliases = user.uDiscAliases
    return existing ? members.map(member => (member.id === uid ? joined : member)) : [...members, joined]
  })
  if (problem) throw new HttpsError('failed-precondition', problem)
  await setUserLeague(user, league, entryFor(joined))
  return { ok: true }
})

exports.leaveLeague = onCall(async ({ auth, data }) => {
  const uid = requireSignIn(auth)
  const league = await requireLeague(data?.league)
  await changePlayers(league, members => members.filter(member => member.id !== uid))
  await setUserLeague(await findUser(uid), league, null)
  return { ok: true }
})

// Admin actions on a member: approve, promote, demote, readd, deny, kick, ban, unban, and add (a person not in the
// league yet, who becomes a member straight away)
exports.setMemberStatus = onCall(async ({ auth, data }) => {
  const league = data?.league
  await requireLeagueAdmin(auth, league)
  const memberId = requireText(data?.memberId, 'member')
  const action = requireText(data?.action, 'action', 20)
  const user = await findUser(memberId)

  let problem = null
  let updated = null
  await changePlayers(league, (members) => {
    problem = null
    updated = null
    const existing = members.find(member => member.id === memberId)
    if (action === 'add') {
      if (existing) { problem = 'That person is already in the league.'; return undefined }
      if (!user) { problem = 'No such user.'; return undefined }
      updated = { ...newMember(user, { active: true }), ...(user.uDiscAliases ? { userAliases: user.uDiscAliases } : {}) }
      delete updated.uDiscAliases
      return [...members, updated]
    }
    if (!existing) { problem = 'That person is not in the league.'; return undefined }
    updated = applyAction(existing, action)
    if (!updated) { problem = 'Unknown action.'; return undefined }
    const admins = members.filter(member => member.membershipStatus === STATUS.ADMIN)
    if (existing.membershipStatus === STATUS.ADMIN && updated.membershipStatus !== STATUS.ADMIN && admins.length === 1) {
      problem = 'A league needs at least one admin.'
      return undefined
    }
    return members.map(member => (member.id === memberId ? updated : member))
  })
  if (problem) throw new HttpsError('failed-precondition', problem)
  await setUserLeague(user, league, entryFor(updated))
  return { ok: true }
})

// An admin editing the UDisc names saved on a member's entry (used to match them on scorecards)
exports.updateMember = onCall(async ({ auth, data }) => {
  const league = data?.league
  await requireLeagueAdmin(auth, league)
  const memberId = requireText(data?.memberId, 'member')
  const name = typeof data?.uDiscDisplayName === 'string' ? data.uDiscDisplayName.trim().slice(0, 100) : ''
  const aliases = {}
  for (const key of ['league', 'event']) aliases[key] = typeof data?.uDiscAliases?.[key] === 'string' ? data.uDiscAliases[key].trim().slice(0, 100) : ''

  let found = false
  await changePlayers(league, (members) => {
    found = members.some(member => member.id === memberId)
    return found ? members.map(member => (member.id === memberId ? { ...member, uDiscDisplayName: name, uDiscAliases: aliases } : member)) : undefined
  })
  if (!found) throw new HttpsError('not-found', 'That person is not in the league.')
  return { ok: true }
})

// Copies a player's UDisc names from their own record onto their entry in every league they're in. Each league keeps
// its own copy so pages never need to read another member's account.
const copyNames = (member, user) => ({
  ...member,
  ...(user.uDiscDisplayName ? { uDiscDisplayName: user.uDiscDisplayName } : {}),
  ...(user.uDiscAliases ? { userAliases: user.uDiscAliases } : {}),
})

exports.syncMyNames = onCall(async ({ auth }) => {
  const uid = requireSignIn(auth)
  const user = await findUser(uid)
  if (!user) throw new HttpsError('failed-precondition', 'Your account is not set up yet.')
  const leagues = Object.values(user.leagues || {}).filter(item => item && item.id)
  await Promise.all(leagues.map(item => changePlayers(item.id, members => (
    members.some(member => member.id === uid) ? members.map(member => (member.id === uid ? copyNames(member, user) : member)) : undefined
  ))))
  return { ok: true }
})

// For names saved before the lists stayed in step with their accounts
exports.syncLeagueNames = onCall(async ({ auth, data }) => {
  const league = data?.league
  await requireLeagueAdmin(auth, league)
  const users = await allUsers()
  let changed = 0
  await changePlayers(league, members => members.map(member => {
    const user = users.find(item => item.uid === member.id)
    if (!user) return member
    const next = copyNames(member, user)
    if (JSON.stringify(next) !== JSON.stringify(member)) changed++
    return next
  }))
  return { changed }
})

// A new league, with the person making it as its first admin
exports.createLeague = onCall(async ({ auth, data }) => {
  const uid = requireSignIn(auth)
  const leagueName = requireText(data?.leagueName, 'league name', 60)
  const user = await findUser(uid)
  if (!user) throw new HttpsError('failed-precondition', 'Your account is not set up yet.')

  const index = (await read('leagueIndex')) || {}
  let id = leagueIdFor(leagueName)
  for (let tries = 0; index[id] && tries < 50; tries++) id = leagueIdFor(leagueName)
  if (index[id]) throw new HttpsError('already-exists', 'Could not make a league id. Try a different name.')

  const admin = { ...newMember(user, { admin: true }) }
  delete admin.uDiscAliases
  if (user.uDiscAliases) admin.userAliases = user.uDiscAliases
  const writes = {
    [`leagueIndex/${id}`]: leagueName,
    [`${id}/info`]: {
      leagueName, leagueAcronym: id, doinkFund: Boolean(data?.doink), acceptingPlayers: true,
      blurb: '', currentSeason: 'Season 1', isPreseason: true,
      // Every new league starts on the free plan; Stripe (or a site admin) moves it up from there
      plan: 'free', planSource: 'default',
    },
    [`${id}/players`]: [admin],
    [`${id}/memberRoles/${uid}`]: 'Admin',
  }
  if (data?.doink) writes[`${id}/doinkfund`] = { players: [{ doinks: 0, name: user.name, uid }], maxDoink: 50 }
  await db().ref().update(writes)
  await setUserLeague(user, id, entryFor(admin))
  return { league: id }
})

// Removes the league and every record of it, including on its members' accounts
exports.deleteLeague = onCall(async ({ auth, data }) => {
  const league = data?.league
  await requireLeagueAdmin(auth, league)
  const writes = { [league]: null, [`leagueIndex/${league}`]: null }
  for (const user of await allUsers()) {
    const leagues = Object.values(user.leagues || {}).filter(item => item && item.id)
    if (leagues.some(item => item.id === league)) writes[`users/${user.key}/leagues`] = leagues.filter(item => item.id !== league)
  }
  await db().ref().update(writes)
  return { ok: true }
})

// Site admins only: the people on the site
exports.listUsers = onCall(async ({ auth, data }) => {
  const uid = requireSignIn(auth)
  const siteAdmin = await isSiteAdmin(uid)
  if (!siteAdmin) await requireLeagueAdmin(auth, data?.league)
  return (await allUsers()).map(user => ({
    key: user.key, uid: user.uid, name: user.name, email: user.email, uDiscDisplayName: user.uDiscDisplayName || '',
    ...(siteAdmin ? { siteAdmin: user.siteAdmin === true } : {}),
  }))
})

