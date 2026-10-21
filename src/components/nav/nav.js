import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import PostAddIcon from '@mui/icons-material/PostAdd';
import { auth, signInWithGoogle, logout } from "../../firebase"
import UDiscNameDialog from "./uDiscNameDialog"
import { Basket } from '../aceAward/aceAward'
import { useAuthState } from "react-firebase-hooks/auth";

import { NavLink, useNavigate } from "react-router-dom";
import { useLeague } from '../../context/leagueContext';
import './nav.scss'

const brandName = window.location.href.includes("suchfrolf") ? "Such Frolf" : "Disc Golf Manager"

const publicPages = [
  { display: 'Home', route: "/" },
  { display: 'About DGM', route: "/about" },
  { display: 'FAQ', route: "/faq" },
]

// Signed in, the bar only has room for these (the brand links home; About DGM moves to the account menu)
const memberPages = [
  { display: 'League History', route: "/aboutLeague" },
  { display: 'Rankings', route: "/rankings" },
  { display: 'Scorecards', route: "/scorecards" },
  { display: 'Doink Fund', route: "/doink" },
]

// Mobile menu when signed in; Dashboard and Log out sit below the divider
const mobileMemberPages = [
  { display: 'Home', route: "/" },
  { display: 'Doink Fund', route: "/doink" },
  { display: 'Add Scorecard', route: "/add" },
  { display: 'Rankings', route: "/rankings" },
  { display: 'Scorecards', route: "/scorecards" },
  { display: 'Disc Charger', route: "/discCharger" },
  { display: 'League History', route: "/aboutLeague" },
  { display: 'About DGM', route: "/about" },
  { display: 'FAQ', route: "/faq" },
]

export default function Nav() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [user] = useAuthState(auth);
  const { isSiteAdmin } = useLeague();
  const navigate = useNavigate();

  const closeMenus = () => {
    setAnchorElNav(null)
    setAnchorEl(null)
  }

  const handleLogout = () => {
    closeMenus()
    // Back to the home page so a signed-out user isn't left on a page that needs a league
    Promise.resolve(logout()).finally(() => navigate("/"))
  }

  const handleLogin = () => {
    closeMenus()
    signInWithGoogle().then(res => {
      if (res.message === "needUdisc") {
        setDialogOpen(true)
      }
    })
  }

  const pages = user ? memberPages : publicPages

  return (
    <AppBar position="static" elevation={0} className="navBar">
      <Toolbar disableGutters className="navInner">
        <NavLink to="/" className="navBrand">
          <svg className="navBrandMark" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="50" />
            <g transform="translate(-12.5 -12) scale(1.25)">
              <Basket />
            </g>
          </svg>
          <span>{brandName}</span>
        </NavLink>

        <Box component="nav" className="navLinks" sx={{ display: { xs: 'none', lg: 'flex' } }}>
          {pages.map((page) => (
            <NavLink key={page.route} to={page.route} end={page.route === "/"} className="navLink">
              {page.display}
            </NavLink>
          ))}
        </Box>

        <Box className="navRight" sx={{ display: { xs: 'none', lg: 'flex' } }}>
          {user ? (
            <>
              <Button className="navCta" variant="contained" component={NavLink} to="/add" startIcon={<PostAddIcon />}>
                Add Scorecard
              </Button>
              <IconButton
                id="account-button"
                aria-label="account menu"
                aria-controls={anchorEl ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={anchorEl ? 'true' : undefined}
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{ p: 0.5 }}
              >
                <Avatar alt={user.displayName || ""} src={user.photoURL} className="navAvatar">
                  {initials(user.displayName)}
                </Avatar>
              </IconButton>
              <Menu
                id="account-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={closeMenus}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                MenuListProps={{ 'aria-labelledby': 'account-button' }}
              >
                <MenuItem disabled className="navMenuName">{user.displayName}</MenuItem>
                <Divider />
                <MenuItem onClick={closeMenus} component={NavLink} to="/dashboard">Dashboard</MenuItem>
                <MenuItem onClick={closeMenus} component={NavLink} to="/discCharger">Disc Charger</MenuItem>
                <MenuItem onClick={closeMenus} component={NavLink} to="/about">About DGM</MenuItem>
                <MenuItem onClick={closeMenus} component={NavLink} to="/faq">FAQ</MenuItem>
                {isSiteAdmin && <MenuItem onClick={closeMenus} component={NavLink} to="/admin">Site admin</MenuItem>}
                <Divider />
                <MenuItem onClick={handleLogout}>Log out</MenuItem>
              </Menu>
            </>
          ) : (
            <Button className="navLogin" variant="outlined" onClick={handleLogin}>Log In</Button>
          )}
        </Box>

        <Box className="navRight" sx={{ display: { xs: 'flex', lg: 'none' } }}>
          <IconButton
            size="large"
            aria-label="open navigation menu"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={(e) => setAnchorElNav(e.currentTarget)}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorElNav}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={Boolean(anchorElNav)}
            onClose={closeMenus}
          >
            {(user ? mobileMemberPages : publicPages).map((page) => (
              <MenuItem key={page.route} onClick={closeMenus} component={NavLink} to={page.route} end={page.route === "/"}>
                {page.display}
              </MenuItem>
            ))}
            <Divider />
            {user ? [
              <MenuItem key="dashboard" onClick={closeMenus} component={NavLink} to="/dashboard">Dashboard</MenuItem>,
              ...(isSiteAdmin ? [<MenuItem key="admin" onClick={closeMenus} component={NavLink} to="/admin">Site admin</MenuItem>] : []),
              <MenuItem key="logout" onClick={handleLogout}>Log out</MenuItem>,
            ] : (
              <MenuItem onClick={handleLogin}>Log In</MenuItem>
            )}
          </Menu>
        </Box>
      </Toolbar>
      <UDiscNameDialog open={dialogOpen} user={user} onSaved={() => setDialogOpen(false)} />
    </AppBar>
  );
}

// "Peter Irvine" -> "PI"; copes with one-word or missing names
function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join("")
}
