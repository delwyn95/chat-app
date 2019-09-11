const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.getElementById('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages') //location to render template

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML  //template here
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const queryString = Qs.parse(location.search, { ignoreQueryPrefix:true })
const {username, room} = queryString

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild

  //Height of the message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  console.log(newMessageMargin)

  //Visible height
  const visibleHeight = $messages.offsetHeight

  //Height of messages container
  const containerHeight = $messages.scrollHeight

  //Find where we are scrolled
  //ScrollTop : amount of distance from top. @ Top = 0.
  const scrollOffset = $messages.scrollTop + visibleHeight // accurate distance to the bottom

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }

}

socket.on('message', incoming => {
  console.log(incoming)
  const html = Mustache.render(messageTemplate,{
    username:incoming.username,
    message: incoming.text,
    createdAt: moment(incoming.createdAt).format('h:mm A')
  })
  $messages.insertAdjacentHTML('beforeend',html)
  autoscroll()
})

socket.on('locationMessage',(incoming) => {
  console.log(incoming)
  const html = Mustache.render(locationMessageTemplate,{
    username: incoming.username,
    url: incoming.url,
    createdAt: moment(incoming.createdAt).format('h:mm A')
  })
  $messages.insertAdjacentHTML('beforeend',html)
  autoscroll()
})

socket.on('roomData', ({room, users})=>{
  const html = Mustache.render(sidebarTemplate,{
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', event => {
  event.preventDefault()

  $messageFormButton.setAttribute('disabled',true)
  //Disable form button here
  // alternatively, can use below to fetch value
  // const message = event.target.elements.message

  socket.emit('sendMessage', $messageFormInput.value, error => {

    // Enable
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = ''
    $messageFormInput.focus()
    if (error) {
      return console.log(error)
    }
    console.log('Messaged Delivered')
  })
})

$sendLocationButton.addEventListener('click', () => {
  $sendLocationButton.setAttribute('disabled',true)
  if (!navigator.geolocation) {
    $sendLocationButton.removeAttribute('disabled')
    return alert('Geolocation is not supported by your browser')
  }

  navigator.geolocation.getCurrentPosition(position => {
    $sendLocationButton.removeAttribute('disabled')
    const { longitude, latitude } = position.coords
    const location = { latitude, longitude }

    socket.emit('sendLocation', location, () => {
      console.log('Location Sent')
    })
  })
})

socket.emit('join', {username,room}, (error) => {
  if (error) {
    alert(error)
    location.href = "/"
  }
})
