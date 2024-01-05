// eslint-disable-next-line no-unused-vars
import {useState, useEffect} from 'react'
import { Paper } from '@mui/material'
import { getScorecards } from '../../firebase'

export default function RoundManager(props) {
  const [rounds, setRounds] = useState([])
  useEffect(() => {
    getScorecards(props.league).then(res => {
      let temp = []
      for (const [key, value] of Object.entries(res)) {
       console.log(key, value) 
       temp.push(<p>{value.Course} - {value.Date}</p>)
      }
      setRounds(temp)
    })
  }, [props.league])

  return (
    <div className="roundManager">
      <h3>Edit Rounds</h3>
      <Paper sx={{padding: 3}}>
        {rounds}
      </Paper>
    </div>
  )
}