const users = [];

const addUser = ({ id, username, room }) => {
    // clean the data
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    // validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }

    // check for existing user
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username;
    });

    // validate username
    if (existingUser) {
        return {
            error: 'Username is in use for this room!'
        }
    }

    // store user
    const user = { id, username, room };
    users.push(user);
    return { user };
}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id);
    // // equivalent to: (shorthand syntax for iterating over an array)
    // const index = users.findIndex((user) => {
    //     return user.id === id;
    // });

    if (index !== -1) {
        return users.splice(index, 1)[0]; //because splice returns an array of all removed elements, but you only will remove one, so just return the 0th element.
    }
}

const getUser = (id) => {
    return users.find((user) => user.id === id);
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase();
    return users.filter((user) => user.room === room);
}

module.exports = { 
    addUser, 
    removeUser,
    getUser,
    getUsersInRoom
};