// Everyone we can name, by _id: the admin user list, plus the people the backend
// already puts inside audit entries and notifications (so closed staff still have a name).
export const peopleIndex = (users = [], embedded = []) => {
  const byId = {}
  for (const person of embedded) if (person?._id) byId[person._id] = person
  for (const user of users) byId[user._id] = user
  return byId
}
