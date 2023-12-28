// eslint-disable-next-line no-unused-vars
import {useState} from 'react'
import { useParams, Link } from "react-router-dom";

export default function ManageLeague(props) {

  let { league } = useParams()
  return (
    <div className="manage">
      <h2>Manage League {league}</h2>
      <Link to={`/dashboard`}>Back to Dashboard</Link>
    </div>
  )
}