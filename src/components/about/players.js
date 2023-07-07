import PlayerProfile from "./playerProfile"
import { players } from "./playerFile"
import { default as PlayerProfileV2 } from "./playerProfile-v2"


export default function Players(props) {
  return (
    <div className="playerContainer">
      {players.map(player => (
        <PlayerProfile {...player} />
      ))}
      {players.map(player => (
        <PlayerProfileV2 {...player} />
      ))}
    </div>
  )
}