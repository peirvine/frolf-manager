import React, { useState } from 'react';
import { Button, TextField, Alert, Collapse, Backdrop, CircularProgress, Checkbox, FormControlLabel, Chip } from '@mui/material'
import { useLeague } from '../../context/leagueContext'
import { useLive } from '../../context/liveStore'
import LeagueGate from '../../context/LeagueGate'
import { createFutureRound, deleteFutureRound, updateFutureRound } from '../../firebase'
import { isOpen, isPastDeadline, lockRound, roundCards, submitRoundCard } from '../../services/futureRoundService'

import '../add/add.scss'

const formatDeadline = (ms) => new Date(ms).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

function RoundCard ({ id, round, league, user, isAdmin, onResult, setBusy }) {
  const [udisc, setUdisc] = useState("")
  const [handicapsApplied, setHandicapsApplied] = useState(false)
  const cards = roundCards(round)
  const open = isOpen(round)

  const status = open ? "Open" : isPastDeadline(round) && round.status === "open" ? "Deadline passed" : "Locked"
  const color = open ? "success" : "warning"

  const addCard = async () => {
    const res = await submitRoundCard(league, id, round, user, udisc, handicapsApplied)
    if (res.code === "success") { setUdisc(""); setHandicapsApplied(false) }
    onResult(res)
  }

  const lock = async () => {
    setBusy(true)
    try {
      onResult(await lockRound(league, id, round))
    } catch (err) {
      console.error("[lockRound] failed", err)
      onResult({code: "error", message: "Something went wrong scoring the round. Lock it again to carry on."})
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`Delete "${round.name}" and its ${cards.length} pending card(s)?`)) return
    onResult(await deleteFutureRound(league, id))
  }

  return (
    <section className="addCard">
      <h2>{round.name}</h2>
      <p className="addHint">
        <Chip size="small" label={status} color={color} sx={{ mr: 1 }} />
        {round.deadline ? `Cards due ${formatDeadline(round.deadline)}` : "No deadline"} · {cards.length} card{cards.length === 1 ? "" : "s"} added
      </p>
      {cards.length > 0 && (
        <ul className="addSteps">
          {cards.map(card => (
            <li key={card.key}>
              {card.course || "Card"} ({card.players} players) from {card.submittedByName || "a member"}
              {isAdmin && (
                <Button size="small" onClick={async () => onResult(await deleteFutureRound(league, id, card.key))}>Remove</Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {round.error && <Alert severity="error" sx={{ mb: 2 }}>{round.error}</Alert>}
      {open && (
        <div className="addForm">
          <TextField
            multiline
            minRows={3}
            maxRows={8}
            label="UDisc CSV Output"
            value={udisc}
            onChange={e => setUdisc(e.target.value)}
          />
          <FormControlLabel
            control={<Checkbox checked={handicapsApplied} onChange={e => setHandicapsApplied(e.target.checked)} />}
            label="Handicap applied"
          />
          <div className="addActions">
            <Button variant="contained" disabled={!udisc.trim()} onClick={addCard}>Add Card to Round</Button>
          </div>
        </div>
      )}
      {isAdmin && (
        <div className="addActions" style={{ marginTop: 14 }}>
          <Button variant="contained" color="warning" disabled={cards.length === 0} onClick={lock}>
            {round.status === "open" ? "Lock & Score Round" : "Try Scoring Again"}
          </Button>
          {round.deadline && round.status === "open" && (
            <Button variant="outlined" onClick={async () => onResult(await updateFutureRound(league, id, { deadline: null }))}>Remove Deadline</Button>
          )}
          <Button variant="outlined" color="error" onClick={remove}>Delete Round</Button>
        </div>
      )}
    </section>
  )
}

function NewRound ({ league, onResult }) {
  const [name, setName] = useState("")
  const [deadline, setDeadline] = useState("")

  const create = async () => {
    const when = deadline ? new Date(deadline).getTime() : null
    if (when !== null && (Number.isNaN(when) || when <= Date.now())) return onResult({code: "error", message: "The deadline must be in the future."})
    const res = await createFutureRound(league, { name: name.trim(), ...(when ? { deadline: when } : {}) })
    if (res.code === "success") { setName(""); setDeadline("") }
    onResult(res)
  }

  return (
    <section className="addCard">
      <h2>New Round</h2>
      <p className="addHint">Members add their cards until the deadline or until you lock the round. Locking scores every card.</p>
      <div className="addForm">
        <TextField required label="Round name" value={name} onChange={e => setName(e.target.value)} />
        <TextField
          label="Deadline (optional)"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
        />
        <div className="addActions">
          <Button variant="contained" disabled={!name.trim()} onClick={create}>Create Round</Button>
        </div>
      </div>
    </section>
  )
}

export default function FutureRounds () {
  const { leagueId: league, user, isLeagueAdmin, isSiteAdmin } = useLeague()
  const roundsSnap = useLive(league ? `${league}/futureRounds` : null)
  const [alert, setAlert] = useState(null)
  const [busy, setBusy] = useState(false)
  const isAdmin = isLeagueAdmin || isSiteAdmin

  const rounds = Object.entries(roundsSnap.value || {})
    // Scored rounds are done with and are on the scorecards page; a locked round that failed to score stays so it can be retried
    .filter(([, round]) => round && round.name && round.status !== "scored")
    // Open rounds first, then the rest newest first
    .sort(([, a], [, b]) => (isOpen(b) - isOpen(a)) || b.createdAt - a.createdAt)

  return (
    <div className="addScorecard">
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1, flexDirection: 'column', gap: 2 }}
        open={busy}
      >
        <CircularProgress color="inherit" />
        <p>Scoring cards and recalculating rankings… please don't close this page.</p>
      </Backdrop>
      <h1>Scheduled Rounds</h1>
      <LeagueGate>
        <div className="pageCard">
          <Collapse in={Boolean(alert)}>
            <Alert severity={alert?.code || 'info'} onClose={() => setAlert(null)} sx={{ mb: 2 }}>{alert?.message}</Alert>
          </Collapse>
          <div className="addGrid roundsGrid">
            {isAdmin && <NewRound league={league} onResult={setAlert} />}
            {rounds.length > 0 && (
              <div className="addColumn">
                {rounds.map(([id, round]) => (
                  <RoundCard key={id} id={id} round={round} league={league} user={user} isAdmin={isAdmin} onResult={setAlert} setBusy={setBusy} />
                ))}
              </div>
            )}
          </div>
          {rounds.length === 0 && roundsSnap.loaded && <p className="addIntro" style={{ marginTop: 20 }}>No rounds set up yet.</p>}
        </div>
      </LeagueGate>
    </div>
  )
}
