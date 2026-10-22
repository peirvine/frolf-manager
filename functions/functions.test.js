// Tests for the league and site-admin functions, run against the database emulator (npm run test:rules runs these
// too). The admin SDK skips the database rules, so what's tested here is each function's own checks and data changes.
process.env.FIREBASE_DATABASE_EMULATOR_HOST = '127.0.0.1:9100'
process.env.GCLOUD_PROJECT = 'demo-dgm-rules'
process.env.DATABASE_URL = 'http://127.0.0.1:9100?ns=demo-dgm-rules'

const test = require('node:test')
const assert = require('node:assert/strict')
const functionsTest = require('firebase-functions-test')()
const league = require('./leagueFunctions')
const site = require('./siteFunctions')
const { PERMANENT_SITE_ADMIN_UID, db, read } = require('./access')

const run = (fn, uid, data) => functionsTest.wrap(fn)({ data, auth: uid ? { uid, token: { email: `${uid}@example.com` } } : undefined })
const rejects = (promise, code) => assert.rejects(promise, error => (code ? error.code === code : true))

const OWNER = PERMANENT_SITE_ADMIN_UID
const ALICE = 'alice1' // admin of lg
const BOB = 'bob1' // member
const CAROL = 'carol1' // no league
const DAVE = 'dave1' // pending

const seed = async () => {
  await db().ref().set({
    leagueIndex: { lg: 'League G' },
    users: {
      [`Owner ${OWNER}`]: { uid: OWNER, name: 'Owner', siteAdmin: true },
      [`Alice ${ALICE}`]: { uid: ALICE, name: 'Alice', uDiscDisplayName: 'Alice', leagues: [{ id: 'lg', isAdmin: true, membershipStatus: 'Admin' }] },
      [`Bob ${BOB}`]: { uid: BOB, name: 'Bob', uDiscDisplayName: 'Bob', leagues: [{ id: 'lg', isAdmin: false, membershipStatus: 'Member' }] },
      [`Carol ${CAROL}`]: { uid: CAROL, name: 'Carol', uDiscDisplayName: 'Carol', uDiscAliases: { league: 'Carrie' } },
      [`Dave ${DAVE}`]: { uid: DAVE, name: 'Dave', uDiscDisplayName: 'Dave', leagues: [{ id: 'lg', membershipStatus: 'Pending' }] },
    },
    lg: {
      info: { leagueName: 'League G', acceptingPlayers: true, currentSeason: 'Season 1' },
      players: [
        { id: ALICE, name: 'Alice', membershipStatus: 'Admin', isAdmin: true, uDiscDisplayName: 'Alice' },
        { id: BOB, name: 'Bob', membershipStatus: 'Member', isAdmin: false, uDiscDisplayName: 'Bob' },
        { id: DAVE, name: 'Dave', membershipStatus: 'Pending', isAdmin: false, uDiscDisplayName: 'Dave' },
      ],
      memberRoles: { [ALICE]: 'Admin', [BOB]: 'Member' },
    },
  })
}

test.before(async () => { await db().ref().set(null) })
test.after(async () => { await db().goOffline(); functionsTest.cleanup() })
test.beforeEach(seed)

const players = async () => (await read('lg/players')).filter(Boolean)
const userLeagues = async (name, uid) => (await read(`users/${name} ${uid}/leagues`)) || []

test('joining: asks to join as pending, on the league and on the person', async () => {
  await run(league.joinLeague, CAROL, { league: 'lg' })
  const carol = (await players()).find(member => member.id === CAROL)
  assert.equal(carol.membershipStatus, 'Pending')
  assert.equal(carol.uDiscDisplayName, 'Carol')
  assert.deepEqual(carol.userAliases, { league: 'Carrie' })
  assert.deepEqual(await userLeagues('Carol', CAROL), [{ id: 'lg', isAdmin: false, membershipStatus: 'Pending' }])
  // pending people aren't members yet
  assert.equal(await read(`lg/memberRoles/${CAROL}`), null)
})

test('joining: refuses repeats, closed leagues and strangers', async () => {
  await rejects(run(league.joinLeague, BOB, { league: 'lg' }), 'failed-precondition')
  await db().ref('lg/info/acceptingPlayers').set(false)
  await rejects(run(league.joinLeague, CAROL, { league: 'lg' }), 'failed-precondition')
  await db().ref('lg/info/acceptingPlayers').set(true)
  await db().ref('lg/info/suspended').set(true)
  await rejects(run(league.joinLeague, CAROL, { league: 'lg' }), 'failed-precondition')
  await rejects(run(league.joinLeague, CAROL, { league: 'nope' }), 'not-found')
  await rejects(run(league.joinLeague, undefined, { league: 'lg' }), 'unauthenticated')
  await rejects(run(league.joinLeague, 'ghost', { league: 'lg' }), 'failed-precondition')
})

test('someone removed can reapply, but a banned person cannot', async () => {
  await run(league.setMemberStatus, ALICE, { league: 'lg', memberId: BOB, action: 'kick' })
  await run(league.joinLeague, BOB, { league: 'lg' })
  assert.equal((await players()).find(member => member.id === BOB).membershipStatus, 'Pending')
  await run(league.setMemberStatus, ALICE, { league: 'lg', memberId: BOB, action: 'ban' })
  await rejects(run(league.joinLeague, BOB, { league: 'lg' }), 'failed-precondition')
})

test('admin actions change the league list, the person and the role map together', async () => {
  await run(league.setMemberStatus, ALICE, { league: 'lg', memberId: DAVE, action: 'approve' })
  assert.equal((await players()).find(member => member.id === DAVE).membershipStatus, 'Member')
  assert.equal(await read(`lg/memberRoles/${DAVE}`), 'Member')
  assert.equal((await userLeagues('Dave', DAVE))[0].membershipStatus, 'Member')

  await run(league.setMemberStatus, ALICE, { league: 'lg', memberId: DAVE, action: 'promote' })
  assert.equal(await read(`lg/memberRoles/${DAVE}`), 'Admin')
  assert.equal((await players()).find(member => member.id === DAVE).isAdmin, true)

  await run(league.setMemberStatus, ALICE, { league: 'lg', memberId: DAVE, action: 'kick' })
  assert.equal(await read(`lg/memberRoles/${DAVE}`), null)
  assert.equal((await userLeagues('Dave', DAVE))[0].membershipStatus, 'Removed, you may reapply')
})

test('admin actions are for admins only, and a league keeps an admin', async () => {
  await rejects(run(league.setMemberStatus, BOB, { league: 'lg', memberId: DAVE, action: 'approve' }), 'permission-denied')
  await rejects(run(league.setMemberStatus, CAROL, { league: 'lg', memberId: DAVE, action: 'approve' }), 'permission-denied')
  await rejects(run(league.setMemberStatus, DAVE, { league: 'lg', memberId: DAVE, action: 'promote' }), 'permission-denied')
  await rejects(run(league.setMemberStatus, ALICE, { league: 'lg', memberId: ALICE, action: 'demote' }), 'failed-precondition')
  await rejects(run(league.setMemberStatus, ALICE, { league: 'lg', memberId: ALICE, action: 'kick' }), 'failed-precondition')
  await rejects(run(league.setMemberStatus, ALICE, { league: 'lg', memberId: BOB, action: 'launch' }), 'failed-precondition')
  await rejects(run(league.setMemberStatus, ALICE, { league: 'lg', memberId: CAROL, action: 'approve' }), 'failed-precondition')
  assert.equal(await read(`lg/memberRoles/${BOB}`), 'Member')
})

test('a site admin can run any league, and adding puts someone in as a member', async () => {
  await run(league.setMemberStatus, OWNER, { league: 'lg', memberId: CAROL, action: 'add' })
  assert.equal((await players()).find(member => member.id === CAROL).membershipStatus, 'Member')
  assert.equal(await read(`lg/memberRoles/${CAROL}`), 'Member')
  assert.equal((await userLeagues('Carol', CAROL))[0].membershipStatus, 'Member')
  await rejects(run(league.setMemberStatus, OWNER, { league: 'lg', memberId: CAROL, action: 'add' }), 'failed-precondition')
})

test('leaving removes the person everywhere', async () => {
  await run(league.leaveLeague, BOB, { league: 'lg' })
  assert.equal((await players()).some(member => member.id === BOB), false)
  assert.equal(await read(`lg/memberRoles/${BOB}`), null)
  assert.deepEqual(await userLeagues('Bob', BOB), [])
})

test("an admin edits a member's saved names", async () => {
  await run(league.updateMember, ALICE, { league: 'lg', memberId: BOB, uDiscDisplayName: ' Bobby ', uDiscAliases: { league: 'B', event: 'Bob E', other: 'ignored' } })
  const bob = (await players()).find(member => member.id === BOB)
  assert.equal(bob.uDiscDisplayName, 'Bobby')
  assert.deepEqual(bob.uDiscAliases, { league: 'B', event: 'Bob E' })
  await rejects(run(league.updateMember, BOB, { league: 'lg', memberId: BOB, uDiscDisplayName: 'x' }), 'permission-denied')
  await rejects(run(league.updateMember, ALICE, { league: 'lg', memberId: CAROL, uDiscDisplayName: 'x' }), 'not-found')
})

test('names are copied from accounts onto league entries', async () => {
  await db().ref(`users/Bob ${BOB}`).update({ uDiscDisplayName: 'Bobby', uDiscAliases: { event: 'BobE' } })
  await run(league.syncMyNames, BOB, {})
  const bob = (await players()).find(member => member.id === BOB)
  assert.equal(bob.uDiscDisplayName, 'Bobby')
  assert.deepEqual(bob.userAliases, { event: 'BobE' })

  await db().ref(`users/Dave ${DAVE}`).update({ uDiscDisplayName: 'Davey' })
  assert.deepEqual(await run(league.syncLeagueNames, ALICE, { league: 'lg' }), { changed: 1 })
  assert.equal((await players()).find(member => member.id === DAVE).uDiscDisplayName, 'Davey')
  await rejects(run(league.syncLeagueNames, BOB, { league: 'lg' }), 'permission-denied')
})

test('creating a league makes its creator the admin', async () => {
  const { league: id } = await run(league.createLeague, CAROL, { leagueName: 'Carols Frolf Club', doink: true })
  assert.match(id, /^cfc\d+$/)
  assert.equal(await read(`leagueIndex/${id}`), 'Carols Frolf Club')
  assert.equal((await read(`${id}/info`)).acceptingPlayers, true)
  assert.equal((await read(`${id}/info`)).doinkFund, true)
  assert.equal((await read(`${id}/info`)).plan, 'free')
  assert.equal((await read(`${id}/info`)).planSource, 'default')
  assert.equal((await read(`${id}/players`))[0].membershipStatus, 'Admin')
  assert.equal(await read(`${id}/memberRoles/${CAROL}`), 'Admin')
  assert.equal((await read(`${id}/doinkfund/players`))[0].uid, CAROL)
  // the creator starts the first season on 1000
  assert.equal(await read(`${id}/currentElo/Season 1/Carol`), 1000)
  assert.equal(await read(`${id}/eloDelta/Season 1/Carol`), 0)
  assert.deepEqual(await userLeagues('Carol', CAROL), [{ id, isAdmin: true, membershipStatus: 'Admin' }])
  await rejects(run(league.createLeague, CAROL, { leagueName: '' }), 'invalid-argument')
  await rejects(run(league.createLeague, undefined, { leagueName: 'x' }), 'unauthenticated')
})

test('deleting a league takes it off the index and every account', async () => {
  await rejects(run(league.deleteLeague, BOB, { league: 'lg' }), 'permission-denied')
  await run(league.deleteLeague, ALICE, { league: 'lg' })
  assert.equal(await read('lg'), null)
  assert.equal(await read('leagueIndex/lg'), null)
  assert.deepEqual(await userLeagues('Bob', BOB), [])
  assert.deepEqual(await userLeagues('Alice', ALICE), [])
})

test('listing users: league admins and site admins only', async () => {
  const asLeagueAdmin = await run(league.listUsers, ALICE, { league: 'lg' })
  assert.equal(asLeagueAdmin.length, 5)
  assert.equal('siteAdmin' in asLeagueAdmin[0], false)
  const asSiteAdmin = await run(league.listUsers, OWNER, {})
  assert.equal(asSiteAdmin.find(user => user.uid === OWNER).siteAdmin, true)
  await rejects(run(league.listUsers, BOB, { league: 'lg' }), 'permission-denied')
})

test('site admins: promote, protect the owner, settings, suspension, deleting people', async () => {
  await rejects(run(site.setSiteAdmin, BOB, { uid: BOB, siteAdmin: true }), 'permission-denied')
  await run(site.setSiteAdmin, OWNER, { uid: BOB, siteAdmin: true })
  assert.equal(await read(`siteAdmins/${BOB}`), true)
  assert.equal(await read(`users/Bob ${BOB}/siteAdmin`), true)
  await run(site.setSiteAdmin, BOB, { uid: BOB, siteAdmin: false })
  assert.equal(await read(`siteAdmins/${BOB}`), null)
  await rejects(run(site.setSiteAdmin, OWNER, { uid: OWNER, siteAdmin: false }), 'failed-precondition')

  await run(site.setSiteSetting, OWNER, { key: 'billingEnabled', value: true })
  assert.equal(await read('siteSettings/billingEnabled'), true)
  await rejects(run(site.setSiteSetting, CAROL, { key: 'billingEnabled', value: true }), 'permission-denied')
  await rejects(run(site.setSiteSetting, OWNER, { key: 'bad key', value: true }), 'invalid-argument')
  await rejects(run(site.setSiteSetting, OWNER, { key: 'k', value: { nested: 1 } }), 'invalid-argument')

  await run(site.setLeagueSuspended, OWNER, { league: 'lg', suspended: true })
  assert.equal(await read('lg/info/suspended'), true)
  await rejects(run(site.setLeagueSuspended, ALICE, { league: 'lg', suspended: false }), 'permission-denied')

  await rejects(run(site.deleteUser, OWNER, { uid: OWNER }), 'failed-precondition')
  await run(site.deleteUser, OWNER, { uid: BOB })
  assert.equal(await read(`users/Bob ${BOB}`), null)
  assert.equal((await players()).some(member => member.id === BOB), false)
  assert.equal(await read(`lg/memberRoles/${BOB}`), null)
})

test('bootstrap fills in the access lists, and only the owner can run it', async () => {
  await db().ref('lg/memberRoles').set(null)
  await rejects(run(site.bootstrapAccess, ALICE, {}), 'permission-denied')
  const result = await run(site.bootstrapAccess, OWNER, {})
  assert.deepEqual(result, { siteAdmins: 1, leagues: 1, namesCopied: 0 })
  assert.equal(await read(`siteAdmins/${OWNER}`), true)
  assert.deepEqual(await read('lg/memberRoles'), { [ALICE]: 'Admin', [BOB]: 'Member' })
  await run(site.bootstrapAccess, OWNER, {})
  assert.deepEqual(await read('lg/memberRoles'), { [ALICE]: 'Admin', [BOB]: 'Member' })
})

test('members start the season on 1000 when they become members, without changing existing ratings', async () => {
  await db().ref('lg/currentElo/Season 1').set({ Alice: 1234 })
  await run(league.setMemberStatus, ALICE, { league: 'lg', memberId: DAVE, action: 'approve' })
  assert.equal(await read('lg/currentElo/Season 1/Dave'), 1000)
  assert.equal(await read('lg/eloDelta/Season 1/Dave'), 0)
  assert.equal(await read('lg/currentElo/Season 1/Alice'), 1234)
  // pending people aren't rated
  await db().ref(`users/Carol ${CAROL}`).update({ uDiscDisplayName: 'Carol' })
  await run(league.joinLeague, CAROL, { league: 'lg' })
  assert.equal(await read('lg/currentElo/Season 1/Carol'), null)
})

test("a member who sets their UDisc name later is rated then", async () => {
  await db().ref(`users/Dave ${DAVE}`).update({ uDiscDisplayName: '' })
  await db().ref('lg/players/2').update({ membershipStatus: 'Member', uDiscDisplayName: '' })
  await run(site.bootstrapAccess, OWNER, {})
  assert.equal(await read('lg/currentElo/Season 1/Dave'), null)
  await db().ref(`users/Dave ${DAVE}`).update({ uDiscDisplayName: 'Davey' })
  await run(league.syncMyNames, DAVE, {})
  assert.equal(await read('lg/currentElo/Season 1/Davey'), 1000)
})
