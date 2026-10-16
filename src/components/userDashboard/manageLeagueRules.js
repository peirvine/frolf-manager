import { useEffect, useState } from "react";
import { addLeagueRule, getLeagueRules, deleteLeagueRule, updateLeagueRule } from "../../firebase";
import { Button, TextField, Snackbar, Alert, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";

export default function ManageLeagueRules ( props ) {
  const [rules, setRules] = useState({})
  const [newRule, setNewRule] = useState('')
  // The rule being edited: its key and the draft text
  const [editing, setEditing] = useState(null)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertLevel, setAlertLevel] = useState('info')

  const loadRules = () => {
    getLeagueRules(props.league)?.then(res => {
      setRules(res || {});
    });
  }

  useEffect(loadRules, [props.league]);

  // Reload and report how a change went
  const afterChange = (res) => {
    loadRules()
    setAlertLevel(res.code)
    setAlertMessage(res.message)
    setAlertOpen(true)
  }

  const handleAddRule = () => {
    if (!newRule.trim()) return
    addLeagueRule(props.league, newRule.trim()).then(afterChange);
    setNewRule('')
  }

  const handleSaveEdit = () => {
    if (!editing.text.trim()) return
    updateLeagueRule(props.league, editing.key, editing.text.trim()).then(res => {
      afterChange(res)
      if (res.code === "success") setEditing(null)
    });
  }

  const handleDeleteRule = (key) => {
    if (!window.confirm("Delete this rule?")) return
    deleteLeagueRule(props.league, key).then(afterChange);
  }

  return (
    <div className="manageRules">
      <h3>League Rules</h3>
      <p className="manageIntro">House rules on top of the PDGA rules. They show on the League History page.</p>
      <div className="ruleAdd">
        <TextField
          fullWidth
          multiline
          size="small"
          label="New rule"
          value={newRule}
          onChange={(e) => setNewRule(e.target.value)}
        />
        <Button variant="contained" onClick={handleAddRule} disabled={!newRule.trim()}>Add Rule</Button>
      </div>

      {Object.keys(rules).length === 0 ? (
        <i>No rules yet</i>
      ) : (
        <ol className="ruleList">
          {Object.entries(rules).map(([key, value], index) => (
            <li key={key}>
              <span className="ruleNumber">{index + 1}</span>
              {editing?.key === key ? (
                <div className="ruleEdit">
                  <TextField
                    fullWidth
                    multiline
                    size="small"
                    autoFocus
                    value={editing.text}
                    onChange={(e) => setEditing({ key, text: e.target.value })}
                  />
                  <div className="manageActions">
                    <Button variant="contained" size="small" onClick={handleSaveEdit} disabled={!editing.text.trim()}>Save</Button>
                    <Button size="small" onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="ruleText">{value}</span>
                  <div className="manageActions">
                    <Button size="small" onClick={() => setEditing({ key, text: value })}>Edit</Button>
                    <Button size="small" color="error" onClick={() => handleDeleteRule(key)}>Delete</Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ol>
      )}
      <Snackbar open={alertOpen} autoHideDuration={4000} onClose={() => setAlertOpen(false)}>
        <Alert
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setAlertOpen(false);
              }}
            >
              <Close fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
          severity={alertLevel}
          variant="filled"
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </div>
  )
}
