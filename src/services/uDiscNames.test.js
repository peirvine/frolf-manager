import { getUDiscNameLookup, toMainUDiscName } from './uDiscNames'
import * as db from './testUtils/fakeFirebase'
import { leagueData } from './testUtils/fixtures'

jest.mock('../firebase', () => require('./testUtils/fakeFirebase'))

// Members Alice (uid0) and Bob (uid1), with alternate names per uid
const seed = (aliases = {}) => {
  const data = leagueData("maftb", ["Alice", "Bob"])
  Object.values(data.users).forEach(user => { if (aliases[user.uid]) user.uDiscAliases = aliases[user.uid] })
  db.reset(data)
}

describe("getUDiscNameLookup", () => {
  test("maps members' league and event round names to their main name", async () => {
    seed({ uid0: { league: "Alice Smith", event: "A. Smith" } })
    const lookup = await getUDiscNameLookup("maftb")
    expect(["Alice Smith", "A. Smith", "Alice", "Bob"].map(name => toMainUDiscName(lookup, name))).toEqual(["Alice", "Alice", "Alice", "Bob"])
  })

  test("also uses the names an admin saved on the league's player list", async () => {
    seed()
    db.write("maftb/players/0/uDiscAliases", { league: "", event: "Alice S" })
    db.write("maftb/players/1/uDiscDisplayName", "Robert")
    const lookup = await getUDiscNameLookup("maftb")
    expect(["Alice S", "Robert", "Bob"].map(name => toMainUDiscName(lookup, name))).toEqual(["Alice", "Bob", "Bob"])
  })

  test("falls back to the admin's main name for a member who never set one", async () => {
    seed()
    db.write("users/Alice Google uid0/uDiscDisplayName", "")
    db.write("maftb/players/0/uDiscAliases", { event: "Alice S" })
    expect(toMainUDiscName(await getUDiscNameLookup("maftb"), "Alice S")).toBe("Alice")
  })

  test("ignores case and stray spaces", async () => {
    seed({ uid1: { league: "Bobby" } })
    const lookup = await getUDiscNameLookup("maftb")
    expect(["alice ", " BOBBY"].map(name => toMainUDiscName(lookup, name))).toEqual(["Alice", "Bob"])
  })

  test("leaves blank alternate names, non-members and the Par row alone", async () => {
    seed({ uid0: { league: "", event: "" } })
    const lookup = await getUDiscNameLookup("maftb")
    expect(["Visitor", "Par", ""].map(name => toMainUDiscName(lookup, name))).toEqual(["Visitor", "Par", ""])
  })

  test("doesn't match a name two members both use", async () => {
    seed({ uid0: { event: "Smith" }, uid1: { event: "smith" } })
    expect(toMainUDiscName(await getUDiscNameLookup("maftb"), "Smith")).toBe("Smith")
  })

  test("is empty when the members can't be read", async () => {
    seed()
    db.fail("getLeagueMembers")
    expect((await getUDiscNameLookup("maftb")).size).toBe(0)
  })
})
