import { RoundDetails } from "../../scorecards/roundList";

import '../../scorecards/scorecards.scss'

export default function TournamentResults(props) {
  return (
    <div>
      <h3>Tournament Results</h3>
      {Object.entries(props).map(([key, value], i) => (
        <div key={i}>
          <p className="courseName"><strong>{value.Course}</strong>: {value.Layout}</p>
          <RoundDetails round={value} />
        </div>
      ))}
    </div>
  );
}
