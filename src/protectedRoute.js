import { auth } from "./firebase"
import { useAuthState } from "react-firebase-hooks/auth";
import { Navigate } from "react-router-dom"

export default function RequireAuth({ children }) {
  const [user] = useAuthState(auth);
  if (!user) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/" replace />;
  }

  return children;
}