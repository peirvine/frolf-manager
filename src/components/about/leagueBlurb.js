import { useLeague } from "../../context/leagueContext"
import { useFeatures } from "../../context/leagueData"

export function LeagueBlurb () {
  const { settings } = useLeague()
  const features = useFeatures()

  if (!features.has("customRules")) return null

  return (
    <div>
      <pre
        style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', whiteSpace: 'pre-wrap' }}
      >{settings?.blurb}</pre>
    </div>
  )
}
