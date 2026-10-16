import React from 'react';
import { Grid } from "@mui/material";
import SeasonStats from "../seasonStats";
import Awards from "../awards";
import SeasonNotes from "../seasonNotes";
import FinalRankings from '../finalRankings';

// Seasons without a tournament: the season summary only
const Layout2 = (props) => {
  return (
    <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 5 }}>
      <Grid item lg={6} xs={12}>
        <div className="seasonStats">
          <FinalRankings {...props.season.stats} />
          <SeasonStats {...props.season.stats} />
          {props.season.awards && (<Awards awards={props.season.awards} />)}
          {props.season.seasonNotes && (<SeasonNotes notes={props.season.seasonNotes} />)}
        </div>
      </Grid>
    </Grid>
  );
};

export default Layout2;
