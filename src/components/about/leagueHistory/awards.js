import { TableContainer, Table, TableBody, TableCell, TableRow} from '@mui/material';

export default function Awards (awards) {

  return (
    <div>
      <h3>League Awards</h3>
      <TableContainer>
        <Table>
          <TableBody>
            {awards.awards.map((award) => {
              return (
                <TableRow key={award.award}>
                  <TableCell>{award.award}</TableCell>
                  <TableCell>{award.recipient}</TableCell>
                </TableRow> 
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};
