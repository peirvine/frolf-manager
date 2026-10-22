const { memberList, rolesOf } = require('./membership')
const { PERMANENT_SITE_ADMIN_UID, db, read, allUsers } = require('./access')

// One-time (and safe to run again): fills in what the database rules rely on from the data as it stands now.
//  - siteAdmins/<uid>: every site admin
//  - <league>/memberRoles/<uid>: every active member's role
//  - each member's saved UDisc names, copied from their account
// The bootstrapAccess function runs this for the site owner; scripts/bootstrapAccess.js runs it from a terminal
// (against the emulator, or the real database with credentials).
const bootstrap = async () => {
  const users = await allUsers()
  const writes = {}
  const siteAdmins = { [PERMANENT_SITE_ADMIN_UID]: true }
  users.filter(user => user.siteAdmin === true && user.uid).forEach(user => { siteAdmins[user.uid] = true })
  writes.siteAdmins = siteAdmins

  const index = (await read('leagueIndex')) || {}
  let leagues = 0
  let names = 0
  await Promise.all(Object.keys(index).map(async (id) => {
    const members = memberList(await read(`${id}/players`))
    const synced = members.map(member => {
      const user = users.find(item => item.uid === member.id)
      if (!user) return member
      const next = {
        ...member,
        ...(user.uDiscDisplayName && !member.uDiscDisplayName ? { uDiscDisplayName: user.uDiscDisplayName } : {}),
        ...(user.uDiscAliases ? { userAliases: user.uDiscAliases } : {}),
      }
      if (JSON.stringify(next) !== JSON.stringify(member)) names++
      return next
    })
    leagues++
    writes[`${id}/players`] = synced.length ? synced : null
    writes[`${id}/memberRoles`] = rolesOf(synced)
  }))
  await db().ref().update(writes)
  return { siteAdmins: Object.keys(siteAdmins).length, leagues, namesCopied: names }
}

module.exports = { bootstrap }
