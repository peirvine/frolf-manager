const test = require('node:test')
const assert = require('node:assert/strict')
const { STATUS, roleFor, memberList, applyAction, newMember, withLeagueEntry, rolesOf, leagueIdFor } = require('./membership')

test("only active members have a role", () => {
  assert.equal(roleFor(STATUS.ADMIN), "Admin")
  assert.equal(roleFor(STATUS.MEMBER), "Member")
  for (const status of [STATUS.PENDING, STATUS.REMOVED, STATUS.DENIED, STATUS.BANNED, undefined]) assert.equal(roleFor(status), null)
})

test("admin actions set the status the pages expect", () => {
  const member = { id: "u1", membershipStatus: STATUS.PENDING, isAdmin: false }
  assert.deepEqual(applyAction(member, "approve"), { id: "u1", membershipStatus: "Member", isAdmin: false })
  assert.deepEqual(applyAction(member, "promote"), { id: "u1", membershipStatus: "Admin", isAdmin: true })
  assert.equal(applyAction({ ...member, isAdmin: true, membershipStatus: "Admin" }, "demote").isAdmin, false)
  assert.equal(applyAction(member, "kick").membershipStatus, "Removed, you may reapply")
  assert.equal(applyAction(member, "ban").membershipStatus, "Banned from the League")
  assert.equal(applyAction(member, "deny").membershipStatus, "Memership Denied")
  assert.equal(applyAction(member, "unban").membershipStatus, "Pending")
  assert.equal(applyAction(member, "launch"), null)
})

test("a kick keeps the rest of the entry, including admin-edited names", () => {
  const result = applyAction({ id: "u1", membershipStatus: "Member", isAdmin: false, uDiscDisplayName: "Lane" }, "kick")
  assert.equal(result.uDiscDisplayName, "Lane")
})

test("new members start pending unless made active or admin", () => {
  const user = { uid: "u1", name: "Lane", uDiscDisplayName: "Lane D" }
  assert.equal(newMember(user).membershipStatus, "Pending")
  assert.equal(newMember(user, { active: true }).membershipStatus, "Member")
  const admin = newMember(user, { admin: true })
  assert.deepEqual([admin.membershipStatus, admin.isAdmin], ["Admin", true])
})

test("a player's league list keeps their other leagues", () => {
  const leagues = [{}, { id: "a", membershipStatus: "Member" }, { id: "b", membershipStatus: "Pending" }]
  assert.deepEqual(withLeagueEntry(leagues, "b", { membershipStatus: "Member", isAdmin: false }), [
    { id: "a", membershipStatus: "Member" },
    { id: "b", membershipStatus: "Member", isAdmin: false },
  ])
  assert.deepEqual(withLeagueEntry(leagues, "a", null), [{ id: "b", membershipStatus: "Pending" }])
  assert.deepEqual(withLeagueEntry(undefined, "a", { membershipStatus: "Pending" }), [{ id: "a", membershipStatus: "Pending" }])
})

test("roles come from active members only, from a list or an object", () => {
  const players = [
    { id: "u1", membershipStatus: "Admin" },
    { id: "u2", membershipStatus: "Member" },
    { id: "u3", membershipStatus: "Pending" },
    null,
    { membershipStatus: "Member" },
  ]
  assert.deepEqual(rolesOf(players), { u1: "Admin", u2: "Member" })
  assert.deepEqual(rolesOf({ 0: players[0], 5: players[1] }), { u1: "Admin", u2: "Member" })
  assert.deepEqual(memberList(players).map(member => member.id), ["u1", "u2", "u3"])
  assert.deepEqual(rolesOf(undefined), {})
})

test("league ids are initials plus a number", () => {
  assert.equal(leagueIdFor("Minnesota Ace Frolf Bros", () => 0.5), "mafb49")
  assert.equal(leagueIdFor("", () => 0), "l0")
})
