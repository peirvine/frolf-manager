const { onCall, HttpsError } = require('firebase-functions/v2/https')
const access = require('./access')
const { PERMANENT_SITE_ADMIN_UID, db, read, requireSignIn, requireText, allUsers, requireSiteAdmin, requireLeague } = access
const { memberList, rolesOf } = require('./membership')
const { bootstrap } = require('./bootstrap')
const { defineString } = require('firebase-functions/params')

// Where to announce new feedback: a Slack or Discord incoming-webhook URL, set in functions/.env as
// FEEDBACK_WEBHOOK_URL. Left empty, feedback is only saved.
const FEEDBACK_WEBHOOK_URL = defineString('FEEDBACK_WEBHOOK_URL', { default: '' })

// Never fails the submission: the feedback is already saved by the time this runs
const announce = async (entry) => {
  const url = FEEDBACK_WEBHOOK_URL.value()
  if (!url) return
  const text = `New ${entry.kind} feedback from ${entry.name || 'someone'}${entry.email ? ` (${entry.email})` : ''}${entry.page ? ` on ${entry.page}` : ''}:\n${entry.message}`
  try {
    // "text" is Slack's field and "content" is Discord's; each ignores the other
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, content: text.slice(0, 2000) }) })
    if (!res.ok) console.error('Feedback notification failed:', res.status)
  } catch (error) {
    console.error('Feedback notification failed:', error?.message)
  }
}

// Feedback from signed-in users, read by site admins on the admin page. The browser can't write it directly, so it
// can be checked and capped here.
const FEEDBACK_KINDS = ['bug', 'idea', 'other']

exports.submitFeedback = onCall(async ({ auth, data }) => {
  const uid = requireSignIn(auth)
  const kind = FEEDBACK_KINDS.includes(data?.kind) ? data.kind : 'other'
  const message = requireText(data?.message, 'message', 2000)
  const page = typeof data?.page === 'string' ? data.page.slice(0, 200) : ''
  const entry = { kind, message, page, uid, name: auth.token?.name || '', email: auth.token?.email || '', createdAt: Date.now() }
  await db().ref('feedback').push(entry)
  await announce(entry)
  return { ok: true }
})

exports.deleteFeedback = onCall(async ({ auth, data }) => {
  await requireSiteAdmin(auth)
  const id = requireText(data?.id, 'feedback', 100)
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new HttpsError('invalid-argument', 'Missing or invalid feedback.')
  await db().ref(`feedback/${id}`).remove()
  return { ok: true }
})

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
