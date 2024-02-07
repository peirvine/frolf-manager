/* eslint-disable array-callback-return */
import { useState, useEffect } from 'react';
import { Alert, Paper, Snackbar, Typography, Button, Grid } from '@mui/material';
import { getLeagueSettings, setRankingSystem, createTagRankingSystem } from '../../../firebase';
import { getPlayers } from '../../../services/leagueService';
import CurrentBagTagRankings from './currentBagTagRankings';
import CurrentEloRankings from './currentEloTankings';


export default function RankingsAdmin(props) {
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertSeverity, setAlertSeverity] = useState("info")

  const [settings, setSettings] = useState({})

  useEffect(() => {
    getLeagueSettings(props.league).then(res => {
     setSettings(res)
    })
  }, [props.league])

  const handleChooseRankingMode = async mode => {
    if (mode === "bagTag") {
      const players = await getPlayers(props.league)
      let rankingsObj = []
      players.map((player, i) => {
        rankingsObj.push({ name: player, rank: i + 1 })
      })
      const tagRankRes = await createTagRankingSystem(props.league, rankingsObj, settings.currentSeason)
      if (tagRankRes.code === "error") {
        setAlertMessage("Unable to create Bag Tag ranking system")
        setAlertSeverity("error")
        setAlertOpen(true)
        return
      }
    }
    
    
    setRankingSystem(props.league, mode).then(() => {
      if (mode === "elo") setAlertMessage("Ranking system set to ELO mode")
      else setAlertMessage("Ranking system set to Bag Tag mode")
      setAlertSeverity("success")
      setAlertOpen(true)
      getLeagueSettings(props.league).then(res => {
        setSettings(res)
      })
    })
  }

  return (
    <div className="rankingsAdmin">
      <h3>Rankings Settings</h3>
        <Snackbar open={alertOpen}>
          <Alert severity={alertSeverity} onClose={() => setAlertOpen(false)}>
            {alertMessage}
          </Alert>
        </Snackbar>
        <Paper sx={{padding: 3}}>
          {settings.rankingSystem === undefined ? (
            <Grid container spacing={3}>
              <Typography variant="subtitle1">We notice that you don't have a ranking mode set for this league. Please choose one of the following:</Typography>
              <Grid xs={12} md={6} style={{ padding: 5 }}>
                <Typography variant="h6">Elo Mode</Typography>
                <Typography variant="body2">
                  The basic idea behind the ELO ranking system is to assign each player or team a numerical rating based on their performance in previous matches. When two players or teams compete against each other, their ratings are used to calculate the expected outcome of the match, and the actual outcome is compared to the expected outcome to determine how much each player's rating should change.<br /><br />
                  
                  If a player or team performs better than expected, their rating will increase, while if they perform worse than expected, their rating will decrease. The size of the rating change is determined by the difference between the actual outcome and the expected outcome, as well as the difference in ratings between the two players or teams.<br /><br />
                </Typography>
                <Button style={{ margin: 5 }} variant="contained" color="primary" onClick={() => handleChooseRankingMode("elo")}>Choose ELO Mode</Button>
              </Grid>
              <Grid xs={12} md={6} style={{ padding: 5 }}>
                <Typography variant="h5">Bag Tag Mode</Typography>
                <Typography variant="body2">
                  The Bag Tag ranking system is a popular method used in disc golf and other similar sports to rank players. Each player is given a tag with a unique number at the start of the season. The goal is to end up with the lowest number possible, which represents the highest rank.<br /><br />

                  In a Bag Tag challenge, two players will compete in a match. The player with the better score will take the lower numbered (better ranked) tag. This means that a player's rank can change frequently throughout the season, based on their performance in these challenges.<br /><br />

                  This system encourages frequent play and competition, as the only way to improve one's rank is by challenging and defeating players with lower numbered tags. It's a dynamic and engaging way to track rankings in a season.
                </Typography>
                <Button style={{ margin: 5 }} variant="contained" color="primary" onClick={() => handleChooseRankingMode("bagTag")}>Choose Bag Tag Mode</Button>
              </Grid>
            </Grid>
          ) : null}
          {settings.rankingSystem === "elo" ? 
            (
              <div>
                <Typography variant="caption"><i>Elo Mode is currently set for this league.</i></Typography>
                <CurrentEloRankings league={props.league} season={settings.currentSeason} />
                <Typography variant="body2">Do you want to switch to Bag Tag Mode? In a Bag Tag challenge, two players will compete in a match. The player with the better score will take the lower numbered (better ranked) tag. This means that a player's rank can change frequently throughout the season, based on their performance in these challenges.</Typography>
                <Button style={{ margin: 5 }} variant="contained" color="primary" onClick={() => handleChooseRankingMode("bagTag")}>Switch to Bag Tag Mode</Button>
              </div>
            ) : null
          }
          {settings.rankingSystem === "bagTag" ? 
            (
              <div>
                <Typography variant="caption"><i>Bag Tag Mode is currently set for this league.</i></Typography>
                <CurrentBagTagRankings league={props.league} season={settings.currentSeason} />
                <Typography variant="body2">Do you want to switch to Elo Mode? The basic idea behind the ELO ranking system is to assign each player or team a numerical rating based on their performance in previous matches. When two players or teams compete against each other, their ratings are used to calculate the expected outcome of the match, and the actual outcome is compared to the expected outcome to determine how much each player's rating should change.<br /><br />
                  
                  If a player or team performs better than expected, their rating will increase, while if they perform worse than expected, their rating will decrease. The size of the rating change is determined by the difference between the actual outcome and the expected outcome, as well as the difference in ratings between the two players or teams.<br /><br /></Typography>
                <Button style={{ margin: 5 }} variant="contained" color="primary" onClick={() => handleChooseRankingMode("elo")}>Switch to Elo Mode</Button>
              </div>   
            ) : null
          }
        </Paper>
    </div>
  );
}