/* eslint-disable array-callback-return */
/* eslint-disable react-hooks/exhaustive-deps */
// eslint-disable-next-line no-unused-vars
import {useState, useEffect} from 'react'
import { TextField, Button, FormControl, Snackbar, Alert, IconButton, InputLabel, OutlinedInput, InputAdornment, Table, TableHead, TableBody, TableContainer, TableCell, TableRow, Dialog, DialogActions, DialogTitle, DialogContent, DialogContentText } from '@mui/material'
import { Close } from '@mui/icons-material'
import { getLeagueSettings, updateDoinkSettings, addDoinkExpense, getDoinkExpenses, initDoinkFund, updateLeagueSettings, resetDoinkFund, deleteDoinkExpense, editDoinkExpense, getDoinkSettings, getDoinkFundPlayers } from '../../firebase'
import DoinkUser from '../doink/doinkUser'

export default function DoinkManager(props) {
  const [doinkEnabled, setDoinkEnabled] = useState(false)
  const [maxDoink, setMaxDoink] = useState(50)
  const [alertOpen, setAlertOpen] = useState(false)
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState(0)
  // eslint-disable-next-line no-unused-vars
  const [alertMessage, setAlertMessage] = useState("")
  const [alertLevel, setAlertLevel] = useState("info")
  const [expenseItems, setExpenseItems] = useState([])
  const [newExpense, setNewExpense] = useState('')
  const [newAmount, setNewAmount] = useState(0)
  const [ dialogOpen, setDialogOpen ] = useState(false)
  const [key, setKey] = useState('')
  const [render, setRender] = useState('')
  const [doinkItems, setDoinkItems] = useState([])

  const handleDoinkUpdate = () => {
    updateDoinkSettings(props.league, maxDoink).then(res => {
      setAlertOpen(true)
      setAlertLevel(res.code)
      setAlertMessage(res.message)
    })
  }

  useEffect(() => {
    getLeagueSettings(props.league).then(
      res => {
        if (res) {
          setDoinkEnabled(res.doinkFund)
        }
      }
    )

    getDoinkSettings(props.league).then(
      res => {
        setMaxDoink(res)
      }
    )

    getDoinkExpenses(props.league).then(
      res => {
        if (res) {
          let returnObj = []
          for (const [key, value] of Object.entries(res)) {
            returnObj.push(
              <TableRow key={key}>
                <TableCell>{value.expense}</TableCell>
                <TableCell>${value.amount}</TableCell>
                <TableCell>
                  <Button variant="contained" onClick={() => handleExpenseEdit(key, value)} style={{ marginRight: 15}}>Edit</Button>
                  <Button variant="contained" color="error" onClick={() => handleDeleteExpense(key)}>Delete</Button>
                </TableCell>
              </TableRow>
            )
          }
          setExpenseItems(returnObj)
        }
      }
    )

    getDoinkFundPlayers(props.league).then(
      res => {
        if (res) {
          setDoinkItems(Object.entries(res))
        }
      }
    )
  }, [props.league, render])

  // const handleDoinkChange = (name, value) => {
  //   let tempDoink = [...doinkValues]
  //   console.warn('fisrt tempDoink', doinkValues)
  //   tempDoink.forEach((item) => {
  //     console.warn('item', item)
  //     if (item.name === name) {
  //       item.doinks = parseInt(value);
  //     }
  //   });
  //   console.warn('tempDoink', tempDoink)
  //   setDoinkValues(tempDoink);
  // }

  const enableDoinkFund = () => {
    const payload = {
      id: props.league,
      doinkObj: {
        players: [],
        expenses: [],
        maxDoink: 50,
      }
    }

    initDoinkFund(payload).then(res => {
      setAlertOpen(true)
      setAlertLevel(res.code)
      setAlertMessage(res.message)
      if (res.code === "success") {
        setDoinkEnabled(true)
        getLeagueSettings(props.league).then(res => {
          const settings = {
            ...res,
            doinkFund: true,
          }
          updateLeagueSettings(props.league, settings)
        })
      }
    })
  }

  const handleLeagueExpense = () => {
    const expenseObj = {
      expense: desc,
      amount: amount,
      date: Date(Date.now()).toString()
    }

    addDoinkExpense(props.league, expenseObj).then(res => {
      setAlertOpen(true)
      setAlertLevel(res.code)
      setAlertMessage(res.message)
      setDesc('')
      setAmount(0)
    })
    setRender(render.concat(' '))
  }

  const handleLeagueDoinkReset = () => {
    //todo update this to not nuke users, but reset values to 0
    const payload = {
      id: props.league,
      doinkObj: {
        players: [],
        expenses: [],
        maxDoink,
      }
    }
    resetDoinkFund(payload).then(res => {
      setAlertOpen(true)
      setAlertLevel(res.code)
      setAlertMessage(res.message)
    })
    setRender(render.concat(' '))
  }

  const handleExpenseEdit = (key, value) => {
    setNewAmount(value.amount)
    setNewExpense(value.expense)
    setDialogOpen(true)
    setKey(key)
  }

  const submitEdit = () => {
    const newValue = {
      expense: newExpense,
      amount: newAmount,
    }
    editDoinkExpense(props.league, key, newValue).then(res => {
      setDialogOpen(false)
      setAlertOpen(true)
      setAlertLevel(res.code)
      setAlertMessage(res.message)
    })
    setRender(render.concat(' '))
  }

  const handleDeleteExpense = key => {
    deleteDoinkExpense(props.league, key).then(res => {
      setAlertOpen(true)
      setAlertLevel(res.code)
      setAlertMessage(res.message)
    })
    setRender(render.concat(' '))
  }

  return (
    <div className="doinkManager">
      {render}
      <Snackbar open={alertOpen} autoHideDuration={6000} onClose={(e, reason) => { if (reason !== 'clickaway') setAlertOpen(false) }}>
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
      {doinkEnabled ? (
        <>
          <div className="manageGrid">
            <section className="manageCard">
              <h3>Doink Limit</h3>
              <div className="manageForm">
                <TextField
                  required
                  id="outlined-required"
                  label="Max Number of Doinks"
                  defaultValue={maxDoink}
                  onChange={(e) => setMaxDoink(e.target.value)}
                />
                <Button variant="contained" onClick={() => handleDoinkUpdate()}>Update Doink Limit</Button>
              </div>
            </section>
            <section className="manageCard">
              <h3>Add League Expense</h3>
              <div className="manageForm">
                <TextField
                  required
                  id="expense-description"
                  label="League Expense Description"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
                <FormControl fullWidth>
                  <InputLabel htmlFor="outlined-adornment-amount">Amount</InputLabel>
                  <OutlinedInput
                    id="outlined-adornment-amount"
                    startAdornment={<InputAdornment position="start">$</InputAdornment>}
                    label="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </FormControl>
                <Button variant="contained" onClick={() => handleLeagueExpense()}>Add League Expense</Button>
              </div>
            </section>
          </div>
          <section className="manageCard">
            <h3>Current Doinks</h3>
            {doinkItems.length > 0 ? (
              <ul className="doinkPlayers">
                {doinkItems.map(([key, value]) => (
                  <DoinkUser playerKey={key} key={key} player={value} league={props.league} maxDoink={Number(maxDoink)} isAdmin={true} />
                ))}
              </ul>
            ) : (
              <i>No one has joined the doink fund yet</i>
            )}
          </section>
          <section className="manageCard">
            <h3>Current Expenses</h3>
            <TableContainer>
              <Table className="manageTable">
                <TableHead>
                  <TableRow>
                    <TableCell>Expense</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenseItems}
                </TableBody>
              </Table>
            </TableContainer>
          </section>
          <section className="manageCard dangerCard">
            <div>
              <h3>Reset Doink Fund</h3>
              <p>Is the season over? Reset your doink fund here. This action cannot be undone.</p>
            </div>
            <Button variant="outlined" color="error" onClick={() => handleLeagueDoinkReset()}>Reset Doink Balance</Button>
          </section>
        </>
      ) : (
        <section className="manageCard">
          <h3>Doink Fund</h3>
          <div className="aboutDoinks">
            <h4>Doink Fund Rules</h4>
            <p>In a disc golf game, if a player's throw hits a tree and goes backwards, landing behind the middle of the tree parallel to the tee box, it is considered a "doink". The throw must originate from a tee box or fairway, and the disc must hit the trunk or major limb of the tree, which is predominantly vertical in nature. It's important to note that if the disc hits the ground first and then hits a tree, it does not count as a doink. The sound of the disc hitting the tree is a crucial factor in determining whether it's a doink or not.</p>

            <p>If a player's throw qualifies as a doink, they must contribute $1 to the Doink Fund. However, there is a maximum contribution limit that is set by the leagues, it defaults to $50 per player per season. If the throw is deemed not to be a doink by a majority of witnesses (who must have seen or heard the alleged doink), then the player is exempt from contributing to the fund. It should be noted that if a player's throw lands in the woods past the first row of trees, it's unlikely to be a doink, and the Doink Fund rule does not apply.</p>

            <h4>What do we do with the Doink Fund?</h4>
            <p>Funds will go to the Couples BBQ first, then to a slush fund to pay for Pay-To-Play courses and potentially beer. Players will settle up their current balances before the Couples Tournament and before the end of the season.</p>
          </div>
          <Button variant="contained" size="large" onClick={() => enableDoinkFund(props.league)}>Enable Doink Fund</Button>
        </section>
      )}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Update Expense
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <FormControl fullWidth>
              <TextField
                required
                margin="normal"
                id="outlined-required"
                label="League Expense Description"
                onChange={(e) => setNewExpense(e.target.value)}
                style={{ marginBottom: 15}}
                defaultValue={newExpense}
              />
              <FormControl fullWidth>
                <InputLabel htmlFor="outlined-adornment-amount">Amount</InputLabel>
                <OutlinedInput
                  id="outlined-adornment-amount"
                  startAdornment={<InputAdornment position="start">$</InputAdornment>}
                  label="Amount"
                  defaultValue={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                />
              </FormControl>
            </FormControl>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="error" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="info" onClick={() => submitEdit()}>Update</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}