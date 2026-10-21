import { Alert } from '@mui/material'

// Shown in place of something the league's plan doesn't include. Only appears once site billing is on.
export default function LockedFeature ({ children }) {
  return <Alert severity="info" icon={false}>{children || "This is part of the Plus plan."}</Alert>
}
