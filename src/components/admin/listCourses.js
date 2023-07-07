import React, {useState} from "react"
import { getCourses } from "../../services/courseService"

export default function ListCourses () {
  const [data, setData] = useState()

  getCourses().then((value) => {
    setData(value)
  })

  if (data) {
    return (
      <>
        <h3>The Courses™</h3>
        {data.map((x) => (
          <div className="course">
            <h4>{x.CourseName}</h4> {x?.Layouts.map((y) => (<div className="layouts">{y.Name} {y.Par}</div>))}
          </div>
        ))}
      </>
    )
  } else {
    return (<h3>Loading...</h3>)
  }
}