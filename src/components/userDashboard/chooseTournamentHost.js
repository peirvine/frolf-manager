import { Button, Grid, Paper } from '@mui/material'
import { getCurrentElo, getLeagueSettings } from '../../firebase'
import { useEffect, useState } from 'react'

export default function ChooseTournamentHost(props) {
  const leagueID = props.league
  const [settings, setSettings] = useState({})
  const [elo, setElo] = useState(null)

  useEffect(() => {
    async function fetchLeagueSettings() {
      try {
        const leagueSettings = await getLeagueSettings(leagueID)
        setSettings(leagueSettings)
      } catch (error) {
        console.error('Error fetching league settings:', error)
      }
    }

    fetchLeagueSettings()
  }, [leagueID])

  useEffect(() => {
    async function fetchElo() {
      try {
        const currentElo = await getCurrentElo(leagueID, "Season 3")
        const sortedElo = Object.entries(currentElo)
          .sort(([, a], [, b]) => b - a)
          .reduce((acc, [key, value]) => {
            acc[key] = value
            return acc
          }, {})
        setElo(sortedElo)
      } catch (error) {
        console.error('Error fetching current ELO:', error)
      }
    }

    fetchElo()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  console.warn('ELO', elo)

  const selectHost = () => {
    if (!elo) {
      console.error('ELO data is not available.')
      return
    }
    let updatedElo = { ...elo }
    const playerToRemove = prompt('Enter the name of the player to remove from the rankings:')
    if (playerToRemove && elo[playerToRemove]) {
      delete updatedElo[playerToRemove]
      console.log(`${playerToRemove} has been removed from the rankings.`)
    } else {
      console.error('Invalid player name or player does not exist in the rankings.')
    }
    const rankings = Object.keys(updatedElo).reduce((acc, player, index) => {
      acc[player] = index + 1
      return acc
    }, {})
    console.log('Player Rankings:', rankings)
  }

  return (
    <div className="leagueSettingsManager">
      <h3>Choose a Tournament Host</h3>
      <Paper className="paperContent">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <h4>Current Rankings</h4>
            {elo && (
              <ol>
                {Object.entries(elo).map(([player, score]) => (
                  <li key={player}>
                    {player}
                  </li>
                ))}
              </ol>
            )}
          </Grid>
          <Button variant="contained" color="primary" onClick={() => selectHost()}>
            Choose a Host
          </Button>
        </Grid>
      </Paper>
    </div>
  )
}