import "./about.scss"
import LeagueHistoryHolder from "./leagueHistory/leagueHistoryHolder"
import LeagueGate from "../../context/LeagueGate"
import LeagueRules from "./leagueRules";
import { LeagueBlurb } from "./leagueBlurb";

export default function About () {
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
            <LeagueHistoryHolder />
          </div>
        </div>
      </LeagueGate>
    </div>
  )
}
