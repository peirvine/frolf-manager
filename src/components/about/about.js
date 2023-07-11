import LeagueRankingsHistory from "./leagueRankingsHistory"
// import Players from "./players"
import { standings2022, tourney2022, stats2022 } from './yearlyStandings'

import "./about.scss"

export default function About () {
  return (
    <div className="about">

      <h1>Our History</h1>

      <div className="aboutText">
        <p>Welcome to Monday's are Fore the Boys, a disc golf community founded in 2022. We are a group of disc golf enthusiasts who come together every Monday to play, compete, and have fun. Our community is based on the principles of camaraderie, sportsmanship, and friendly competition.</p>

        <p>One of the unique features of our community is our custom rankings system. Each week, players are ranked based on their performance in the previous game. The player with the highest rank at the end of the season is crowned the regular season winner and gets to choose the first course for our Tournament of Champions.</p>

        <p>The Tournament of Champions is the highlight of our season, where the highest ranked player chooses the first course of a two-course tournament and the lowest ranked player chooses the second course. This ensures that all players have a chance to compete on courses they enjoy and challenges them to adapt to new environments.</p>

        <p>After the tournament, we celebrate with a BBQ hosted by the lowest ranked regular season player, where we hand out player awards and present the trophy to the winner. It's a great way to wrap up the season and celebrate the camaraderie and sportsmanship that make our community so special.</p>

        <p>We also host a couples tournament where significant others or guests are invited to play. In this tournament, players alternate every other throw, allowing for a fun and unique experience for everyone involved. It's a great way to introduce friends and family to the sport, and it's always a blast to see new players join in on the fun.</p>

        <p>In our inaugural season, Benton was crowned the champion, while Alex took home the honor of being the lowest ranked player. But regardless of where you rank, everyone is welcome in our community. We believe that disc golf is for everyone, and we hope to see you on the course soon.</p>
      </div>

      {/* <div className="aboutPlayers">
        <h2>League Members</h2>
        <Players />
      </div> */}
      <div className="aboutHistory">
        <h2>League History</h2>
        <LeagueRankingsHistory year={"2022"} standings={standings2022} tourney={tourney2022} stats={stats2022} />
      </div>
    </div>
  )
}