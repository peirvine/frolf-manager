// eslint-disable-next-line no-unused-vars
import {useState} from 'react'

export default function LeaguePlayersManager(props) {
  return (
    <div className="playerManager">
      <h3>Manage League Players</h3>
      <p>{props.league}</p>
    </div>
  )
}