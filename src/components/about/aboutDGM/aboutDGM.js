export default function AboutDGM() {
  const features = [
    "Organize disc golf leagues",
    "Easy UDisc round uploads",
    "Track scores and player statistics",
    "Manage league rankings",
    "Fun and engaging round enhancements",
    "User-friendly administrative tools",
  ];

  return (
    <div className="about">
      <h2>Welcome to Disc Golf Manager!</h2>
      <p>Disc Golf Manager (DGM) was founded to bring structure and easy management to the exciting sport of disc golf. We started out as a small group of friends who wanted to organize a disc golf league, but we quickly realized that there was no easy way to manage a league. So we decided to build our own. Initally it was done using Google Sheets and a <i>lot</i> of spreadsheet math. Eventually we decided to build a web app to make it easier to manage our league. And thus, DGM was born.</p>

      <p>With DGM, managing a Disc Golf League has never been easier. Out tools allow leagues to keep track of scores, player statistics, and league rankings. We believe in making the administrative side of the sport as enjoyable as the game itself.</p>
        
      <p>We offer an array of features to help you manage your league, including:</p>
      <ul>
        {features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
      <p>Join us in our mission to make disc golf more accessible and enjoyable for everyone. Whether you're a seasoned player or just starting out, DGM has something to offer you.</p>
      <p>Experience the difference with Disc Golf Manager.</p>

      <p>We are currently in beta testing. If you are interested in joining our beta program, please contact us at <a href="mailto:join@discgolfmanager.com">join@discgolfmanager.com</a>.</p>

      {/* <DgmPricing /> */}
    </div>
  );
}

