// import { DataStore } from '@aws-amplify/datastore';
// import { DoinkFund } from '../models/index';

export async function updateDoink(id, newDoink) {
  // const original = await DataStore.query(DoinkFund, id);
  //   /* Models in DataStore are immutable. To update a record you must use the copyOf function
  // to apply updates to the item’s fields rather than mutating the instance directly */
  // if (original) {
  //   const updatedDoink = await DataStore.save(
  //     DoinkFund.copyOf(original, updated => {
  //       updated.Balance = newDoink
  //     })
  //   );
  //   return updatedDoink
  // }
}

export async function getAllDoinkBalance() {
  // return await DataStore.query(DoinkFund);
}

export async function addNewDoinkUser(name) {
  // await DataStore.save(
  //   new DoinkFund({
  //     "Name": name,
  //     "Balance": 0
  //   })
  // );
}