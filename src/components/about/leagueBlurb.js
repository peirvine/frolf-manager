import { useEffect, useState } from "react"
import { getLeagueSettings } from "../../firebase"

export function LeagueBlurb (props) {
  const [blurb, setBlurb] = useState('')

  useEffect(() => {
    getLeagueSettings(props.league).then(res => {
      setBlurb(res.blurb)
    })
  }, [props.league])

  return (
    <div>
      <pre
        style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', whiteSpace: 'pre-wrap' }}
      >{blurb}</pre>
    </div>
  )
}