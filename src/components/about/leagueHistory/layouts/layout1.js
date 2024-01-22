import React, { useEffect, useState } from 'react';
import { getSpecificScorecard } from '../../../../firebase'
import { Grid } from "@mui/material";
import SeasonStats from "../seasonStats";
import Awards from "../awards";
import TournamentResults from "../tournamentResults";
import SeasonNotes from "../seasonNotes";
import TournamentStandings from '../tournamentStandings';
import FinalRankings from '../finalRankings';

const Layout1 = (props) => {
  const [roundData, setRoundData] = useState([]);

  useEffect(() => {
    const fetchScorecards = async () => {
      const promises = props.season.tournamentRounds.map((round) =>
        getSpecificScorecard(props.league, props.season.season, round)
      );

      try {
        const results = await Promise.all(promises);
        setRoundData(results);
      } catch (error) {
        console.error('Error fetching scorecards:', error);
      }
    };

    fetchScorecards();
  }, [props.league, props.season.season, props.season.tournamentRounds, props.tourney]);

  return (
    <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 5 }}>
      <Grid item lg={3} xs={12}>
        <div className="seasonStats">
          <FinalRankings {...props.season.stats} />
          <SeasonStats {...props.season.stats} />
          {props.season.awards && (<Awards awards={props.season.awards} />)}
          {props.season.seasonNotes && (<SeasonNotes notes={props.season.seasonNotes} />)}
        </div>
      </Grid>
      <Grid item lg={9} xs={12}>
        <TournamentStandings round={roundData} data={props.season.DNFList}/>
        <TournamentResults {...roundData} />
      </Grid>
    </Grid>
  );
};

export default Layout1;
