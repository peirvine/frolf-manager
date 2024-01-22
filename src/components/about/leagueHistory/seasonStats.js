import { TableContainer, Table, TableBody, TableCell, TableRow} from '@mui/material';

export default function SeasonStats (stats) {
  return (
    <div>
      <h3>Season Stats</h3>
      <TableContainer>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Number of Rounds</TableCell>
              <TableCell>{stats.numberOfRounds}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Most Played Course</TableCell>
              <TableCell>
                {stats.mostPlayedCourse.map(course => {
                  return <div>{course.course + " - " + course.count}</div>;
                })}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Hardest Course</TableCell>
              <TableCell>
                {stats && stats.hardestCourse.map(course => {
                  return <div>{course.course + " - " +  Math.round(course.highestStrokesPerHole * 10) /10}</div>;
                })}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Most Average Player</TableCell>
              <TableCell>
                {stats.mostAveragePlayer.map(player => {
                  return <div>{player.player + " - " + Math.round(player.elo * 10) / 10}</div>;
                })}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

