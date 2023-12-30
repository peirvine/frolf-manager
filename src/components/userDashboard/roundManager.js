// eslint-disable-next-line no-unused-vars
import {useState} from 'react'

export default function RoundManager(props) {
  return (
    <div className="roundManager">
      <h3>Edit Rounds</h3>
      <p>{props.league}</p>
    </div>
  )
}