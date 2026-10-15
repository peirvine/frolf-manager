import { Button } from '@mui/material'
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
        const currentElo = await getCurrentElo(leagueID, settings.currentSeason)
        const sortedElo = Object.entries(currentElo || {})
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
    } else {
      console.error('Invalid player name or player does not exist in the rankings.')
    }
    // The host selection result was only ever logged; nothing consumes it yet
  }

  return (
    <div className="leagueSettingsManager">
      <section className="manageCard">
        <h3>Choose a Tournament Host</h3>
        <h4>Current Rankings</h4>
        {elo && (
          <ol className="rankedList">
            {Object.entries(elo).map(([player]) => (
              <li key={player}>{player}</li>
            ))}
          </ol>
        )}
        <div className="manageActions" style={{ marginTop: 16 }}>
          <Button variant="contained" color="primary" onClick={() => selectHost()}>
            Choose a Host
          </Button>
        </div>
      </section>
    </div>
  )
}
