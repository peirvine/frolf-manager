// import { DataStore } from '@aws-amplify/datastore';
// import { Courses } from '../models/index';

export async function getCourses() {
  // const models = await DataStore.query(Courses);
  // return models
}

export function createCourse ( course ) {
  // createCourseInAmazon(course)
  // return {code: "success", message: "Course Added Successfully"}
}

export async function createCourseInAmazon ( course ) {
  // await DataStore.save(
  //   new Courses({
  //     "CourseName": course.name,
  //     "Layouts": course.layouts
  //   })
  // );
}

export async function updateCourse ( course ) {
  // const original = await DataStore.query(Courses, course.id);

  // /* Models in DataStore are immutable. To update a record you must use the copyOf function
  // to apply updates to the item’s fields rather than mutating the instance directly */
  // await DataStore.save(Courses.copyOf(original, item => {
  //     item.CourseName = course.name
  //     item.Layouts = course.layouts
  //   // Update the values on {item} variable to update DataStore entry
  // }));
}

export async function deleteCourse ( course ) {
  // console.log(course)
  // const modelToDelete = await DataStore.query(Courses, 123456789);
  // DataStore.delete(modelToDelete);
}