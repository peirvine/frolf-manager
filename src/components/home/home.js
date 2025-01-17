import { Button, Skeleton, Box } from '@mui/material'
import { NavLink } from "react-router-dom";

import "./home.scss"

export default function Home () {
  return (
    <div className="home">
      <div className="hero">
        <h1>An all-in-one solution for seamless league organization</h1>
        <Button 
          variant="contained"
          component={ NavLink }
          to={"/about"}
        >
          Get Started
        </Button>
      </div>
      <div className="ctaBoxes">
        <Box className="homeBox">
          <Skeleton className="ctaImage" variant="rectangular" width={200} height={200} />
          <h2>Score a Round</h2>
          <p>Add your round to our custom ranking system</p>
        </Box>
        <Box className="homeBox">
          <Skeleton className="ctaImage" variant="rectangular" width={200} height={200} />
          <h2>Log a Doink</h2>
          <p>Manage your league with ease</p>
        </Box>
      </div>
      <div className="ctaBoxes">
        <Box className="homeBox">
          <Skeleton className="ctaImage" variant="rectangular" width={200} height={200} />
          <h2>League History</h2>
          <p>Manage your league with ease</p>
        </Box>
        <Box className="homeBox">
          <Skeleton className="ctaImage" variant="rectangular" width={200} height={200} />
          <h2>Current Rankins</h2>
          <p>Add your round to our custom ranking system</p>
        </Box>
        <Box className="homeBox">
          <Skeleton className="ctaImage" variant="rectangular" width={200} height={200} />
          <h2>Past Rounds</h2>
          <p>View your league's leaderboard</p>
        </Box>
      </div>
    </div>
  )
}