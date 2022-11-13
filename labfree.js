const { range } = require('discord.js')

const Index = require('./index.js')


let free_rooms = []
let invalid_rooms = []
let taken_rooms = []
let events_found = []

function checkfree(interaction) {
    let reply = '' //this is going to have to be turned into one of those embed things but that will come later.

    const roomCodes = interaction.options.getString('rooms').toUpperCase().split(' ');
    let hour = interaction.options.getString('hour')

    //must check if the hour is valid
    if (!(hour in range(0, 23))) {
        if (!(hour == null)) {
            reply += 'Given hour was invalid. '
        }

        reply += 'Using current time.\n'
        hour = new Date().getHours()
    }

    reply += 'Checking rooms ' + roomCodes + ' at hour ' + hour

    return reply
}

exported = {
    checkfree
};

module.exports = exported;