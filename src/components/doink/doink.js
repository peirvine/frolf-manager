/* eslint-disable array-callback-return */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react'
import { Collapse, Alert, TableContainer, Table, TableHead, TableRow, TableBody, TableCell, Autocomplete, TextField, Button } from '@mui/material'
import DoinkUser from './doinkUser'
import { auth, joinDoinkFund, getDoinkFundPlayers, getLeagueNames, getUserDataV2, getLeagueSettings, getDoinkExpenses, getDoinkSettings, joinDoinkFundV2 } from '../../firebase'
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
  const [maxDoink, setMaxDoink] = useState(50)
  const [joinDisabled, setJoinDisabled] = useState(false)
  const [user] = useAuthState(auth);

  const fetchData = async (id) => {
    const settings = await getLeagueSettings(id);
    if (!settings.doinkFund) return;
  
    const [players, expenses, maxDoink] = await Promise.all([
      getDoinkFundPlayers(id),
      getDoinkExpenses(id),
      getDoinkSettings(id),
    ]);
  
    let holder = 0;
    if (players) {
      Object.values(players).forEach(x => {
        holder += x.doinks;
        x.uid === user.uid && setUserRegistered(true);
      });
      setData(players)
    } else {
      setData([]);
    }

    setSumDoink(holder);
  
    if (expenses !== undefined) {
      setExpenses(expenses);
      let sum = 0;
      Object.entries(expenses).map(([key, value]) => {
        sum += value.amount;
      });
      setExpenseTotal(sum);
    } else {
      setExpenses([]);
      setExpenseTotal(0);
    }
  
    setMaxDoink(maxDoink);
  };
  
  useEffect(() => {
    const fetchOptionsAndData = async () => {
      const res = await buildOptions();
      if (res) {
        if (res.length > 1) {
          fetchData(res[0].id);
        } else {
          fetchData(res.id);
        }
      }
    };
  
    fetchOptionsAndData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const buildOptions = async () => {
    if (user !== null) {
      const userData = await getUserDataV2(user)
      const leagues = await getLeagueNames()
      if (userData.leagues.length > 1) {
        let optionsArray = []
        userData.leagues.forEach(x => {
          if (x.membershipStatus !== "Pending") {
            optionsArray.push({ label: leagues[x.id], id: x.id });
          }
        });
        if (optionsArray.length === 0) setJoinDisabled(true)
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
    fetchData(league.id)
  }

  const registerDoinkerV3 = (user) => {
    const data = {
      doinks: 0,
      name: user.displayName,
      uid: user.uid
    }

    joinDoinkFundV2(league, data).then((res) => {
      setAlertMessage(res.message)
      setVariant(res.variant)
      setOpen(true)
      setDisabled(true)
      fetchData(league)
    })
  }

  const handleUpdateSumDoink = (doinks) => {
    setSumDoink(sumDoink + doinks)
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
            sx={{ marginTop: 1 }}
            renderInput={(params) => <TextField {...params} label="Choose League" defaultValue={params[0]}/>}
            onChange={(event, newValue) => {
              handleChangeLeague(newValue);
            }}
          />
        ) : null
      }
      {user ? (
        <>
          {!userRegistered && (<Button variant="contained" disabled={disabled || joinDisabled} onClick={() => registerDoinkerV3(user)}>Register Me</Button>)}
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
                  // data.forEach(player => {
                  //   doinks.push(<DoinkUser player={player} user={user.uid} league={league} maxDoink={maxDoink} />)
                  // })
                  Object.entries(data).map(([key, value], i) =>  (
                    <DoinkUser key={key} player={value} user={user.uid} league={league} maxDoink={maxDoink} playerKey={key} handleUpdateSumDoink={handleUpdateSumDoink} />
                  ))
                )}
                {/* {doinks} */}
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
