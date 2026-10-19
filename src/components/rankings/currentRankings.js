/* eslint-disable array-callback-return */
/* eslint-disable no-unused-vars */
import { useRef, useEffect, useMemo, useState } from 'react'
import PlayerHistory from './playerHistory';
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
import SchoolIcon from '@mui/icons-material/School';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Modal from '@mui/material/Modal';
import CloseIcon from '@mui/icons-material/Close';
import { Link } from "react-router-dom";

import { toBlob } from 'html-to-image';

import Hat from '../../images/hat.png'

import HistoricalRankings from './historicalRankings'
import HandicapTable from './handicapTable'

// import { getRankingsFromGoogle } from '../../services/googleSheetsService';
import { useLeague } from '../../context/leagueContext'
import { useCurrentElo, useEloDeltas, useEloGraph, usePlayerEloHistory } from '../../context/leagueData'
import LeagueGate from '../../context/LeagueGate'

import './rankings.scss'
// import { calculateElo, resetCurrentElo } from '../../services/eloService';
// import { mockCard } from '../../services/mockData';

export default function CurrentRankings () {
  const { leagueId: league, members: leagueMembers } = useLeague()
  const { value: rankings } = useCurrentElo()
  const { value: deltas } = useEloDeltas()
  const { value: eloGraph } = useEloGraph()
  const { value: playerEloHistory } = usePlayerEloHistory()
  const imageRef = useRef(null);
  const [open, setOpen] = useState(false)
  const [userData, setUserData] = useState('')
  const [hatDataUrl, setHatDataUrl] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const playerEloHistoryRes = playerEloHistory || {}
  const members = useMemo(() => leagueMembers.map(member => member.uDiscDisplayName), [leagueMembers])
  const graphData = useMemo(() => ({ eloGraph, playersInLeague: members }), [eloGraph, members])
  // const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // The shared image is drawn from the DOM, which drops images it can't inline; embed the hat as a data URL up front
  useEffect(() => {
    fetch(Hat)
      .then(res => res.blob())
      .then(blob => new Promise(resolve => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(blob)
      }))
      .then(setHatDataUrl)
      .catch(() => {})
  }, [])

  const getImage = async () => {
    const newFile = await toBlob(imageRef.current, { cacheBust: true });
    // Title/text are left out on purpose: with them, "Copy" on mobile copies the text instead of the image
    const data = {
      files: [
        new File([newFile], "frolf.png", {
          type: newFile.type
        })
      ],
    };
    try {
      if (!navigator.canShare(data)) {
        alert("Can't share, this is an error with the site sorry.");
      }
      await navigator.share(data);
    } catch (err) {
      // Sharing was cancelled or isn't available; nothing to do
    }
  }
   

  const handleShowStats = (userData) => {
    setUserData(userData)
    setOpen(true)
  }

  const getIcon = (value, isMaxDropPlayer) => {
    if (isMaxDropPlayer && league === "maftb") {
      return  <Chip avatar={<img alt="hat" src={hatDataUrl || Hat} width={24} height={24} className="changeIcon" />} label={Math.round(value * 10) / 10} color="error" variant="outlined" />
    }
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
    let maxDrop = 0;
    let playerWithMaxDrop = '';
    Object.entries(deltas || {}).forEach(([player, delta]) => {
      if (delta < maxDrop) {
        maxDrop = delta;
        playerWithMaxDrop = player;
      }
    });
    let sorted = Object.entries(passedRankings).sort((a,b) => b[1]-a[1]).map(el=>el[0])
    let playerRankings = []
    let qualified = true
    sorted.map((x, index) => {
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
          className="clickable"
          hover
          tabIndex={0}
          role="button"
          aria-label={`Show rating history for ${x}`}
          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
          onClick={() => setSelectedPlayer(x)}
          onKeyDown={(e) => { if (e.key === 'Enter') setSelectedPlayer(x) }}
        >
          <TableCell align="center" className="rankCell">
            <span className={`rankBadge rank${Math.min(index + 1, 4)}`}>{index + 1}</span>
          </TableCell>
          <TableCell align="center" className="playerCell">
            {capitalizeFirstLetter(x)} {/* {qualified ? null : " - Not Qualified"} */}
          </TableCell>
          <TableCell align="center" className="ratingCell">{Math.round(passedRankings[x] * 10) /10}</TableCell>
          {deltas && (<TableCell align="center">{getIcon(deltas[x], x === playerWithMaxDrop)}</TableCell>)}
        </TableRow>
      )
    })
    return playerRankings
  }

  return (
    <div className="currentRankings">
      <PlayerHistory player={selectedPlayer} eloGraph={eloGraph} league={league} onClose={() => setSelectedPlayer(null)} />
      <h1>Current Rankings</h1>
      <LeagueGate>
      <div className="pageCard">
        <div ref={imageRef}>
          <TableContainer component={Paper} variant="outlined" size="medium" className="rankingsTable">
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell align="center">#</TableCell>
                  <TableCell align="center">Player</TableCell>
                  <TableCell align="center">Rating</TableCell>
                  <TableCell align="center">Change</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rankings && (formatRankings(rankings))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        <div className="moreStats">
         <Link to="./detailedRankings">
            <Button variant="contained" color="primary" style={{ margin: "5px" }}>
              See Detailed Stats
            </Button>
          </Link>
        </div>
        <div className="getImg">
          <Button variant="contained" onClick={() => getImage()}>Share Rankings</Button>
        </div>
        <HandicapTable members={members} />
        <HistoricalRankings {...graphData} />
        <h3>About our ELO Ranking System</h3>
        <p>The ELO ranking system is a widely used method for ranking players or teams in games and sports. It was originally developed by Hungarian-American physicist Arpad Elo in the 1960s to rank chess players, but has since been adapted for use in a variety of other competitive activities, including soccer, basketball, and video games.</p>
        <p>The basic idea behind the ELO ranking system is to assign each player or team a numerical rating based on their performance in previous matches. When two players or teams compete against each other, their ratings are used to calculate the expected outcome of the match, and the actual outcome is compared to the expected outcome to determine how much each player's rating should change.</p>
        <p>If a player or team performs better than expected, their rating will increase, while if they perform worse than expected, their rating will decrease. The size of the rating change is determined by the difference between the actual outcome and the expected outcome, as well as the difference in ratings between the two players or teams.</p>
        <p>The ELO ranking system is widely regarded as a fair and accurate way to rank players or teams, as it takes into account not only wins and losses, but also the strength of the opponents faced and the margin of victory or defeat. It is also relatively simple to understand and implement, which makes it appealing for use in a wide range of contexts.</p>
      </div>
      </LeagueGate>
    </div>
  )
}
