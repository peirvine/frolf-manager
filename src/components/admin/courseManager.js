import AddCourse from  "./addCourse"
import ListCourses from "./listCourses"
export default function CourseManager () {
  return (
    <section className="manageCard">
      <h3>Courses</h3>
      <AddCourse />
      <ListCourses />
    </section>
  )
}