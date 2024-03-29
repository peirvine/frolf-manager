import ParHole from './parHole'

import './scorecards.scss'


export default function DisplayHoles (props) {
  const prePar = props.par

  const par = prePar.holes

  return (
    <div id="displayHoles">
      {props.player.map((hole, index) => {
        const score = hole - par[index]
        let holeClass = "par"

        switch (score) {
          case -4:
            holeClass = 'condor'
            break
          case -3:
            holeClass = 'albatross'
            break
          case -2:
            holeClass = 'eagle'
            break
          case -1:
            holeClass = 'birdie'
            break
          case 1:
            holeClass = 'bogey'
            break
          case 2:
            holeClass = 'doubleBogey'
            break
          case 3:
            holeClass = 'overDoubleBogey'
            break  
          default:
            break  
        }

        if (score < "-3") {
          holeClass = 'condor'
        }

        if (score > "3") {
          holeClass = 'overDoubleBogey'
        }
        
        if (hole === "1") {
          holeClass = "ace"
        }

        if (hole === "0") {
          holeClass = "par"
        }

        if (props.parRow) {
          return (<div className="holeWrapper"><ParHole par={hole} hole={index + 1} /></div>)
        } else {
          return (<div className={`holeWrapper ${holeClass}`}><p>{hole}</p></div>)
        }
        
      })}
    </div>
  )
}