import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function HistoricalRankings (props) {
  let players = props.playersInLeague
  if (props.playersInLeague === undefined) {
    players = []
  }
  const graph = []
  for (const x in props.eloGraph) {
    let data = {}
    data['course'] = props.eloGraph[x].course
    data['elo'] = props.eloGraph[x].holderElo
    data['date'] = props.eloGraph[x].date
    graph.push(data)
  }
  graph.sort((a,b) => {return new Date(a.date.substring(0,10)) - new Date(b.date.substring(0,10))})

  const hexCharacters = [0,1,2,3,4,5,6,7,8,9,"A","B","C","D","E","F"]

  const getCharacter = index => {
    return hexCharacters[index]
  }

  const generateColor = () => {
    let hexColorRep = "#"

    for (let index = 0; index < 6; index++){
      const randomPosition = Math.floor ( Math.random() * hexCharacters.length ) 
        hexColorRep += getCharacter( randomPosition )
    }
	
	  return hexColorRep
  }

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
            const color = generateColor()
            return (
              <Line type="monotone" dataKey={"elo."+ player} name={player} stroke={color} />
            )
          })}
          {/* <Line type="monotone" dataKey="elo.alex" name="Alex" stroke="#8884d8" />
          <Line type="monotone" dataKey="elo.benton" name="Benton" stroke="green" />
          <Line type="monotone" dataKey="elo.greg" name="Greg" stroke="Goldenrod" />
          <Line type="monotone" dataKey="elo.jimmy" name="Jimmy"stroke="orange" />
          <Line type="monotone" dataKey="elo.lane" name="Lane" stroke="DarkOliveGreen" />
          <Line type="monotone" dataKey="elo.peter" name="Peter" stroke="BlueViolet" />
          <Line type="monotone" dataKey="elo.rob" name="Rob" stroke="chocolate" />
          <Line type="monotone" dataKey="elo.samir" name="Samir" stroke="dodgerBlue" /> */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}