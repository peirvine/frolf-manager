import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { colorArray } from './colorArray'

export default function HistoricalRankings (props) {
  console.log(props)
  let players = props.playersInLeague
  if (props.playersInLeague === undefined) {
    players = []
  }
  let i = 0
  const graph = []
  for (const x in props.eloGraph) {
    let data = {}
    data['course'] = props.eloGraph[x].course
    data['elo'] = props.eloGraph[x].holderElo
    data['date'] = props.eloGraph[x].date
    graph.push(data)
  }
  graph.sort((a,b) => {return new Date(a.date.substring(0,10)) - new Date(b.date.substring(0,10))})

  return (
    <div className="graph">
      <h3>Season ELO Ratings</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          width={500}
          height={300}
          data={graph}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 50,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="course" interval={0} angle={-25} dy={10} />
          <YAxis domain={[875, 1150]}/>
          <Tooltip />
          <Legend verticalAlign="top" height={36} />
          <ReferenceLine y={1000} stroke="red" label="1000" strokeDasharray="3 3" />
          {players.map(player => {
            const color = colorArray[i]
            i += 1
            return (
              <Line type="monotone" dataKey={"elo."+ player} name={player} stroke={color} />
            )
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}