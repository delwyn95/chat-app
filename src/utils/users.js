const users = []

const addUser = ({ id, username, room }) => {
  // Clean the data
  username = username.trim().toLowerCase()
  room = room.trim().toLowerCase()
  // Validate data

  if (!username || !room) {
    return {
      error: 'Username and room are requred.'
    }
  }
  //Check for existing user
  const existingUser = users.find(user => {
    return user.room === room && user.username === username
  })

  if (existingUser) {
    return {
      error: 'Username is in use'
    }
  }

  //store user
  const user = { id, username, room }
  users.push(user)
  return { user }
}

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id)

  if(index !== -1){
    return users.splice(index,1)[0]
  }

}

//Get user + getUsersinRoom
const getUser = id => {
  const index = users.findIndex(user => user.id === id)

  return users[index]
}

const getUsersInRoom = room => {
  room = room.trim().toLowerCase()
  return users.filter((user) => user.room === room)
}


module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
}





