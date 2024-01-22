import { Table, TableBody, TableContainer } from "@mui/material";
import ScorecardTable from "../../scorecards/scorecardTable";

export default function TournamentResults(props) {
  const getCoursePar = (card) => {
    return card[card.map((e) => { return e.player; }).indexOf("Par")]
  }

  const sortCard = (card, coursePar) => {
    const newCard = card.filter(e => e.player !== "Par")
    const sortedCard = newCard.sort((a, b) =>  (a.total > b.total) ? 1 : ((b.total > a.total) ? -1 : 0))
    return [coursePar].concat(sortedCard)
  }

  return (
    <div>
      <h3>Tournament Results</h3>
      {Object.entries(props).map(([key, value], i) => {
        const coursePar = getCoursePar(value.Players)
        const sortedCard = sortCard(value.Players, coursePar)
        return (
          <div key={i}>
            <p className="courseName"><strong>{value.Course}</strong>: {value.Layout}</p>
            <TableContainer>
              <Table>
                <TableBody>
                  {sortedCard.map((x) => (
                    <ScorecardTable card={x} par={x.Par} coursePar={coursePar}/>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        );
      })}
    </div>
  );
}
