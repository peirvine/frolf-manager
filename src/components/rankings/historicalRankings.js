import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

import { getHistoricalRankingsFromGoogle } from '../../services/googleSheetsService';

export default function HistoricalRankings () {
  const [data, setData] = useState()
  useEffect(() => {
    getHistoricalRankingsFromGoogle().then((value) => {
      setData(value);
    })
  }, [setData])

  return (
    <div className="graph">
      <h3>Season ELO Ratings</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 50,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" interval={0} angle={-25} dy={10} />
          <YAxis domain={[875, 1150]}/>
          <Tooltip />
          <Legend verticalAlign="top" height={36} />
          <ReferenceLine y={1000} stroke="red" label="1000" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="alex" stroke="#8884d8" />
          <Line type="monotone" dataKey="benton" stroke="green" />
          <Line type="monotone" dataKey="greg" stroke="Goldenrod" />
          <Line type="monotone" dataKey="jimmy" stroke="orange" />
          <Line type="monotone" dataKey="lane" stroke="DarkOliveGreen" />
          <Line type="monotone" dataKey="peter" stroke="BlueViolet" />
          <Line type="monotone" dataKey="rob" stroke="chocolate" />
          <Line type="monotone" dataKey="samir" stroke="dodgerBlue" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}