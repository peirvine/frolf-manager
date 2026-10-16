import { Avatar, SvgIcon } from '@mui/material'
import AlbumIcon from '@mui/icons-material/Album';
import ParkIcon from '@mui/icons-material/Park';
import TerrainIcon from '@mui/icons-material/Terrain';
import FlagIcon from '@mui/icons-material/Flag';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import BoltIcon from '@mui/icons-material/Bolt';
import SportsBarIcon from '@mui/icons-material/SportsBar';
import WbSunnyIcon from '@mui/icons-material/WbSunny';

// The site's disc golf basket as an icon (same drawing as the logo and ace awards)
function BasketIcon (props) {
  return (
    <SvgIcon viewBox="21 19 58 60" {...props}>
      <rect x="48.6" y="22" width="2.8" height="54" rx="1" />
      <rect x="35" y="25" width="30" height="5" rx="1.5" />
      <path d="M37 30 Q41 41 43 51 M42 30 Q44 41 46 51 M47 30 Q48.5 41 48.8 51 M53 30 Q51.5 41 51.2 51 M58 30 Q56 41 54 51 M63 30 Q59 41 57 51" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M32 50 H68 L64 61 H36 Z" />
      <path d="M42 76.5 H58" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </SvgIcon>
  )
}

// Icons a league can pick for its avatar on the dashboard; saved as `icon` in the league settings
export const LEAGUE_ICONS = [
  { id: "basket", label: "Basket", Icon: BasketIcon },
  { id: "disc", label: "Disc", Icon: AlbumIcon },
  { id: "tree", label: "Tree", Icon: ParkIcon },
  { id: "mountain", label: "Mountain", Icon: TerrainIcon },
  { id: "flag", label: "Flag", Icon: FlagIcon },
  { id: "trophy", label: "Trophy", Icon: EmojiEventsIcon },
  { id: "fire", label: "Fire", Icon: LocalFireDepartmentIcon },
  { id: "bolt", label: "Lightning", Icon: BoltIcon },
  { id: "beer", label: "Beer", Icon: SportsBarIcon },
  { id: "sun", label: "Sun", Icon: WbSunnyIcon },
]

export const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0].toUpperCase()).join("")

// The league's avatar: its chosen icon, or its initials when it hasn't picked one (or picked one that no longer exists)
export default function LeagueAvatar ({ name, icon, className = "leagueAvatar", ...props }) {
  const choice = LEAGUE_ICONS.find(option => option.id === icon)
  return (
    <Avatar className={className} {...props}>
      {choice ? <choice.Icon /> : initials(name)}
    </Avatar>
  )
}
