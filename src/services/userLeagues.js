import { getUserDataV2 } from '../firebase'

// The leagues a user belongs to. A brand new user may have no user record, or a record with no `leagues`,
// so this always returns an array (empty if they aren't in a league yet).
export const getUserLeagues = async (user) => {
  if (!user) return []
  const userData = await getUserDataV2(user)
  const leagues = userData?.leagues
  return Array.isArray(leagues) ? leagues.filter(x => x?.id) : []
}
