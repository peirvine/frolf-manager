import './leagueHistory.scss'

export default function SeasonNotes (notes) {
  return (
    <div className="historyCard seasonNotesCard">
      <h3>A Note from the League Commissioner</h3>
      <blockquote>{notes.notes}</blockquote>
    </div>
  );
};
