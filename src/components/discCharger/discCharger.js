import { useState, useEffect } from 'react';
import { Button,  CircularProgress, Backdrop } from '@mui/material'
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import Webcam from "react-webcam";

export default function DiscCharger() {
  const [charging, setCharging] = useState(false)
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false)
  const [upgrades, setUpgrades] = useState()
  const [image, setImage] = useState(null)

  const handleClose = () => {
    setOpen(false)
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => (prevProgress >= 100 ? 100 : prevProgress + 1));
    }, 25);

    return () => {
      clearInterval(timer);
    };
  }, [charging])

  const handleReset = async () => {
    setCharging(false)
    setUpgrades(null)
    setImage(null)
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
    setUpgrades(randomUpgrades)
  }

  const videoConstraints = {
    width: 300,
    height: 300,
    facingMode: "environment"
  };
  

  return (
    <div className="discCharger">
      <h1>Charge your disc!</h1>
      <p>Tired of your disc being low on energy and not flying as far as it should? We know that feeling. Do you also not want to vandalize park benches to hopefully improve your game? We know that feeling too. Were you hopeful that UDisc would actually implement their April Fools joke? We were too. But we're here to help! Take a picture of your disc to charge it with energy! Our Disc Charger is 100% guaranteed to do the same magical powers that the old school bench chargers have, but this time with the power of AI! Every charge is run through our Generative AI Machine Learning Big Data Driven model to give you the optimal flight pattern for the hole you are on!</p>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={open && progress < 100}
        onClick={handleClose}
      >
        <div style={{ textAlign: 'center'}} >
          <CircularProgress size={60} thickness={4} sx={{color: '#fff'}} variant="determinate" value={progress} />
          <h2 style={{ color: '#fff', paddingLeft: 20, marginTop: -5 }}>Charging...</h2>
        </div>
      </Backdrop>
      <div className="chargerView" style={{display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 10}}>
        {image && <img style={{ width: '300px', height: '300px', borderRadius: '50%' }} src={image} alt="captured" />}
        {!charging && 
          <Webcam
            audio={false}
            height={300}
            screenshotFormat="image/jpeg"
            width={300}
            videoConstraints={videoConstraints}
            style={{
              borderRadius: '50%',
            }}
          >
            {({ getScreenshot }) => (
              <Button 
                color="warning"
                variant="contained"
                startIcon={<ElectricalServicesIcon />}
                onClick={() => {
                  const imageSrc = getScreenshot()
                  setImage(imageSrc)
                  setOpen(true)
                  setProgress(0)
                  setCharging(true)
                  generateList()
                }}
              >
                Charge My Disc!
              </Button>
            )}
          </Webcam>
        }
        {upgrades && 
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '0px' }}>Your Disc has been charged!</h3>
            <p style={{margin: 0 }}>We've gifted your disc with some of the following upgrades:</p>
            {upgrades}
          </div>
        }
        {charging && <Button color="warning" variant="contained" onClick={handleReset} startIcon={<RestartAltIcon />}>Charge Another</Button> }
        <p><i>No images are saved to our servers.</i></p>
      </div>
    </div>
  );
}

