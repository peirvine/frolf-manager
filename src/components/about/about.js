import "./about.scss"
import LeagueHistoryHolder from "./leagueHistory/leagueHistoryHolder"
import LeagueGate from "../../context/LeagueGate"
import LeagueRules from "./leagueRules";
import { LeagueBlurb } from "./leagueBlurb";
import { useFeatures } from "../../context/leagueData";
import LockedFeature from "../plans/lockedFeature";

export default function About () {
  const features = useFeatures()
  return (
    <div className="about">
      <h1>League History</h1>
      <LeagueGate>
        <div className="pageCard">
          <div className="aboutText">
            <LeagueBlurb />
          </div>
          <div className="leagueRules">
            <LeagueRules />
          </div>
          <div className="aboutHistory">
            <h3>Past Seasons</h3>
            {features.has("leagueHistory")
              ? <LeagueHistoryHolder />
              : <LockedFeature>League history is part of the Plus plan. Your past seasons are saved and will show again if you upgrade.</LockedFeature>}
          </div>
        </div>
      </LeagueGate>
    </div>
  )
}
