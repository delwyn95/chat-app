const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require('./utils/users')

const app = express()
const server = http.createServer(app)
// socketio expects it to be called with raw HTTP server
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

//  Setting up static directory to serve
app.use(express.static(publicDirectoryPath))
let count = 0

io.on('connection', socket => {
  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options })

    if (error) {
      return callback(error)
    }

    socket.join(user.room)

    socket.emit('message', generateMessage('SYSTEM',`Welcome to ${user.room}!`))
    socket.broadcast
      .to(user.room)
      .emit('message', generateMessage('SYSTEM',`${user.username} has joined!`))

    //add data to keep track on whos in room
    io.to(user.room).emit('roomData',{
      room:user.room,
      users:getUsersInRoom (user.room)
    })

    callback()
  })

  socket.on('sendMessage', (incoming, callback) => {

    const id = socket.id
    const user = getUser(id)

    const filter = new Filter()
    if (filter.isProfane(incoming)) {
      return callback('Profanity not allowed')
    }
    io.to(user.room).emit('message', generateMessage(user.username,incoming))
    callback()
  })

  socket.on('sendLocation', (incoming, callback) => {
    const { latitude, longitude } = incoming
    const id = socket.id
    const user = getUser(id)
    const locationUrl = `https://google.com/maps?q=${latitude},${longitude}`

    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,locationUrl))
    callback('Location Shared!')
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage('SYSTEM',`${user.username} has left!`)
      )
      //updating active list
      io.to(user.room).emit('roomData',{
        room:user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })
})

server.listen(port, () => {
  console.log('Server is up on port ' + port)
})
