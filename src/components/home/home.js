import { Button } from '@mui/material'
import { NavLink } from "react-router-dom";

import "./home.scss"

export default function Home () {
  return (
    <div className="home">
      <div className="hero">
        {/* <img src={fullGroup} alt="group of disc golfers" /> */}
        <div className="homeText">
          {/* <h6>Such Frolf presents</h6> */}
          <h1>Monday's are Fore the Boys</h1>
        </div>
      </div>
      <div className="textContent">
        <h2>Monday's are Fore the Boys</h2>
        <p>We're a Frolf (Disc Golf) League that drinks beer and plays frolf (in that order) weekly on Mondays.</p>
        <Button 
          variant="contained"
          component={ NavLink }
          to={"/about"}
        >
          About the League
        </Button>
      </div>
      <div className="aboutContent">
        <h2>Score a Round</h2>
        <p>Add your round to our custom ranking system</p>
        <Button 
          variant="contained"
          component={ NavLink }
          to={"/add"}
        >
          Add a Round
        </Button>
      </div>
    </div>
  )
}