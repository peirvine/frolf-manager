import React from "react";
import { useRouteError, Link } from "react-router-dom";
import Nav from "./components/nav/nav";
import Footer from "./components/footer/footer";
import { Paper } from "@mui/material";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { signInWithGoogle } from "./firebase";
import { Button } from '@mui/material'


const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0e4071',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#fafafa',
    },
  },
});

const handleSignIn = () => {
  signInWithGoogle()
}

export default function ErrorPage() {
  const error = useRouteError();
  console.warn(error);
  let errorComp
  switch (error.message) {
    case "user is null": 
      errorComp = <UserError />
      break
    default:
      errorComp = <GenericError error={error} />
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="frolfLeague">
        <header className="frolfHeader">
            <Nav />
        </header>
        <div className="content">
          <Paper className="paperContent" style={{textAlign: "center"}}>
            {errorComp}
          </Paper>
        </div>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

const UserError = () => {
  return (
    <>
      <h1>Oops!</h1>
      <p>Sorry, you need to be logged in to view this page</p>
      <p>
        <Button 
          onClick={() => handleSignIn()}
          variant="outlined"
        > 
          Log In
        </Button>
      </p>
    </>
  )
}

const GenericError = (props) => {
  return (
    <>
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{props.error.statusText || props.error.message}</i>
      </p>
      <Link to={"/"}>Go Home</Link>
    </>
  )
}