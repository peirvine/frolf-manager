import { useState, useEffect, useRef } from 'react';
import { Button } from '@mui/material'
import { useAuthState } from 'react-firebase-hooks/auth';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import BoltIcon from '@mui/icons-material/Bolt';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import Webcam from "react-webcam";

import { auth } from '../../firebase'
import './discCharger.scss'

const UPGRADES = [
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

const GREGRADES = [
  "Enhanced Salt to match it's player",
  "Increased Dirt for a dirtier disc",
  "Improved Grime for a grimier disc",
  "Softer disc for optimal dent making",
  "Enhanced Friction for better sticking to trees",
  "Off center weight for better wobble",
  "Inconsistent rim thickness for worse hammer throws",
  "More likely to roll for better rollaways",
  "More likely to cause a rage quit",
  "OB Seeker (uh oh how'd that get in there)",
  "More hydrodynamic to sink deeper in water",
  "Glasslike texture for better shattering",
]

const STEPS = [
  "Point your camera at your disc",
  "Hit Charge My Disc",
  "Enjoy your upgrades on the next tee",
]

// Picks `count` different entries from a list
const pickRandom = (list, count) => {
  const pool = [...list]
  const picked = []
  while (picked.length < count && pool.length > 0) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
  }
  return picked
}

const videoConstraints = {
  width: 300,
  height: 300,
  facingMode: "environment"
};

export default function DiscCharger() {
  const [user] = useAuthState(auth)
  // ready -> charging -> charged
  const [phase, setPhase] = useState("ready")
  const [progress, setProgress] = useState(0);
  const [upgrades, setUpgrades] = useState([])
  const [image, setImage] = useState(null)
  const [cameraError, setCameraError] = useState(false)
  const webcamRef = useRef(null)

  // Fill the ring over ~2.5 seconds, only while charging
  useEffect(() => {
    if (phase !== "charging") return
    const timer = setInterval(() => setProgress(previous => Math.min(100, previous + 4)), 100)
    return () => clearInterval(timer)
  }, [phase])

  useEffect(() => {
    if (phase === "charging" && progress >= 100) setPhase("charged")
  }, [phase, progress])

  const charge = () => {
    setImage(webcamRef.current?.getScreenshot())
    // Greg gets one real upgrade and two very special ones
    const isGreg = user && user.email === "g.ledray@gmail.com"
    setUpgrades(isGreg ? [...pickRandom(UPGRADES, 1), ...pickRandom(GREGRADES, 2)] : pickRandom(UPGRADES, 3))
    setProgress(0)
    setPhase("charging")
  }

  const reset = () => {
    setPhase("ready")
    setUpgrades([])
    setImage(null)
    setProgress(0)
  }

  return (
    <div className="discCharger">
      <h1>Charge your disc!</h1>
      <div className="chargerLayout">
        <section className={`chargerPanel ${phase}`}>
          <div className="chargerRing" style={{ "--progress": phase === "ready" ? 0 : progress }}>
            <div className="chargerView">
              {phase === "ready" ? (
                cameraError ? (
                  <div className="chargerCameraError">
                    <VideocamOffIcon />
                    <span>Allow camera access to charge your disc</span>
                  </div>
                ) : (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    height={300}
                    width={300}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    onUserMediaError={() => setCameraError(true)}
                  />
                )
              ) : (
                image && <img src={image} alt="your disc" className="chargerDisc" />
              )}
            </div>
          </div>

          {phase === "ready" && (
            <Button
              className="chargerButton"
              variant="contained"
              size="large"
              startIcon={<ElectricalServicesIcon />}
              onClick={charge}
              disabled={cameraError}
            >
              Charge My Disc!
            </Button>
          )}

          {phase === "charging" && (
            <div className="chargerStatus">
              <BoltIcon />
              <strong>Charging your disc… {progress}%</strong>
            </div>
          )}

          {phase === "charged" && (
            <div className="chargerResult">
              <span className="chargerBadge"><BoltIcon fontSize="inherit" /> Fully charged</span>
              <p>We've gifted your disc with these upgrades:</p>
              <ul className="chargerUpgrades">
                {upgrades.map(upgrade => (
                  <li key={upgrade}><BoltIcon fontSize="small" />{upgrade}</li>
                ))}
              </ul>
              <Button className="chargerAgain" variant="outlined" onClick={reset} startIcon={<RestartAltIcon />}>Charge Another</Button>
            </div>
          )}
        </section>

        <section className="pageCard chargerIntro">
          <span className="chargerEyebrow">Bench chargers, but with AI</span>
          <p>Tired of your disc being low on energy and not flying as far as it should? We know that feeling. Do you also not want to vandalize park benches to hopefully improve your game? We know that feeling too. Were you hopeful that UDisc would actually implement their April Fools joke? We were too.</p>
          <p>But we're here to help! Take a picture of your disc to charge it with energy! Our Disc Charger is 100% guaranteed to do the same magical powers that the old school bench chargers have, but this time with the power of AI! Every charge is run through our Generative AI Machine Learning Big Data Driven model to give you the optimal flight pattern for the hole you are on!</p>
          <ol className="chargerSteps">
            {STEPS.map((step, index) => (
              <li key={step}><span>{index + 1}</span>{step}</li>
            ))}
          </ol>
          <small className="chargerFinePrint">No images are saved to our servers.</small>
        </section>
      </div>
    </div>
  );
}
