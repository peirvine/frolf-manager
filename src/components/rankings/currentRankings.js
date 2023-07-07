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

import { toPng, toBlob } from 'html-to-image';

import HistoricalRankings from './historicalRankings'

import { getRankingsFromGoogle } from '../../services/googleSheetsService';

import './rankings.scss'

export default function CurrentRankings () {
  const [rankings, setRankings] = useState()
  const imageRef = useRef(null);
  const [open, setOpen] = useState(false)
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [user, setUser] = useState('')

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
      console.log(err);
    }
  }

  const handleShowStats = (user) => {
    setUser(user)
    setOpen(true)
  }

  useEffect(() => {
    getRankingsFromGoogle().then((value) => {
      setRankings(value.values);
    })
  }, [setRankings]);

  const getIcon = value => {
    if (value <= 1 && value >= -1) {
      return <Chip icon={<UnfoldMoreIcon className="changeIcon"/>} label={value} color="primary" variant="outlined" />
    } else if (value > 1 && value < 10 ) {
      return  <Chip icon={<KeyboardArrowUpIcon className="changeIcon" />} label={value} color="success" variant="outlined" />
    } else if (value >= 10 && value < 15 ) {
      return  <Chip icon={<KeyboardDoubleArrowUpIcon className="changeIcon" />} label={value} color="success" variant="outlined" />
    } else if (value >= 15) {
      return  <Chip icon={<SwitchAccessShortcutIcon className="changeIcon" />} label={value} color="success" variant="outlined" />
    } else if (value < -1 && value > -10 ) {
      return  <Chip icon={<KeyboardArrowDownIcon className="changeIcon" />} label={value} color="error" variant="outlined" />
    } else if (value <= -10 && value > -15 ) {
      return  <Chip icon={<KeyboardDoubleArrowDownIcon className="changeIcon" />} label={value} color="error" variant="outlined" />
    } else if (value <= -15) {
      return  <Chip icon={<TrendingDownIcon className="changeIcon" />} label={value} color="error" variant="outlined" />
    }
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
              {rankings && (rankings.map((player) => (
                <TableRow
                  key={player[0]}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  onClick={() => handleShowStats(player[0])}
                >
                  <TableCell align="center">
                    {player[0]}
                  </TableCell>
                  <TableCell align="center">{player[1]}</TableCell>
                  <TableCell align="center">{getIcon(player[2])}</TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      <div className="getImg">
        <Button variant="contained" onClick={() => getImage()}>Share Rankings</Button>
      </div>
      <HistoricalRankings />
      <h3>About our ELO Ranking System</h3>
      <p>The ELO ranking system is a widely used method for ranking players or teams in games and sports. It was originally developed by Hungarian-American physicist Arpad Elo in the 1960s to rank chess players, but has since been adapted for use in a variety of other competitive activities, including soccer, basketball, and video games.</p>
      <p>The basic idea behind the ELO ranking system is to assign each player or team a numerical rating based on their performance in previous matches. When two players or teams compete against each other, their ratings are used to calculate the expected outcome of the match, and the actual outcome is compared to the expected outcome to determine how much each player's rating should change.</p>
      <p>If a player or team performs better than expected, their rating will increase, while if they perform worse than expected, their rating will decrease. The size of the rating change is determined by the difference between the actual outcome and the expected outcome, as well as the difference in ratings between the two players or teams.</p>
      <p>The ELO ranking system is widely regarded as a fair and accurate way to rank players or teams, as it takes into account not only wins and losses, but also the strength of the opponents faced and the margin of victory or defeat. It is also relatively simple to understand and implement, which makes it appealing for use in a wide range of contexts.</p>
    </div>
  )
}