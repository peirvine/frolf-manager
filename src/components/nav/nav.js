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
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { auth, signInWithGoogle, logout, updateUsersUDiscName} from "../../firebase"
import { useAuthState } from "react-firebase-hooks/auth";

import { NavLink } from "react-router-dom";
import './nav.scss'

const pages = [
  {
    display: 'Home',
    route: "/"
  },
  {
    display: 'About DGM',
    route: "/about"
  },
];

export default function Nav() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [user] = useAuthState(auth);
  
  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
    setAnchorEl(null)
  };

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    setAnchorEl(null)
    //redirect people to the home page
    
    logout()
  }

  const handleLogin = () => {
    signInWithGoogle().then(res => {
      if (res.message === "needUdisc") {
        setDialogOpen(true)
      }
    })
  }

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
            {window.location.href.includes("suchfrolf") ? "Such Frolf" : "Disc Golf Manager"}
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
                    key={'about'}
                    onClick={handleCloseNavMenu}
                    component={ NavLink }
                    to={"/aboutLeague"}>
                      League History
                  </MenuItem>
                  <MenuItem
                    key={'add scorecard'}
                    onClick={handleCloseNavMenu}
                    component={ NavLink }
                    to={"/add"}>
                      Add Scorecard
                  </MenuItem>
                  <MenuItem
                    key={'rankings'}
                    onClick={handleCloseNavMenu}
                    component={ NavLink }
                    to={"/rankings"}>
                      Current Rankings
                  </MenuItem>
                  <MenuItem
                    key={'past results'}
                    onClick={handleCloseNavMenu}
                    component={ NavLink }
                    to={"/scorecards"}>
                      Past Results
                  </MenuItem>
                  <MenuItem
                    key={'doink fund'}
                    onClick={handleCloseNavMenu}
                    component={ NavLink }
                    to={"/doink"}>
                      Doink Fund
                  </MenuItem>
                  <MenuItem
                    key={'disc charger'}
                    onClick={handleCloseNavMenu}
                    component={ NavLink }
                    to={"/discCharger"}>
                      Disc Charger
                  </MenuItem>
                  <MenuItem
                    key={'dashboard'}
                    onClick={handleCloseNavMenu}
                    component={ NavLink }
                    to={"/dashboard"}>
                      Dashboard
                  </MenuItem>
                  <Button onClick={() => logout()}>Log Out</Button>
                </>
                ) : (
                <MenuItem>
                  <Button onClick={() => handleLogin()}>Log In</Button>
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
              <>
                <Button
                  key={'about'}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                  onClick={handleCloseNavMenu}
                  component={ NavLink }
                  to={"/aboutLeague"}
                >
                  League History
                </Button>
                <Button
                  key={'add scorecard'}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                  onClick={handleCloseNavMenu}
                  component={ NavLink }
                  to={"/add"}
                >
                  Add Scorecard
                </Button>
                <Button
                  key={'rankings'}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                  onClick={handleCloseNavMenu}
                  component={ NavLink }
                  to={"/rankings"}
                >
                  Current Rankings
                </Button>
                <Button
                  key={'past results'}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                  onClick={handleCloseNavMenu}
                  component={ NavLink }
                  to={"/scorecards"}
                >
                  Past Results
                </Button>
                <Button
                  key={'doink fund'}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                  onClick={handleCloseNavMenu}
                  component={ NavLink }
                  to={"/doink"}
                >
                  Doink Fund
                </Button>
              </>
            )}
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {user ? 
              (
                <div>
                  <Button
                    id="basic-button"
                    aria-controls={open ? 'basic-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleClick}
                  >
                    <Avatar alt={stringAvatar(user.displayName)} sx={{ width: 40, height: 40, fontSize: 16, bgcolor: 'dodgerblue' }} src={user.photoURL} />
                  </Button>
                  <Menu
                    id="basic-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    MenuListProps={{
                      'aria-labelledby': 'basic-button',
                    }}
                  >
                     <MenuItem
                        key={'dashboard'}
                        onClick={handleCloseNavMenu}
                        component={ NavLink }
                        to={'/dashboard'}
                      >
                        Dashboard
                      </MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </Menu>
                </div>
              ) : (
                <Button 
                  sx={{ my: 2, color: 'white', display: 'block' }}
                  onClick={() => handleLogin()}
                >
                  Log In
                </Button>
              )
            }
          </Box>
        </Toolbar>
      </Container>
      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        PaperProps={{
          component: 'form',
          onSubmit: (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            updateUsersUDiscName(user, formData.get('name')).then(res => {
              if (res.code === "success") {
                setDialogOpen(false);
              }
            })
          },
        }}
      >
        <DialogTitle>Add Udisc Display Name</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To have your rounds fully counted, you will need to enter your UDisc display name exactly as it appears in the card.
          </DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"
            id="name"
            name="name"
            label="UDisc Display Name"
            type="name"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button type="submit">Add Name</Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}

function stringAvatar(name) {
  return {
    children: `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`,
  };
}
