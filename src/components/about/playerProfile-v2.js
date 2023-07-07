import { useState } from 'react';
import {Box, Modal, Typography} from '@mui/material';

export default function PlayerProfile(player) {
  const [open, setOpen] = useState(false)
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
 
  return (
    <div className="playerProfile">
      <img src={player.image} alt="player" className='playerPicV2' onClick={() => setOpen(true)}/>
      <h3>{player.name}</h3>
    </div>
  )
}