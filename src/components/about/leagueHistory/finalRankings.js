import { TableContainer, Table, TableBody, TableCell, TableRow} from '@mui/material';

export default function FinalRankings(rankings) {
  const sortedRankings = Object.entries(rankings.currentElo).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <h3>Final Rankings</h3>
      <TableContainer>
        <Table>
          <TableBody>
            {sortedRankings.map(([key, value]) => {
              return (
                <TableRow key={key}>
                  <TableCell>{key}</TableCell>
                  <TableCell>{Math.round(value * 10) / 10}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
