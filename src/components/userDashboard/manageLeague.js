// eslint-disable-next-line no-unused-vars
import {useState} from 'react'
import { Link, useLocation } from "react-router-dom";

export default function ManageLeague() {
  const location = useLocation()
  const { state } = location
  return (
    <div className="manage">
      <h2>Manage {state.leagueName}</h2>
      <Link to={`/dashboard`}>Back to Dashboard</Link>
    </div>
  )
}