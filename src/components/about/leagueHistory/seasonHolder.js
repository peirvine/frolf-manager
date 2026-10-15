import Layout1 from './layouts/layout1';
import Layout2 from './layouts/layout2';

export default function SeasonHolder(props) {
  // Firebase drops empty arrays, so a season with no tournament rounds has no tournamentRounds key
  const { tournamentRounds = [] } = props.season;

  const hasTournament = tournamentRounds.length > 0

  return (
    <div>
      {hasTournament ? <Layout1 {...props} /> : <Layout2 {...props} />}
    </div>
  );
};

