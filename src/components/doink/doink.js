import { useState, useMemo } from 'react'
import { Collapse, Alert, Button } from '@mui/material'
import DoinkUser from './doinkUser'
import { joinDoinkFundV2 } from '../../firebase'
import { useLeague } from '../../context/leagueContext'
import { useDoinkFund, useFeatures } from '../../context/leagueData'
import LockedFeature from '../plans/lockedFeature'
import LeagueGate from '../../context/LeagueGate'

import './doink.scss'

export default function Doink() {
  const { user, leagueId: league, settings, isLeagueAdmin } = useLeague()
  const { players: data, expenses, maxDoink } = useDoinkFund()
  const features = useFeatures()
  const [open, setOpen] = useState(false)
  const [variant, setVariant] = useState('info')
  const [alertMessage, setAlertMessage] = useState('')
  const [disabled, setDisabled] = useState(false)

  const userRegistered = Object.values(data).some(player => player?.uid === user?.uid)
  // Amounts are saved from a text field, so they can be strings ("60"); adding those would concatenate
  const sumDoink = useMemo(() => Object.values(data).reduce((sum, player) => sum + (Number(player.doinks) || 0), 0), [data])
  const expenseTotal = useMemo(() => Object.values(expenses).reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0), [expenses])

  const registerDoinkerV3 = (user) => {
    if (!league) return
    const data = {
      doinks: 0,
      name: user.displayName,
      uid: user.uid
    }

    joinDoinkFundV2(league, data).then((res) => {
      setAlertMessage(res.message)
      setVariant(res.variant)
      setOpen(true)
      setDisabled(true)
    })
  }

  const balance = sumDoink - expenseTotal

  return (
    <div className="doink">
      <h1>Doink Fund</h1>
      <LeagueGate>
      <Collapse in={open}>
        <Alert severity={variant} onClose={() => setOpen(false)}>
          {alertMessage}
        </Alert>
      </Collapse>
      {!features.has("doinkFund") ? (
        <LockedFeature>The doink fund is part of the Plus plan.</LockedFeature>
      ) : !settings?.doinkFund ? (
        <section className="doinkCard">This league doesn't use a doink fund.</section>
      ) : (
        <>
          {!userRegistered && (
            <section className="doinkCard doinkJoin">
              <div>
                <strong>You're not in the doink fund yet</strong>
                <small>Join to track your own doinks for this league.</small>
              </div>
              <Button variant="contained" disabled={disabled} onClick={() => registerDoinkerV3(user)}>Join the Doink Fund</Button>
            </section>
          )}
          <div className="doinkTiles">
            <div className="doinkTile">
              <span className="doinkLabel">Collected</span>
              <strong>${sumDoink}</strong>
              <small>{sumDoink} {sumDoink === 1 ? "doink" : "doinks"}</small>
            </div>
            <div className="doinkTile">
              <span className="doinkLabel">Spent</span>
              <strong>${expenseTotal}</strong>
              <small>{Object.keys(expenses).length} {Object.keys(expenses).length === 1 ? "debit" : "debits"}</small>
            </div>
            <div className={`doinkTile ${balance < 0 ? "negative" : "balance"}`}>
              <span className="doinkLabel">Balance</span>
              <strong>{balance < 0 ? "-" : ""}${Math.abs(balance)}</strong>
              <small>left in the fund</small>
            </div>
          </div>
          <div className="doinkGrid">
            <section className="doinkCard">
              <h3>Players</h3>
              <small className="doinkCap">$1 per doink, up to ${maxDoink} per player each season</small>
              {data && Object.keys(data).length > 0 ? (
                <ul className="doinkPlayers">
                  {Object.entries(data).map(([key, value]) => (
                    <DoinkUser key={key} player={value} user={user.uid} league={league} maxDoink={maxDoink} isAdmin={isLeagueAdmin} playerKey={key} />
                  ))}
                </ul>
              ) : (
                <i>No one has joined the doink fund yet</i>
              )}
            </section>
            <section className="doinkCard">
              <h3>Doink Debits</h3>
              {Object.keys(expenses).length > 0 ? (
                <ul className="doinkDebits">
                  {Object.entries(expenses).map(([key, value]) => (
                    <li key={key}>
                      <span>{value.expense}</span>
                      <strong>${value.amount}</strong>
                    </li>
                  ))}
                  <li className="doinkDebitsTotal">
                    <span>Total spent</span>
                    <strong>${expenseTotal}</strong>
                  </li>
                </ul>
              ) : (
                <i>Nothing has been spent yet</i>
              )}
            </section>
          </div>
        </>
      )}
      <section className="doinkCard aboutDoinks">
        <h3>Doink Fund Rules</h3>
        <p>In a disc golf game, if a player's throw hits a tree and goes backwards, landing behind the middle of the tree parallel to the tee box, it is considered a "doink". The throw must originate from a tee box or fairway, and the disc must hit the trunk or major limb of the tree, which is predominantly vertical in nature. It's important to note that if the disc hits the ground first and then hits a tree, it does not count as a doink. The sound of the disc hitting the tree is a crucial factor in determining whether it's a doink or not.</p>

        <p>If a player's throw qualifies as a doink, they must contribute $1 to the Doink Fund. However, there is a maximum contribution limit of $50 per player per season. If the throw is deemed not to be a doink by a majority of witnesses (who must have seen or heard the alleged doink), then the player is exempt from contributing to the fund. It should be noted that if a player's throw lands in the woods past the first row of trees, it's unlikely to be a doink, and the Doink Fund rule does not apply.</p>

        <h3>What do we do with the Doink Fund?</h3>
        <p>Funds will go to the Couples BBQ first, then to a slush fund to pay for Pay-To-Play courses and potentially beer. Players will settle up their current balances before the Couples Tournament and before the end of the season.</p>
      </section>
      </LeagueGate>
    </div>
  )
}
