import React, { useState } from 'react'
import { Button, FormControl, TextField, Alert, Collapse } from "@mui/material"
import { createCourse } from "../../services/courseService"

let layoutList = []

export default function AddCourse () {
  const [open, setOpen] = useState(false)
  const [variant, setVariant] = useState('info')
  const [alertMessage, setAlertMessage] = useState('')
  const [courseName, setCourseName] = useState('')
  const [tempLayout, setTempLayout] = useState('')
  const [tempPar, setTempPar] = useState('')
  const [layouts, setLayouts] = useState([])

  const addCourse = () => {
    if (layouts.length < 1 || courseName === '') {
      setOpen(true)
      setVariant('error')
      setAlertMessage('Something went wrong, make sure that everything is filled out')
    } else {
      const card = {
        name: courseName,
        layouts
      }
      setOpen(true)
      setVariant('info')
      setAlertMessage('Adding scorecard, do not click submit again')
      const cardResult = createCourse(card)
      setVariant(cardResult.code)
      setAlertMessage(cardResult.message)
      setCourseName('')
      setTempLayout('')
      setTempPar('')
    }
  }

  const addLayout = () => {
    if (isNaN(parseInt(tempPar))){
      setOpen(true)
      setVariant('error')
      setAlertMessage('You have to put in a valid number for par')
    } else {
      layoutList.push(
        {
          Name: tempLayout,
          Par: parseInt(tempPar)
        }
      )
      setLayouts(layoutList)
      setTempLayout('')
      setTempPar('')
    }
  }
  return (
    <div className="addCourse">
      <h3>Add a Course</h3>
      <Collapse in={open}>
        <Alert severity={variant} onClose={() => setOpen(false)}>
          {alertMessage}
        </Alert>
      </Collapse>
      <FormControl>
        <TextField
          className="formItem"
          id="outlined-basic"
          label="Course Name"
          required
          variant="outlined"
          onInput={e => setCourseName(e.target.value)}
        />
        {layouts.map(layout => (
          <>{layout.Name} {layout.Par}</>
        ))}
        <FormControl>
          <TextField
            className="formItem"
            id="layout"
            label="Layout"
            required
            variant="outlined"
            onChange={(e) => setTempLayout(e.target.value)}
            value={tempLayout}
          />
          <TextField
            className="formItem"
            id="par"
            label="Par"
            required
            variant="outlined"
            onChange={(e) => setTempPar(e.target.value)}
            value={tempPar}
          />
          <Button onClick={addLayout}>Add Layout</Button>
        </FormControl>
        <Button variant="contained" onClick={() => addCourse()}>Add Course</Button>
      </FormControl>
    </div>
  )
}