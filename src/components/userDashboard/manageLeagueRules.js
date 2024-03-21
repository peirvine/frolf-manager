import { useEffect, useState } from "react";
import { addLeagueRule, getLeagueRules, deleteLeagueRule } from "../../firebase";
import { Button, Table, TableHead, TableBody, TableContainer, TableCell, TableRow, TextField, FormControl, Snackbar, Alert, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";

export default function ManageLeagueRules ( props ) {
  const [rules, setRules] = useState()
  const [newRule, setNewRule] = useState('')
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertLevel, setAlertLevel] = useState('')

  useEffect(() => {
    getLeagueRules(props.league)?.then(res => {
      setRules(res || []);
    });
  }, [props.league]);

  const handleAddRule = () => {
    addLeagueRule(props.league, newRule).then(whoCares => {
      getLeagueRules(props.league)?.then(res => {
        setRules(res || []);
      });
      setAlertLevel(whoCares.code)
      setAlertMessage(whoCares.message)
      setAlertOpen(true)
    });
    setNewRule('')
  }

  const handleDeleteRule = (rule) => {
    deleteLeagueRule(props.league, rule).then(whoCares => {
      getLeagueRules(props.league)?.then(res => {
        setRules(res || []);
      });
      setAlertLevel(whoCares.code)
      setAlertMessage(whoCares.message)
      setAlertOpen(true)
    });
  }

  const buildTable = () => {
    let table = []
    if (Object.entries(rules).length !== 0) {
      for (const [key, value] of Object.entries(rules)) {
        table.push(
          <TableRow key={key}>
            <TableCell>{value}</TableCell>
            <TableCell>
              <Button color="error" onClick={() => handleDeleteRule(key)}>Delete</Button>
            </TableCell>
          </TableRow>
        )
      }
    }
    return table
  }

  return (
    <div>
      <h2>Manage League Rules</h2>
      <FormControl fullWidth>
        <TextField
          required
          margin="normal"
          id="outlined-required"
          label="League Rule"
          defaultValue={''}
          value={newRule}
          onChange={(e) => setNewRule(e.target.value)}
          style={{ marginBottom: 15}}
        />
        <Button variant="contained" size="large" onClick={() => handleAddRule()} style={{marginBottom: 15, marginTop: 15}}>Add League Rule</Button>
      </FormControl>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Rule</strong></TableCell>
              <TableCell><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {buildTable()}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar open={alertOpen}>
        <Alert
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setAlertOpen(false);
              }}
            >
              <Close fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
          severity={alertLevel}
          variant="filled"
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </div>
  )
}