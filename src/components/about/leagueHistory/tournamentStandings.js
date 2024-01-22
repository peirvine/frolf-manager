import './leagueHistory.scss'

export default function TournamentStandings(props) {
  let players = []

  // eslint-disable-next-line array-callback-return
  Object.entries(props.round).map(([key, value], i) => {
    value.Players.forEach((player) => {
      if (player.player !== "Par") {
        players.push({player: player.player, total: parseInt(player.total)})
      }
    })
  })

  const playerTotals = players.reduce((acc, curr) => {
    if (acc[curr.player]) {
      acc[curr.player] += curr.total;
    } else {
      acc[curr.player] = curr.total;
    }
    return acc;
  }, {});

  let playerArray = Object.keys(playerTotals)
    .map((player) => {
      return { player: player, total: playerTotals[player] };
    })

  // Check if player is in DNFList and update their total to "DNF"
  playerArray.forEach((player) => {
    if (props.data && props.data.includes(player.player)) {
      player.total = "DNF";
    }
  });

  playerArray.sort((a, b) => {
    if (a.total === "DNF" && b.total !== "DNF") {
      return 1;
    } else if (a.total !== "DNF" && b.total === "DNF") {
      return -1;
    } else {
      return a.total > b.total ? 1 : -1;
    }
  });
  

  return (
    <div>
      {playerArray.length === 0 ? (
        <div>Loading...</div>
      ) : (
        <>
          <h3>Tournament Standings</h3>
          <div className="podium">
            <div className="place place2">
              <span>
                {playerArray[1].player} ({playerArray[1].total})
              </span>
              2nd
            </div>
            <div className="place place1">
              <span>
                {playerArray[0].player} ({playerArray[0].total})
              </span>
              1st
            </div>
            <div className="place place3">
              <span>
                {playerArray[2].player} ({playerArray[2].total})
              </span>
              3rd
            </div>
          </div>
          <div className="standings">
            {playerArray.slice(3).map((player, i) => (
              <div key={i} className="player">
                {i+3}. {player.player} ({player.total})
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}