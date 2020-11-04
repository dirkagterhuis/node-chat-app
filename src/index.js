const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users');

const app = express();
const server = http.createServer(app); //express does this behind the scenes anyways. 
const io = socketio(server); //but you need the 'server' variable because socket.io needs it as param

const port = process.env.PORT || 3000;
const publicDirectoryPath = path .join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

// methods to send events from server -> client: socket.emit, io.emit, socket.broadcast.emit. But now also: 
// io.to.emit (emits event to everybody in specific 'room'), socket.broadcast.to.emit (to everyone except client, limited to 'room')

io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });
        
        if (error) {
            return callback(error);
        }

        socket.join(user.room);
        socket.emit('message', generateMessage('Admin', 'Welcome earthling!'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined the room!`)); // first was without '.to(room)'
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });
        
        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        if (filter.isProfane(generateMessage(user.username, message))) {
            return callback('Profanity is not allowed!')
        }
        
        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback(); //acknowledge here
    });

    socket.on('sendLocation', (coords, callback) => { // first was without callback
        const user = getUser(socket.id);
        // io.emit('message', `Location: ${coords.latitude}, ${coords.longitude}`)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left! Bye bye!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => { //was app.listen before using socket.io
    console.log(`Server is up on port ${port}!`)
});