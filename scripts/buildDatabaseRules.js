// Writes database.rules.json. The role checks repeat in many places, so they're written once here.
//
// Who can do what:
//  - Anyone, signed in or not: read siteSettings (the pricing page needs billingEnabled before sign-in).
//  - Signed in: read leagueIndex and any league's info (to find a league to join); read and change the safe fields of
//    their own user record.
//  - League members: read their league; add scorecards; write the Elo, stats, hat, handicap and doink-player data the
//    app works out as rounds are added.
//  - League admins: also change a league's info (except the billing fields), edit or delete scorecards, run the doink fund.
//  - Site admins: all of the above in every league, and read the siteAdmins list and the feedback people send in.
//  - Nobody from the browser: who is a member or admin (players, memberRoles), site admins, the siteAdmin flag, a
//    user's league list, billing and plan fields. Those change only through the Cloud Functions, which use the admin
//    SDK and skip these rules.

const SITE_ADMIN = "root.child('siteAdmins').child(auth.uid).val() === true"
const MEMBER = "root.child($league).child('memberRoles').child(auth.uid).exists()"
const ADMIN = "root.child($league).child('memberRoles').child(auth.uid).val() === 'Admin'"

const signedIn = "auth != null"
const member = `${signedIn} && (${MEMBER} || ${SITE_ADMIN})`
const admin = `${signedIn} && (${ADMIN} || ${SITE_ADMIN})`
const ownRecord = `${signedIn} && $key.endsWith(' ' + auth.uid)`

// Fields of a user's own record they may write themselves
const OWN_FIELDS = ['name', 'uDiscDisplayName', 'uDiscAliases', 'uid', 'email', 'authProvider']
// Fields of a league's info only the Cloud Functions write
const SERVER_INFO_FIELDS = ['plan', 'planSource', 'billingSummary', 'suspended']
// Everything a league's members' browsers write as rounds are added
const MEMBER_NODES = ['eloTracking', 'playerEloHistory', 'currentElo', 'eloDelta', 'eloGraphData', 'stats', 'hatCount', 'handicaps']

const isOneOf = (name, list) => list.map(field => `${name} === '${field}'`).join(' || ')

const rules = {
  rules: {
    siteSettings: { '.read': true },
    siteAdmins: { $uid: { '.read': `${signedIn} && auth.uid === $uid` } },
    leagueIndex: { '.read': signedIn },
    // Written only by the submitFeedback function
    feedback: { '.read': `${signedIn} && ${SITE_ADMIN}` },
    users: {
      '.read': `${signedIn} && ${SITE_ADMIN}`,
      // The key is "<name> <uid>": people read and edit their own record, and only the safe parts of it
      $key: {
        '.read': ownRecord,
        $field: { '.write': `${ownRecord} && (${isOneOf('$field', OWN_FIELDS)})` },
        // A named child replaces the $field rule for that key, so these repeat the write rule
        uid: { '.write': ownRecord, '.validate': 'newData.val() === auth.uid' },
        email: { '.write': ownRecord, '.validate': 'newData.val() === auth.token.email' },
      },
    },
    $league: {
      '.read': member,
      info: {
        '.read': signedIn,
        $field: { '.write': `${admin} && !(${isOneOf('$field', SERVER_INFO_FIELDS)})` },
      },
      scorecards: {
        $season: {
          '.write': admin,
          // Members add a round; changing or deleting one is for admins. The hat winners are filled in right after.
          $card: {
            '.write': `${member} && !data.exists()`,
            hatWinners: { '.write': member },
          },
        },
      },
      doinkfund: {
        '.write': admin,
        players: { '.write': member },
      },
      ...Object.fromEntries(MEMBER_NODES.map(node => [node, { '.write': member }])),
    },
  },
}

module.exports = { rules }

if (require.main === module) {
  require('fs').writeFileSync(require('path').join(__dirname, '..', 'database.rules.json'), JSON.stringify(rules, null, 2) + '\n')
  console.log('Wrote database.rules.json')
}
