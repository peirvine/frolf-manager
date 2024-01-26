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
          <h1>Disc Golf Manager</h1>
        </div>
      </div>
      <div className="textContent">
        <h2>Disc Golf Manager</h2>
        <p>Elevate your disc golf league experience with DGM - your all-in-one solution for seamless league organization, custom rankings, and tournament management, making every throw count.</p>
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