import React from 'react';

export default function SeasonNotes (notes) {
  // Component logic goes here

  return (
    <div>
      <h4>A Note from the League Comissioner</h4>
      {notes.notes}
    </div>
  );
};
