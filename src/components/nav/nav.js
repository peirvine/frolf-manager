import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import ParkIcon from '@mui/icons-material/Park';
import { auth, signInWithGoogle, logout } from "../../firebase"
import { useAuthState } from "react-firebase-hooks/auth";

import { NavLink } from "react-router-dom";
import './nav.scss'

const pages = [
  {
    display: 'Home',
    route: "/"
  },
  {
    display: 'About the League',
    route: "/about"
  },
  {
    display: 'Add Scorecard',
    route: "/add"
  },
  {
    display: 'Current Rankings',
    route: "/rankings"
  },
  {
    display: 'Past Results',
    route: "/scorecards"
  },
];

export default function Nav() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [user] = useAuthState(auth);
  
  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <ParkIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h5"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            Such Frolf
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {pages.map((page) => (
                <MenuItem
                  key={page.display}
                  onClick={handleCloseNavMenu}
                  component={ NavLink }
                  to={page.route}
                >
                  {page.display}
                </MenuItem>
              ))}
              {user ? (
                <>
                  <MenuItem
                    key={'doink fund'}
                    onClick={handleCloseNavMenu}
                    component={ NavLink }
                    to={"/doink"}>
                      Doink Fund
                  </MenuItem>
                  <Button onClick={() => logout()}>Log Out</Button>
                </>
                ) : (
                <MenuItem>
                  <Button onClick={() => signInWithGoogle()}>Log In</Button>
                </MenuItem>
              )}
            </Menu>
          </Box>
          <ParkIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h4"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            Such Frolf
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                component={ NavLink }
                key={page.display}
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'white', display: 'block' }}
                to={page.route}
              >
                {page.display}
              </Button>
            ))}
            { user && (
              <Button
                key={'doink fund'}
                sx={{ my: 2, color: 'white', display: 'block' }}
                onClick={handleCloseNavMenu}
                component={ NavLink }
                to={"/doink"}
              >
                Doink Fund
              </Button>
            )}
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {user ? 
              (
                <Button 
                  sx={{ my: 2, color: 'white', display: 'block' }}
                  onClick={() => logout()}
                >
                  Log Out
                </Button>
              ) : (
                <Button 
                  sx={{ my: 2, color: 'white', display: 'block' }}
                  onClick={() => signInWithGoogle()}
                >
                  Log In
                </Button>
              )
            }
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
