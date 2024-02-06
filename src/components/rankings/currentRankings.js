/* eslint-disable array-callback-return */
/* eslint-disable no-unused-vars */
import { useRef, useEffect, useState } from 'react'
import IndividualRankings from './individualRankings';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import SwitchAccessShortcutIcon from '@mui/icons-material/SwitchAccessShortcut';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import Chip from '@mui/material/Chip';
import Modal from '@mui/material/Modal';
import CloseIcon from '@mui/icons-material/Close';
import { Autocomplete, TextField } from '@mui/material';

import { toBlob } from 'html-to-image';
import { useAuthState } from 'react-firebase-hooks/auth';

import HistoricalRankings from './historicalRankings'

// import { getRankingsFromGoogle } from '../../services/googleSheetsService';
import { auth, getCurrentElo, getDelta, getEloGraphData, getUserDataV2, getLeagueNames, getLeagueSettings, getLeagueMembers, getElosOfAllPlayers } from '../../firebase'

import './rankings.scss'
// import { calculateElo, resetCurrentElo } from '../../services/eloService';
// import { mockCard } from '../../services/mockData';

export default function CurrentRankings () {
  const [user] = useAuthState(auth)
  const [rankings, setRankings] = useState()
  const [deltas, setDeltas] = useState()
  const imageRef = useRef(null);
  const [open, setOpen] = useState(false)
  const [optionArray, setOptionArray] = useState([])
  const [league, setLeague] = useState()
  const [userData, setUserData] = useState('')
  const [members, setMembers] = useState([])
  const [graphData, setGraphData] = useState({})
  const [playerEloHistoryRes, setPlayerEloHistoryRes] = useState([])
  // const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    if (user) {
      buildOptions().then(res => {
        if (res) {
          const leagueId = res.length > 1 ? res[0].id : res.id;
          getLeagueSettings(leagueId).then(settings => {
            Promise.all([
              getCurrentElo(leagueId, settings.currentSeason),
              getDelta(leagueId, settings.currentSeason),
              getEloGraphData(leagueId, settings.currentSeason),
              getLeagueMembers(leagueId).then(value => {
                const hold = value.map(async player => {
                  if (player) {
                    const dataObj = {
                      displayName: player.name,
                      uid: player.id,
                    };
                    const res = await getUserDataV2(dataObj);
                    return res.uDiscDisplayName;
                  }
                });
                return Promise.all(hold);
              }),
              getElosOfAllPlayers( settings.currentSeason, leagueId)
            ]).then(([rankings, deltas, graphData, members, playerEloHistory]) => {
              setRankings(rankings);
              setDeltas(deltas);
              setMembers(members);
              const graphObj = {
                eloGraph: graphData,
                playersInLeague: members
              };
              setGraphData(graphObj);
              setPlayerEloHistoryRes(playerEloHistory);
            });
          });
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const buildOptions = async () => {
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

  const handleChangeLeague = async league => {
    setLeague(league.id);
    const settings = await getLeagueSettings(league.id);
    const season = settings.currentSeason;
  
    const [rankings, deltas, graphData, members] = await Promise.all([
      getCurrentElo(league.id, season),
      getDelta(league.id, season),
      getEloGraphData(league.id, season),
      getLeagueMembers(league.id).then(async (value) => {
        const hold = await Promise.all(value.map(async player => {
          if (player) {
            const dataObj = {
              displayName: player.name,
              uid: player.id,
            };
            const res = await getUserDataV2(dataObj);
            return res.uDiscDisplayName;
          }
        }));
        setMembers(hold);
        return hold;
      })
    ]);
  
    setRankings(rankings);
    setDeltas(deltas);
  
    const graphObj = {
      eloGraph: graphData,
      playersInLeague: members
    };
  
    setGraphData(graphObj);
  };
  
  const getImage = async () => {
    const newFile = await toBlob(imageRef.current, { cacheBust: true });
    const data = {
      files: [
        new File([newFile], "frolf.png", {
          type: newFile.type
        })
      ],
      title: "Frolf",
      text: "Frolf"
    };
    try {
      if (!navigator.canShare(data)) {
        alert("Can't share, this is an error with the site sorry.");
      }
      await navigator.share(data);
    } catch (err) {
      // console.log(err);
    }
  }
   

  const handleShowStats = (userData) => {
    setUserData(userData)
    setOpen(true)
  }

  const getIcon = value => {
    const roundedValue = Math.round(value * 10) / 10
    if (roundedValue <= 1 && roundedValue >= -1) {
      return <Chip icon={<UnfoldMoreIcon className="changeIcon"/>} label={roundedValue} color="primary" variant="outlined" />
    } else if (roundedValue > 1 && roundedValue < 10 ) {
      return  <Chip icon={<KeyboardArrowUpIcon className="changeIcon" />} label={roundedValue} color="success" variant="outlined" />
    } else if (roundedValue >= 10 && roundedValue < 15 ) {
      return  <Chip icon={<KeyboardDoubleArrowUpIcon className="changeIcon" />} label={roundedValue} color="success" variant="outlined" />
    } else if (roundedValue >= 15) {
      return  <Chip icon={<SwitchAccessShortcutIcon className="changeIcon" />} label={roundedValue} color="success" variant="outlined" />
    } else if (roundedValue < -1 && roundedValue > -10 ) {
      return  <Chip icon={<KeyboardArrowDownIcon className="changeIcon" />} label={roundedValue} color="error" variant="outlined" />
    } else if (roundedValue <= -10 && roundedValue > -15 ) {
      return  <Chip icon={<KeyboardDoubleArrowDownIcon className="changeIcon" />} label={roundedValue} color="error" variant="outlined" />
    } else if (roundedValue <= -15) {
      return  <Chip icon={<TrendingDownIcon className="changeIcon" />} label={roundedValue} color="error" variant="outlined" />
    }
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const formatRankings = (passedRankings) => {
    let sorted = Object.entries(passedRankings).sort((a,b) => b[1]-a[1]).map(el=>el[0])
    let playerRankings = []
    let qualified = true
    sorted.map(x => {
      let numRounds = 0
      if (playerEloHistoryRes[x] !== undefined) {
        numRounds = playerEloHistoryRes[x].length
      }
      if (numRounds < 8) {
        qualified = false
      }
      playerRankings.push(
        <TableRow
          key={x}
          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
          // onClick={() => handleShowStats(player[0])}
        >
          <TableCell align="center">
            {capitalizeFirstLetter(x)} {qualified ? null : " - Not Qualified"}
          </TableCell>
          <TableCell align="center">{Math.round(passedRankings[x] * 10) /10}</TableCell>
          {deltas && (<TableCell align="center">{getIcon(deltas[x])}</TableCell>)}
        </TableRow>
      )
    })
    return playerRankings
  }

  return (
    <div className="currentRankings">
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div>
          <CloseIcon onClick={() => handleClose()} className="closeBtn"/>
          <IndividualRankings user={user}/>
        </div>
      </Modal>
      <h1>Current Rankings</h1>
      {optionArray.length > 1 ? (
        <Autocomplete
          disablePortal
          disableClearable
          id="combo-box-demo"
          options={optionArray}
          sx={{ marginTop: 1, marginBottom: 1 }}
          renderInput={(params) => <TextField {...params} label="Choose League" defaultValue={params[0]}/>}
          onChange={(event, newValue) => {
            handleChangeLeague(newValue);
          }}
        />) : null}
      <div ref={imageRef}>
        <TableContainer component={Paper} size="medium" className="rankingsTable">
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell align="center">Player</TableCell>
                <TableCell align="center">Rating</TableCell>
                <TableCell align="center">Rating Change</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rankings && (formatRankings(rankings))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      <div className="getImg">
        <Button variant="contained" onClick={() => getImage()}>Share Rankings</Button>
      </div>
      {/* todo fix the rendering issue when switching leagues */}
      <HistoricalRankings {...graphData} />
      <h3>About our ELO Ranking System</h3>
      <p>The ELO ranking system is a widely used method for ranking players or teams in games and sports. It was originally developed by Hungarian-American physicist Arpad Elo in the 1960s to rank chess players, but has since been adapted for use in a variety of other competitive activities, including soccer, basketball, and video games.</p>
      <p>The basic idea behind the ELO ranking system is to assign each player or team a numerical rating based on their performance in previous matches. When two players or teams compete against each other, their ratings are used to calculate the expected outcome of the match, and the actual outcome is compared to the expected outcome to determine how much each player's rating should change.</p>
      <p>If a player or team performs better than expected, their rating will increase, while if they perform worse than expected, their rating will decrease. The size of the rating change is determined by the difference between the actual outcome and the expected outcome, as well as the difference in ratings between the two players or teams.</p>
      <p>The ELO ranking system is widely regarded as a fair and accurate way to rank players or teams, as it takes into account not only wins and losses, but also the strength of the opponents faced and the margin of victory or defeat. It is also relatively simple to understand and implement, which makes it appealing for use in a wide range of contexts.</p>
    </div>
  )
}
