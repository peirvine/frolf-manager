import { useState, useEffect } from "react"
import "./about.scss"
import LeagueHistoryHolder from "./leagueHistory/leagueHistoryHolder"
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, getLeagueNames } from "../../firebase"
import { getUserLeagues } from "../../services/userLeagues"
import NoLeague from "../noLeague/noLeague"
import { Autocomplete, TextField } from "@mui/material";
import LeagueRules from "./leagueRules";
import { LeagueBlurb } from "./leagueBlurb";

export default function About () {
  const [user] = useAuthState(auth);
  const [optionArray, setOptionArray] = useState([])
  const [noLeague, setNoLeague] = useState(false)
  const [league, setLeague] = useState()

  useEffect(() => {
    buildOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const buildOptions = async () => {
    if (user !== null) {
      const userLeagues = await getUserLeagues(user)
      if (userLeagues.length === 0) {
        setNoLeague(true)
        return
      }
      setNoLeague(false)
      const leagues = (await getLeagueNames()) || {}
      if (userLeagues.length > 1) {
        let optionsArray = []
        userLeagues.map(x => optionsArray.push({ label: leagues[x.id], id: x.id}))
        setOptionArray(optionsArray)
      }
      setLeague(userLeagues[0].id)
    }
  }

  if (noLeague) {
    return (
      <div className="about">
        <h1>League History</h1>
        <NoLeague />
      </div>
    )
  }

  return (
    <div className="about">

      <h1>League History</h1>
      <div className="pageCard">
        {optionArray.length > 1 ? (
          <Autocomplete
            disablePortal
            disableClearable
            id="combo-box-demo"
            options={optionArray}
            sx={{ marginTop: 1 }}
            renderInput={(params) => <TextField {...params} label="Choose League" defaultValue={params[0]}/>}
            onChange={(event, newValue) => {
              setLeague(newValue.id);
            }}
          />
        ) : null}
        {league && (
          <>
            <div className="aboutText">
              <LeagueBlurb league={league} />
            </div>
            <div className="leagueRules">
              <LeagueRules league={league} />
            </div>
            <div className="aboutHistory">
              <h3>Past Seasons</h3>
              <LeagueHistoryHolder league={league} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}