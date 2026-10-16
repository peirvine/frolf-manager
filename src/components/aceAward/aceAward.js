import './aceAward.scss'

// Leaf positions (degrees around the wreath, 90 = bottom) for the left branch; the right branch mirrors it
const LEAF_ANGLES = [112, 132, 152, 172, 192, 212, 232]

function LaurelBranch () {
  return (
    <g className="laurelBranch">
      <path className="laurelStem" d="M 44.7 87.6 A 38 38 0 0 1 28.8 18.5" />
      {LEAF_ANGLES.flatMap(angle => [-1, 1].map(side => {
        const rad = angle * Math.PI / 180
        const radius = 38 + side * 5
        const x = 50 + radius * Math.cos(rad)
        const y = 50 + radius * Math.sin(rad)
        // Leaves point up the branch, splayed away from the stem on each side
        return <ellipse key={`${angle}${side}`} cx={x} cy={y} rx="6.5" ry="2.6" transform={`rotate(${angle + 90 + side * 28} ${x} ${y})`} />
      }))}
      <ellipse cx="34.5" cy="15.3" rx="6.5" ry="2.6" transform="rotate(-24 34.5 15.3)" />
    </g>
  )
}

// A disc golf basket drawn on a 100x100 canvas (pole, chain band, chains, tray, base); also used on the home page
export function Basket (props) {
  return (
    <g className="basket" {...props}>
      <rect x="48.6" y="22" width="2.8" height="54" rx="1" />
      <rect x="35" y="25" width="30" height="5" rx="1.5" />
      <path className="basketChains" d="M37 30 Q41 41 43 51 M42 30 Q44 41 46 51 M47 30 Q48.5 41 48.8 51 M53 30 Q51.5 41 51.2 51 M58 30 Q56 41 54 51 M63 30 Q59 41 57 51" />
      <path d="M32 50 H68 L64 61 H36 Z" />
      <path className="basketBase" d="M42 76.5 H58" />
    </g>
  )
}

export function AceLaurel () {
  return (
    <svg className="aceLaurel" viewBox="0 0 100 100" role="img" aria-label="Ace">
      <LaurelBranch />
      <g transform="translate(100 0) scale(-1 1)">
        <LaurelBranch />
      </g>
      <Basket />
    </svg>
  )
}

export default function AceAward ({ player, course, hole }) {
  return (
    <div className="aceAward">
      <AceLaurel />
      <div className="aceInfo">
        <span className="aceLabel">Ace</span>
        <strong>{player}</strong>
        <span>{course}</span>
        <small>Hole {hole}</small>
      </div>
    </div>
  )
}

// Firebase drops empty lists, so aces can be missing
export function AceAwards ({ aces }) {
  if (!aces || aces.length === 0) return null
  return (
    <div className="aceAwards">
      {aces.map(ace => <AceAward key={`${ace.player} ${ace.course} ${ace.hole} ${ace.date}`} {...ace} />)}
    </div>
  )
}
