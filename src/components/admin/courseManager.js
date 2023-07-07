import AddCourse from  "./addCourse"
import ListCourses from "./listCourses"
export default function CourseManager () {
  return (
    <div className="home">
      <h1>CourseManager</h1>
      <AddCourse />
      <ListCourses />
    </div>
  )
}