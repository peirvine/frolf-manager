const test = require('node:test')
const assert = require('node:assert/strict')
const { eloSeedWrites, validKey } = require('./seeding')

const players = [
  { id: 'a', membershipStatus: 'Admin', uDiscDisplayName: 'Alice' },
  { id: 'b', membershipStatus: 'Member', uDiscDisplayName: 'Bob' },
  { id: 'c', membershipStatus: 'Pending', uDiscDisplayName: 'Cara' },
  { id: 'd', membershipStatus: 'Removed, you may reapply', uDiscDisplayName: 'Dan' },
  { id: 'e', membershipStatus: 'Member', uDiscDisplayName: '' },
]

test('every active member gets 1000 and a 0 change; others do not', () => {
  assert.deepEqual(eloSeedWrites({ league: 'lg', season: 'Season 1', players }), {
    'lg/currentElo/Season 1/Alice': 1000, 'lg/eloDelta/Season 1/Alice': 0,
    'lg/currentElo/Season 1/Bob': 1000, 'lg/eloDelta/Season 1/Bob': 0,
  })
})

test('existing ratings are left alone', () => {
  const writes = eloSeedWrites({ league: 'lg', season: 'S', players, currentElo: { Alice: 1234 }, eloDelta: { Alice: 5, Bob: 0 } })
  assert.deepEqual(writes, { 'lg/currentElo/S/Bob': 1000 })
})

test('nothing is written without a season, or for names that cannot be database keys', () => {
  assert.deepEqual(eloSeedWrites({ league: 'lg', season: undefined, players }), {})
  const odd = [{ id: 'a', membershipStatus: 'Member', uDiscDisplayName: 'A.B' }, { id: 'b', membershipStatus: 'Member', uDiscDisplayName: 'ok' }]
  assert.deepEqual(Object.keys(eloSeedWrites({ league: 'lg', season: 'S', players: odd })).sort(), ['lg/currentElo/S/ok', 'lg/eloDelta/S/ok'])
  assert.equal(validKey('x/y'), false)
  assert.equal(validKey('  '), false)
})

test('a name shared by two members is seeded once', () => {
  const twins = [{ id: 'a', membershipStatus: 'Member', uDiscDisplayName: 'Sam' }, { id: 'b', membershipStatus: 'Admin', uDiscDisplayName: 'Sam' }]
  assert.equal(Object.keys(eloSeedWrites({ league: 'lg', season: 'S', players: twins })).length, 2)
})
