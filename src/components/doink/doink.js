/* eslint-disable array-callback-return */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react'
import { Collapse, Alert, TableContainer, Table, TableHead, TableRow, TableBody, TableCell, Autocomplete, TextField, Button } from '@mui/material'
import DoinkUser from './doinkUser'
import { auth, joinDoinkFund, getDoinkFundPlayers, getLeagueNames, getUserDataV2, getLeagueSettings, getDoinkExpenses, getDoinkSettings } from '../../firebase'
import { useAuthState } from "react-firebase-hooks/auth";

import './doink.scss'

export default function Doink() {
  const [data, setData] = useState()
  const [userRegistered, setUserRegistered] = useState()
  const [open, setOpen] = useState(false)
  const [variant, setVariant] = useState('info')
  const [alertMessage, setAlertMessage] = useState('')
  const [sumDoink, setSumDoink] = useState(0)
  const [optionArray, setOptionArray] = useState([])
  const [league, setLeague] = useState()
  const [expenses, setExpenses] = useState({})
  const [expenseTotal, setExpenseTotal] = useState(0)
  const [disabled, setDisabled] = useState(false)
  const [render, setRender] = useState('')
  const [maxDoink, setMaxDoink] = useState(50)
  const [user] = useAuthState(auth);
  let doinks = []

  useEffect(() => {
    buildOptions().then(res => {
      if (res) {
        if (res.length > 1) {
          getLeagueSettings(res[0].id).then(settings => {
            if (settings.doinkFund) {
              getDoinkFundPlayers(res[0].id).then(res2 => {
                let holder = 0
                let users = []
                if (res2) {
                  setData(res2)
                  res2.forEach(x => {
                    holder += x.doinks
                    users.push(x.name)
                  })
                } else {
                  setData([])
                }
                setUserRegistered(users.indexOf(user.displayName) > -1)
                setSumDoink(holder)
              })
              getDoinkExpenses(res[0].id).then(expensesRes => {
                if (expensesRes !== undefined) {
                  setExpenses(expensesRes)
                  let sum = 0
                  Object.entries(expenses).map(([key, value], i) => {
                    sum += value.amount
                  })
                  setExpenseTotal(sum)
                } else {
                  setExpenses([])
                  setExpenseTotal(0)
                }
              })
            }
          })
          getDoinkSettings(res[0].id).then(
            res => {
              setMaxDoink(res)
            }
          )
        } else {
          getLeagueSettings(res.id).then(settings => {
            if (settings.doinkFund) {
              getDoinkFundPlayers(res.id).then(res2 => {
                let holder = 0
                let users = []
                if (res2) {
                  setData(res2)
                  res2.forEach(x => {
                    holder += x.doinks
                    users.push(x.name)
                  })
                } else {
                  setData([])
                }
                setUserRegistered(users.indexOf(user.displayName) > -1)
                setSumDoink(holder)
                getDoinkExpenses(res.id).then(expensesRes => {
                  if (expensesRes !== undefined) {
                    setExpenses(expensesRes)
                    let sum = 0
                    Object.entries(expenses).map(([key, value], i) => {
                      sum += value.amount
                    })
                    setExpenseTotal(sum)
                  } else {
                    setExpenses([])
                    setExpenseTotal(0)
                  }
                })
              })
              getDoinkSettings(res.id).then(
                res => {
                  setMaxDoink(res)
                }
              )
            }
          })
        }
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const buildOptions = async () => {
    if (user !== null) {
      const userData = await getUserDataV2(user)
      const leagues = await getLeagueNames()
      if (userData.leagues.length > 1) {
        let optionsArray = []
        userData.leagues.map(x => optionsArray.push({ label: leagues[x.id], id: x.id}))
        setOptionArray(optionsArray)
        setLeague(userData.leagues[0].id)
        return optionsArray
      } else {
        setLeague(userData.leagues[0].id)
        return userData.leagues[0]
      }
    }
  }

  const handleChangeLeague = async league => {
    setLeague(league.id)
    getDoinkFundPlayers(league.id).then(res2 => {
      if (res2) {
        setData(res2);
        const holder = res2.reduce((sum, x) => sum + x.doinks, 0);
        const users = res2.map(x => x.name);
        setUserRegistered(users.includes(user.displayName));
        setSumDoink(holder);
      } else {
        setData([]);
        setUserRegistered(false);
        setSumDoink(0);
      }
    })
  }

  const registerDoinkerV2 = (user) => {
    getDoinkFundPlayers(league).then(res => {
      let resHolder
      if (res) {
        resHolder = res
        resHolder.push({
          doinks: 0,
          name: user.displayName,
          uid: user.uid
        })
      } else {
        resHolder = [{
          doinks: 0,
          name: user.displayName,
          uid: user.uid
        }]
      }
      
      joinDoinkFund(league, resHolder).then(() => {
        setDisabled(true)
      })
    })
  }

  return (
    <div className="doink">
      <h1>Doink Tracker</h1>
      <Collapse in={open}>
        <Alert severity={variant} onClose={() => setOpen(false)}>
          {alertMessage}
        </Alert>
      </Collapse>
      {optionArray.length > 1 ? 
        (
          <Autocomplete
            disablePortal
            disableClearable
            id="combo-box-demo"
            options={optionArray}
            sx={{ marginTop: 1, width: "25%" }}
            renderInput={(params) => <TextField {...params} label="Choose League" defaultValue={params[0]}/>}
            onChange={(event, newValue) => {
              handleChangeLeague(newValue);
            }}
          />
        ) : null
      }
      {render}
      {user ? (
        <>
          {userRegistered && (<Button variant="contained" disabled={disabled} onClick={() => registerDoinkerV2(user)}>Register Me</Button>)}
          <TableContainer size="medium" className="doinkTable">
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell align="center">Player</TableCell>
                  <TableCell align="center">Doinks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data && (
                  data.forEach(player => {
                    doinks.push(<DoinkUser player={player} user={user.uid} league={league} maxDoink={maxDoink} />)
                  })
                )}
                {doinks}
              </TableBody>    
            </Table>    
          </TableContainer>
          <TableContainer size="medium" className="doinkTable">
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell align="center">Total Doinks: {sumDoink}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell align="center">Doink Debits</TableCell>
                </TableRow>
              </TableHead>
            </Table>
            <Table>
              <TableBody>
                {Object.entries(expenses).map(([key, value], i) => {
                  return (
                    <TableRow key={key}>
                      <TableCell align="right">{value.expense}</TableCell>
                      <TableCell align="left">${value.amount}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell align="center">Remaining Doink Balance: ${sumDoink - expenseTotal}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <p>Please Log in</p>
      )}
      <div className="aboutDoinks">
        <h2>Doink Fund Rules</h2>
        <p>In a disc golf game, if a player's throw hits a tree and goes backwards, landing behind the middle of the tree parallel to the tee box, it is considered a "doink". The throw must originate from a tee box or fairway, and the disc must hit the trunk or major limb of the tree, which is predominantly vertical in nature. It's important to note that if the disc hits the ground first and then hits a tree, it does not count as a doink. The sound of the disc hitting the tree is a crucial factor in determining whether it's a doink or not.</p>

        <p>If a player's throw qualifies as a doink, they must contribute $1 to the Doink Fund. However, there is a maximum contribution limit of $50 per player per season. If the throw is deemed not to be a doink by a majority of witnesses (who must have seen or heard the alleged doink), then the player is exempt from contributing to the fund. It should be noted that if a player's throw lands in the woods past the first row of trees, it's unlikely to be a doink, and the Doink Fund rule does not apply.</p>

        <h2>What do we do with the Doink Fund?</h2>
        <p>Funds will go to the Couples BBQ first, then to a slush fund to pay for Pay-To-Play courses and potentially beer. Players will settle up their current balances before the Couples Tournament and before the end of the season.</p>
      </div>
    </div>
  )
}
