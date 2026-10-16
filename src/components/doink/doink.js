/* eslint-disable array-callback-return */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react'
import { Collapse, Alert, Autocomplete, TextField, Button } from '@mui/material'
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
  const [userLeagues, setUserLeagues] = useState([])
  const [user] = useAuthState(auth);
  // Admins can edit every player's doinks in the league they're viewing
  const isLeagueAdmin = userLeagues.some(x => x.id === league && x.isAdmin)

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
        // Amounts are saved from a text field, so they can be strings ("60"); adding those would concatenate
        sum += Number(value.amount) || 0;
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
      setUserLeagues(userData.leagues)
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

  const balance = sumDoink - expenseTotal

  return (
    <div className="doink">
      <h1>Doink Fund</h1>
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
            className="doinkLeaguePicker"
            options={optionArray}
            value={optionArray.find(option => option.id === league) || null}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            sx={{ marginTop: 1, marginBottom: 2, maxWidth: 360 }}
            renderInput={(params) => <TextField {...params} label="Choose League" defaultValue={params[0]}/>}
            onChange={(event, newValue) => {
              handleChangeLeague(newValue);
            }}
          />
        ) : null
      }
      {user ? (
        <>
          {!userRegistered && (
            <section className="doinkCard doinkJoin">
              <div>
                <strong>You're not in the doink fund yet</strong>
                <small>Join to track your own doinks for this league.</small>
              </div>
              <Button variant="contained" disabled={disabled || joinDisabled} onClick={() => registerDoinkerV3(user)}>Join the Doink Fund</Button>
            </section>
          )}
          <div className="doinkTiles">
            <div className="doinkTile">
              <span className="doinkLabel">Collected</span>
              <strong>${sumDoink}</strong>
              <small>{sumDoink} {sumDoink === 1 ? "doink" : "doinks"}</small>
            </div>
            <div className="doinkTile">
              <span className="doinkLabel">Spent</span>
              <strong>${expenseTotal}</strong>
              <small>{Object.keys(expenses).length} {Object.keys(expenses).length === 1 ? "debit" : "debits"}</small>
            </div>
            <div className={`doinkTile ${balance < 0 ? "negative" : "balance"}`}>
              <span className="doinkLabel">Balance</span>
              <strong>{balance < 0 ? "-" : ""}${Math.abs(balance)}</strong>
              <small>left in the fund</small>
            </div>
          </div>
          <div className="doinkGrid">
            <section className="doinkCard">
              <h3>Players</h3>
              <small className="doinkCap">$1 per doink, up to ${maxDoink} per player each season</small>
              {data && Object.keys(data).length > 0 ? (
                <ul className="doinkPlayers">
                  {Object.entries(data).map(([key, value]) => (
                    <DoinkUser key={key} player={value} user={user.uid} league={league} maxDoink={maxDoink} isAdmin={isLeagueAdmin} playerKey={key} handleUpdateSumDoink={handleUpdateSumDoink} />
                  ))}
                </ul>
              ) : (
                <i>No one has joined the doink fund yet</i>
              )}
            </section>
            <section className="doinkCard">
              <h3>Doink Debits</h3>
              {Object.keys(expenses).length > 0 ? (
                <ul className="doinkDebits">
                  {Object.entries(expenses).map(([key, value]) => (
                    <li key={key}>
                      <span>{value.expense}</span>
                      <strong>${value.amount}</strong>
                    </li>
                  ))}
                  <li className="doinkDebitsTotal">
                    <span>Total spent</span>
                    <strong>${expenseTotal}</strong>
                  </li>
                </ul>
              ) : (
                <i>Nothing has been spent yet</i>
              )}
            </section>
          </div>
        </>
      ) : (
        <section className="doinkCard">Please log in to see the doink fund.</section>
      )}
      <section className="doinkCard aboutDoinks">
        <h3>Doink Fund Rules</h3>
        <p>In a disc golf game, if a player's throw hits a tree and goes backwards, landing behind the middle of the tree parallel to the tee box, it is considered a "doink". The throw must originate from a tee box or fairway, and the disc must hit the trunk or major limb of the tree, which is predominantly vertical in nature. It's important to note that if the disc hits the ground first and then hits a tree, it does not count as a doink. The sound of the disc hitting the tree is a crucial factor in determining whether it's a doink or not.</p>

        <p>If a player's throw qualifies as a doink, they must contribute $1 to the Doink Fund. However, there is a maximum contribution limit of $50 per player per season. If the throw is deemed not to be a doink by a majority of witnesses (who must have seen or heard the alleged doink), then the player is exempt from contributing to the fund. It should be noted that if a player's throw lands in the woods past the first row of trees, it's unlikely to be a doink, and the Doink Fund rule does not apply.</p>

        <h3>What do we do with the Doink Fund?</h3>
        <p>Funds will go to the Couples BBQ first, then to a slush fund to pay for Pay-To-Play courses and potentially beer. Players will settle up their current balances before the Couples Tournament and before the end of the season.</p>
      </section>
    </div>
  )
}
