// const messages = require('../../src/utils/messages'); //don't know why this is here, or how it got here, but it's causing errors. 
//initially: only `io()`, the bare minimum, but of course you'd want to access stuff from there.
const socket = io();

// server (emit) -> client (receive) --acknowledgemet --> Server

// client (emit) -> server (receive) --acknowledgemet --> client

// Elements
const $messageForm = document.querySelector('#message-form'); //$ is convention that it's an element from the DOM
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML; //innertHTML gives access to the inner HTML of the tempalte
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    // Grab new message element
    const $newMessage = $messages.lastElementChild; //$ because syntax convention for storing an element. 

    // Get height of new message by adding height of message + margin to get total height
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Get visible height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far down are you scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight; // gives amount of distance scrolled from the top + visible height

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}

// Event handling
socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('MMMM Do YYYY, HH:mm:ss')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (message) => {
    console.log(message);
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('MMMM Do YYYY, HH:mm:ss')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({ room, users}) => {
    // The code below creates an html from the template retrieved from chat.html,
    // with the object data passed into it. Then, you put this html inside the sidebar
    // div in the DOM. 
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault(); //to prevent a full page refresh on the event

    //disable the form
    $messageFormButton.setAttribute('disabled', 'disabled');

    //old way of getting the message, before you gave the 'input' element a name (the name is now 'message')
    // const message = document.querySelector('input').value;
    const message = e.target.elements.message.value;
    socket.emit('sendMessage', message, (error) => {
        
        //enable form again
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = ''; //clear form
        $messageFormInput.focus(); //move focus to input field
        
        if (error) {
            return console.log(error);
        }

        console.log('The message was delivered!')
    });
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser...');
    }

    $sendLocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        //console.log(position);
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location shared!');
            $sendLocationButton.removeAttribute('disabled');
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error); // could also be inside of a modal if you like.
        location.href = '/';
    }
});