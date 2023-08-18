import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function HistoricalRankings (props) {
  const graph = []
  for (const x in props.eloGraph) {
    let data = {}
    data['course'] = props.eloGraph[x].course
    data['elo'] = props.eloGraph[x].holderElo
    data['date'] = props.eloGraph[x].date
    graph.push(data)
  }
  console.warn(graph)
  graph.sort((a,b) => {return new Date(a.date.substring(0,10)) - new Date(b.date.substring(0,10))})
  console.warn('graph2', graph)
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
          <Line type="monotone" dataKey="elo.alex" name="Alex" stroke="#8884d8" />
          <Line type="monotone" dataKey="elo.benton" name="Benton" stroke="green" />
          <Line type="monotone" dataKey="elo.greg" name="Greg" stroke="Goldenrod" />
          <Line type="monotone" dataKey="elo.jimmy" name="Jimmy"stroke="orange" />
          <Line type="monotone" dataKey="elo.lane" name="Lane" stroke="DarkOliveGreen" />
          <Line type="monotone" dataKey="elo.peter" name="Peter" stroke="BlueViolet" />
          <Line type="monotone" dataKey="elo.rob" name="Rob" stroke="chocolate" />
          <Line type="monotone" dataKey="elo.samir" name="Samir" stroke="dodgerBlue" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}