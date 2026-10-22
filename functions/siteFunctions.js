const { onCall, HttpsError } = require('firebase-functions/v2/https')
const access = require('./access')
const { PERMANENT_SITE_ADMIN_UID, db, read, requireSignIn, requireText, allUsers, requireSiteAdmin, requireLeague } = access
const { memberList, rolesOf } = require('./membership')
const { bootstrap } = require('./bootstrap')

// Changes only a site admin can make

exports.setSiteAdmin = onCall(async ({ auth, data }) => {
  await requireSiteAdmin(auth)
  const uid = requireText(data?.uid, 'user')
  const siteAdmin = data?.siteAdmin === true
  if (!siteAdmin && uid === PERMANENT_SITE_ADMIN_UID) throw new HttpsError('failed-precondition', "This site admin can't be removed.")
  const user = (await allUsers()).find(item => item.uid === uid)
  if (!user) throw new HttpsError('not-found', 'No such user.')
  await db().ref().update({ [`users/${user.key}/siteAdmin`]: siteAdmin, [`siteAdmins/${uid}`]: siteAdmin ? true : null })
  return { ok: true }
})

exports.setLeagueSuspended = onCall(async ({ auth, data }) => {
  await requireSiteAdmin(auth)
  const league = await requireLeague(data?.league)
  await db().ref(`${league}/info`).update({ suspended: data?.suspended === true })
  return { ok: true }
})

exports.setSiteSetting = onCall(async ({ auth, data }) => {
  await requireSiteAdmin(auth)
  const key = requireText(data?.key, 'setting', 60)
  if (!/^[A-Za-z0-9_]+$/.test(key)) throw new HttpsError('invalid-argument', 'Setting names are letters, numbers and underscores.')
  const value = data?.value
  if (typeof value !== 'boolean' && !(typeof value === 'string' && value.length <= 500)) throw new HttpsError('invalid-argument', 'A setting is on/off or short text.')
  await db().ref(`siteSettings/${key}`).set(value)
  return { ok: true }
})

// Removes the user's record and their place in every league. Their sign-in account itself has to be removed in the
// Firebase console.
exports.deleteUser = onCall(async ({ auth, data }) => {
  await requireSiteAdmin(auth)
  const uid = requireText(data?.uid, 'user')
  if (uid === PERMANENT_SITE_ADMIN_UID) throw new HttpsError('failed-precondition', "This site admin can't be removed.")
  const user = (await allUsers()).find(item => item.uid === uid)
  if (!user) throw new HttpsError('not-found', 'No such user.')
  const writes = { [`users/${user.key}`]: null, [`siteAdmins/${uid}`]: null }
  const index = (await read('leagueIndex')) || {}
  await Promise.all(Object.keys(index).map(async (id) => {
    const players = (await read(`${id}/players`)) || {}
    const remaining = memberList(players).filter(member => member.id !== uid)
    if (remaining.length !== memberList(players).length) {
      writes[`${id}/players`] = remaining.length ? remaining : null
      writes[`${id}/memberRoles`] = rolesOf(remaining)
    }
  }))
  await db().ref().update(writes)
  return { ok: true }
})

exports.bootstrapAccess = onCall(async ({ auth }) => {
  const uid = requireSignIn(auth)
  if (uid !== PERMANENT_SITE_ADMIN_UID) throw new HttpsError('permission-denied', 'Only the site owner can do that.')
  return bootstrap()
})
