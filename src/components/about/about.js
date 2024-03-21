import { useState, useEffect } from "react"
import "./about.scss"
import LeagueHistoryHolder from "./leagueHistory/leagueHistoryHolder"
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, getUserDataV2, getLeagueNames } from "../../firebase"
import { Autocomplete, TextField } from "@mui/material";
import LeagueRules from "./leagueRules";
import { LeagueBlurb } from "./leagueBlurb";

export default function About () {
  const [user] = useAuthState(auth);
  const [optionArray, setOptionArray] = useState([])
  const [league, setLeague] = useState()

  useEffect(() => {
    buildOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const buildOptions = async () => {
    if (user !== null) {
      const userData = await getUserDataV2(user)
      const leagues = await getLeagueNames()
      if (userData.leagues.length > 1) {
        let optionsArray = []
        userData.leagues.map(x => optionsArray.push({ label: leagues[x.id], id: x.id}))
        setOptionArray(optionsArray)
        setLeague(userData.leagues[0].id)
      } else {
        setLeague(userData.leagues[0].id)
      }
    }
  }

  return (
    <div className="about">

      <h1>League History</h1>
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
    </div>
  )
}