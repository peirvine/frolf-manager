// Tests for ../database.rules.json against the database emulator. Run from the project folder with:
//   npm run test:rules
const test = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing')

const OWNER = 'owner1'
const ALICE = 'alice1' // admin of lg
const BOB = 'bob1' // member of lg
const CAROL = 'carol1' // signed in, in no league
const ADMIN2 = 'admin2' // admin of other

let env
const as = (uid) => env.authenticatedContext(uid, { email: `${uid}@example.com` }).database()
const anon = () => env.unauthenticatedContext().database()

test.before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-dgm-rules',
    database: { host: '127.0.0.1', port: 9100, rules: fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8') },
  })
})
test.after(async () => { await env.cleanup() })

test.beforeEach(async () => {
  await env.clearDatabase()
  await env.withSecurityRulesDisabled(async (context) => {
    await context.database().ref().set({
      siteSettings: { billingEnabled: false },
      siteAdmins: { [OWNER]: true },
      leagueIndex: { lg: 'League G', other: 'Other League' },
      users: {
        [`Owner ${OWNER}`]: { uid: OWNER, name: 'Owner', email: `${OWNER}@example.com`, siteAdmin: true },
        [`Alice ${ALICE}`]: { uid: ALICE, name: 'Alice', email: `${ALICE}@example.com`, siteAdmin: false, leagues: [{ id: 'lg', membershipStatus: 'Admin' }] },
        [`Bob ${BOB}`]: { uid: BOB, name: 'Bob', email: `${BOB}@example.com`, leagues: [{ id: 'lg', membershipStatus: 'Member' }] },
        [`Carol ${CAROL}`]: { uid: CAROL, name: 'Carol', email: `${CAROL}@example.com` },
      },
      lg: {
        info: { leagueName: 'League G', acceptingPlayers: true, currentSeason: 'Season 1', plan: 'free' },
        players: [{ id: ALICE, name: 'Alice', membershipStatus: 'Admin' }, { id: BOB, name: 'Bob', membershipStatus: 'Member' }],
        memberRoles: { [ALICE]: 'Admin', [BOB]: 'Member' },
        scorecards: { 'Season 1': { card1: { Course: 'Bryant' } } },
        doinkfund: { players: [{ uid: BOB, doinks: 0 }], expenses: [], maxDoink: 50 },
        billing: { customerId: 'cus_1' },
      },
      other: {
        info: { leagueName: 'Other League', acceptingPlayers: true },
        players: [{ id: ADMIN2, name: 'Admin2', membershipStatus: 'Admin' }],
        memberRoles: { [ADMIN2]: 'Admin' },
        scorecards: { 'Season 1': { card9: { Course: 'Elsewhere' } } },
      },
    })
  })
})

test('signed out: only the site settings can be read', async () => {
  await assertSucceeds(anon().ref('siteSettings/billingEnabled').get())
  await assertFails(anon().ref('leagueIndex').get())
  await assertFails(anon().ref('lg/info').get())
  await assertFails(anon().ref('users').get())
  await assertFails(anon().ref('siteSettings/billingEnabled').set(true))
})

test('signed in but in no league: can find leagues, not read or change one', async () => {
  const db = as(CAROL)
  await assertSucceeds(db.ref('leagueIndex').get())
  await assertSucceeds(db.ref('lg/info').get())
  await assertFails(db.ref('lg/players').get())
  await assertFails(db.ref('lg/scorecards').get())
  await assertFails(db.ref('lg/scorecards/Season 1/new1').set({ Course: 'x' }))
  await assertFails(db.ref('lg/info/blurb').set('hi'))
  await assertFails(db.ref('lg/currentElo/Season 1').set({ Carol: 1000 }))
  await assertFails(db.ref('lg/memberRoles/' + CAROL).set('Admin'))
  await assertFails(db.ref('lg/players').set([{ id: CAROL, membershipStatus: 'Admin' }]))
  await assertFails(db.ref('leagueIndex/lg').remove())
  await assertFails(db.ref('lg').remove())
})

test('nobody can write the site settings, the site admin list or billing from the browser', async () => {
  for (const uid of [CAROL, BOB, ALICE, OWNER]) {
    const db = as(uid)
    await assertFails(db.ref('siteSettings/billingEnabled').set(true))
    await assertFails(db.ref('siteAdmins/' + uid).set(true))
    await assertFails(db.ref('lg/billing/customerId').set('cus_x'))
    await assertFails(db.ref('lg/memberRoles/' + uid).set('Admin'))
    await assertFails(db.ref('lg/players').set([{ id: uid, membershipStatus: 'Admin' }]))
  }
})

test('a person reads and edits only the safe parts of their own record', async () => {
  const db = as(CAROL)
  await assertSucceeds(db.ref(`users/Carol ${CAROL}`).get())
  await assertSucceeds(db.ref(`users/Carol ${CAROL}/uDiscDisplayName`).set('Carol D'))
  await assertSucceeds(db.ref(`users/Carol ${CAROL}`).update({ uDiscDisplayName: 'C', uDiscAliases: { league: 'cd' } }))
  await assertFails(db.ref(`users/Carol ${CAROL}/siteAdmin`).set(true))
  await assertFails(db.ref(`users/Carol ${CAROL}`).update({ siteAdmin: true }))
  await assertFails(db.ref(`users/Carol ${CAROL}/leagues`).set([{ id: 'lg', membershipStatus: 'Admin' }]))
  await assertFails(db.ref(`users/Carol ${CAROL}/uid`).set('someoneElse'))
  await assertFails(db.ref(`users/Carol ${CAROL}/email`).set('x@y.com'))
  await assertFails(db.ref(`users/Bob ${BOB}`).get())
  await assertFails(db.ref(`users/Bob ${BOB}/uDiscDisplayName`).set('hacked'))
  await assertFails(db.ref('users').get())
})

test('signing up writes a record the person owns, with no admin or league fields', async () => {
  const db = as('newbie1')
  const key = 'users/New Person newbie1'
  const record = { uid: 'newbie1', name: 'New Person', authProvider: 'google', email: 'newbie1@example.com', uDiscDisplayName: '' }
  await assertFails(db.ref(key).update({ ...record, email: 'someone.else@example.com' }))
  await assertFails(db.ref(key).update({ ...record, uid: 'other' }))
  await assertFails(db.ref(key).update({ ...record, siteAdmin: false }))
  for (const [field, value] of Object.entries(record)) {
    await assertSucceeds(db.ref(`${key}/${field}`).set(value).catch(error => { throw new Error(`${field}: ${error.message}`) }))
  }
  await assertSucceeds(db.ref(key).update(record))
  await assertFails(as('other1').ref('users/New Person newbie1/name').set('x'))
})

test('a member reads the league and adds rounds, but cannot change or remove one', async () => {
  const db = as(BOB)
  await assertSucceeds(db.ref('lg/players').get())
  await assertSucceeds(db.ref('lg/scorecards').get())
  await assertSucceeds(db.ref('lg/scorecards/Season 1/new1').set({ Course: 'Bryant', Players: [] }))
  await assertSucceeds(db.ref('lg/scorecards/Season 1/new1/hatWinners').set(['Bob']))
  await assertFails(db.ref('lg/scorecards/Season 1/card1').set({ Course: 'Edited' }))
  await assertFails(db.ref('lg/scorecards/Season 1/card1').remove())
  await assertFails(db.ref('lg/scorecards/Season 1').remove())
  await assertSucceeds(db.ref('lg/currentElo/Season 1').set({ Bob: 1010 }))
  await assertSucceeds(db.ref('lg/eloDelta/Season 1').set({ Bob: 10 }))
  await assertSucceeds(db.ref('lg/eloTracking/Season 1/x').set({ a: 1 }))
  await assertSucceeds(db.ref('lg/eloGraphData/Season 1/x').set({ a: 1 }))
  await assertSucceeds(db.ref('lg/playerEloHistory/Season 1/Bob').set([1000]))
  await assertSucceeds(db.ref('lg/stats/Season 1').set({ a: 1 }))
  await assertSucceeds(db.ref('lg/hatCount/Bob').transaction((count) => (count || 0) + 1))
  await assertSucceeds(db.ref('lg/handicaps').set({ version: 3 }))
  await assertSucceeds(db.ref('lg/doinkfund/players/0/doinks').set(2))
  await assertSucceeds(db.ref('lg/doinkfund/players').push({ uid: BOB, doinks: 0 }))
  await assertFails(db.ref('lg/doinkfund/expenses').push({ amount: 5 }))
  await assertFails(db.ref('lg/doinkfund/maxDoink').set(1))
  await assertFails(db.ref('lg/info/blurb').set('hi'))
  await assertFails(db.ref('lg/info/leagueRules').push('a rule'))
  await assertFails(db.ref('lg/info/currentSeason').set('Season 9'))
})

test("a member of one league can't touch another", async () => {
  const db = as(BOB)
  await assertFails(db.ref('other/players').get())
  await assertFails(db.ref('other/scorecards').get())
  await assertFails(db.ref('other/scorecards/Season 1/n').set({ Course: 'x' }))
  await assertFails(db.ref('other/currentElo/Season 1').set({ a: 1 }))
  await assertFails(db.ref('other/info/blurb').set('x'))
})

test('a league admin runs the league but cannot change who is in it or the billing fields', async () => {
  const db = as(ALICE)
  await assertSucceeds(db.ref('lg/info/blurb').set('Welcome'))
  await assertSucceeds(db.ref('lg/info').update({ blurb: 'Hi', handicaps: true, acceptingPlayers: false }))
  await assertSucceeds(db.ref('lg/info/currentSeason').set('Season 2'))
  await assertSucceeds(db.ref('lg/info/leagueHistory/Season 1').set({ a: 1 }))
  await assertSucceeds(db.ref('lg/info/leagueRules').push('No mulligans'))
  await assertSucceeds(db.ref('lg/scorecards/Season 1/card1').set({ Course: 'Edited' }))
  await assertSucceeds(db.ref('lg/scorecards/Season 1/card1').remove())
  await assertSucceeds(db.ref('lg/scorecards/Season 1').remove())
  await assertSucceeds(db.ref('lg/doinkfund').set({ players: [], maxDoink: 50 }))
  await assertSucceeds(db.ref('lg/doinkfund/expenses').push({ amount: 5 }))
  await assertSucceeds(db.ref('lg/doinkfund/maxDoink').set(75))

  for (const field of ['plan', 'planSource', 'billingSummary', 'suspended']) {
    await assertFails(db.ref(`lg/info/${field}`).set('x'))
  }
  await assertFails(db.ref('lg/info').update({ blurb: 'ok', plan: 'founding' }))
  await assertFails(db.ref('lg/info').set({ leagueName: 'x', plan: 'founding' }))
  await assertFails(db.ref('lg/players').set([{ id: ALICE, membershipStatus: 'Admin' }, { id: CAROL, membershipStatus: 'Admin' }]))
  await assertFails(db.ref('lg/memberRoles/' + CAROL).set('Admin'))
  await assertFails(db.ref('lg/billing/customerId').set('cus_x'))
  await assertFails(db.ref('lg').remove())
  await assertFails(db.ref('leagueIndex/lg').remove())
  await assertFails(db.ref('other/info/blurb').set('x'))
})

test('a site admin can read and run every league, but the billing fields stay server-only', async () => {
  const db = as(OWNER)
  await assertSucceeds(db.ref('lg/players').get())
  await assertSucceeds(db.ref('other/players').get())
  await assertSucceeds(db.ref('users').get())
  await assertSucceeds(db.ref('siteAdmins/' + OWNER).get())
  await assertSucceeds(db.ref('other/info/blurb').set('x'))
  await assertSucceeds(db.ref('other/scorecards/Season 1/card9').set({ Course: 'fixed' }))
  await assertSucceeds(db.ref('other/scorecards/Season 1/card9').remove())
  await assertSucceeds(db.ref('lg/doinkfund/expenses').push({ amount: 1 }))
  await assertFails(db.ref('lg/info/plan').set('founding'))
  await assertFails(db.ref('siteSettings/billingEnabled').set(true))
  await assertFails(db.ref('siteAdmins/' + CAROL).set(true))
  await assertFails(db.ref('lg/players').set([]))
})

test("people can't read the site admin list for someone else", async () => {
  await assertSucceeds(as(OWNER).ref('siteAdmins/' + OWNER).get())
  await assertFails(as(CAROL).ref('siteAdmins/' + OWNER).get())
  await assertFails(as(CAROL).ref('siteAdmins').get())
})
