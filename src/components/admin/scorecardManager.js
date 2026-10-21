import { useEffect, useState } from 'react'
import { Button, Chip, Skeleton } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { getAllLeaguesForAdmin } from '../../firebase'
import RoundManager from '../userDashboard/roundManager'

// Every league, whether or not it takes new members; picking one opens that league's current season scorecards to
// edit or delete (the same tools league admins have)
export default function ScorecardManager () {
  const [leagues, setLeagues] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => { getAllLeaguesForAdmin().then(all => setLeagues(all || [])) }, [])

  if (!leagues) return <section className="manageCard"><Skeleton variant="rounded" animation="wave" height={60} /></section>

  if (selected) {
    return (
      <>
        <section className="manageCard">
          <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => setSelected(null)}>All leagues</Button>
          <h3>{selected.name}</h3>
        </section>
        <RoundManager league={selected.id} />
      </>
    )
  }

  return (
    <section className="manageCard">
      <h3>Scorecards</h3>
      <p className="manageIntro">Pick a league to view and edit its current season's scorecards.</p>
      {leagues.length === 0 ? <i>No leagues yet</i> : (
        <ul className="manageList">
          {leagues.map(league => (
            <li key={league.id}>
              <div className="manageListMain">
                <div className="playerNames">
                  <strong>{league.name}</strong>
                </div>
                {league.info?.suspended && <Chip size="small" color="warning" label="Suspended" />}
              </div>
              <div className="manageActions">
                <Button size="small" variant="outlined" onClick={() => setSelected({ id: league.id, name: league.name })}>View scorecards</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
