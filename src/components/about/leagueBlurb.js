import { useLeague } from "../../context/leagueContext"

export function LeagueBlurb () {
  const { settings } = useLeague()

  return (
    <div>
      <pre
        style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', whiteSpace: 'pre-wrap' }}
      >{settings?.blurb}</pre>
    </div>
  )
}
