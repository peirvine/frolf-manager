import { useState, useEffect, useRef } from 'react';
import { Button, Alert, CircularProgress, Backdrop } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export default function DiscCharger() {
  const [image, setImage] = useState()
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false)

  const divRef = useRef('#discCharger');

  const scrollToElement = () => {
    const {current} = divRef
    if (current !== null){
      current.scrollIntoView({behavior: "smooth"})
    }
  }

  const handleClose = () => {
    setOpen(false)
    scrollToElement()
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => (prevProgress >= 100 ? 100 : prevProgress + 1));
    }, 80);

    return () => {
      clearInterval(timer);
    };
  }, [])

  const handleDiscChange = (e) => {
    setProgress(0)
    setImage(e.target.files[0])
    setOpen(true)
  }

  const generateList = () => {
    const upgrades = [
      "Enhanced stability for longer throws",
      "Increased glide for better distance",
      "Improved accuracy for precise shots",
      "Advanced aerodynamics for better control",
      "Enhanced durability for longer lifespan",
      "Reduced wind resistance for improved performance",
      "Enhanced grip for better handling",
      "Increased fade for reliable finishes",
      "Improved flexibility for smoother releases",
      "Enhanced weight distribution for optimal flight",
      "Reduced disc wobble for improved accuracy",
      "Improved spin for better disc control",
      "Increased speed for longer drives",
      "Enhanced torque resistance for consistent flight",
      "Improved disc texture for better grip",
      "Increased disc size for better wind resistance",
      "Enhanced edge contour for improved accuracy",
      "Increased disc thickness for better control",
      "Improved disc material for enhanced durability",
      "Enhanced disc color for better visibility",
      "+10 Tree Avoidance",
      "+10 Water Avoidance",
      "Tree Seeker (uh oh how'd that get in there)",
    ]

    const randomUpgrades = [];
    while (randomUpgrades.length < 3) {
      const randomIndex = Math.floor(Math.random() * upgrades.length);
      const randomUpgrade = upgrades[randomIndex];
      if (!randomUpgrades.includes(randomUpgrade)) {
        randomUpgrades.push(<li>{randomUpgrade}</li>);
        upgrades.splice(randomIndex, 1);
      }
    }
    return randomUpgrades;
  };

  return (
    <div className="discCharger">
      <h1>Charge your disc!</h1>
      <p>Tired of your disc being low on energy and not flying as far as it should? We know that feeling. Do you also not want to vandalize park benches to hopefully improve your game? We know that feeling too. Were you hopeful that UDisc would actually implement their April Fools joke? We were too. But we're here to help! Take a picture of your disc to charge it with energy! Our Disc Charger is 100% guaranteed to do the same magical powers that the old school bench chargers have, but this time with the power of AI! Every charge is run through our Generative AI Machine Learning Big Data Driven model to give you the optimal flight pattern for the hole you are on!</p>
      
      {image && progress === 100 && (
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={open}
          onClick={handleClose}
        >
          <div style={{ textAlign: 'center'}} >
            <CircularProgress size={60} thickness={4} sx={{color: '#fff'}} variant="determinate" value={progress} />
            <h2 style={{ color: '#fff', paddingLeft: 20, marginTop: -5 }}>Charging...</h2>
          </div>
        </Backdrop>
      )}
      <div style={{ textAlign: 'center' }}>
        {progress === 100 && <Alert severity="success">Disc Charged!</Alert>}
        {image && <img style={{ width: '10rem', textAlign: 'center' }} src={URL.createObjectURL(image)} alt="Selected" id="discCharger" ref={divRef} />}
        {progress === 100 && (
          <div>
            <p>Your disc is now charged! We have blessed your disc with:</p>
            {generateList()}
          </div>
        )}
        <Button
          variant="contained"
          component="label"
          style={{marginTop: 15}}
          startIcon={<CloudUploadIcon />}
        >
          {progress === 100 ? 'Charge Another Disc' : 'Charge My Disc!' }
          <input
            type="file"
            accept="image/*"
            hidden
            capture="environment"
            onChange={e => handleDiscChange(e)}
          />
        </Button>
      </div>
      <p><i>No images are saved to our servers.</i></p>
    </div>
  );
}

