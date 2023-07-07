import { useState } from 'react';
import {Box, Modal, Typography} from '@mui/material';

export default function PlayerProfile(player) {
  const [open, setOpen] = useState(false)
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 1200,
    height: 600,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
  };
  

  return (
    <div className="playerProfile">
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <img src={player.image} alt="player image" className="modalPic" />
          <div className="modalContent">
            <h3>{player.name}</h3>
            <p>Favorite Course: {player.favoriteCourse}</p>
            <p>{player.bio}</p>
          </div>
        </Box>
      </Modal>

      <div className="playerBubble">
        <img src={player.image} alt="player image" className='playerPic' onClick={() => setOpen(true)}/>
        <h3>{player.name}</h3>
      </div>
    </div>
  )
}