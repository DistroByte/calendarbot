const Discord = require('discord.js')
const DiscordFunctions = require('./discord-functions.js')
const Timetable = require('./timetable.js')

function timeToString(time) {
    time = '0' + time.toString() + ':00';
    time = time.slice(-5);
    return time
}

function findRoomIdentities(codesToQuery) {
    let rooms = {};
    let invalidRooms = [];
    let roomIDs = require('./gla-room-ids.json');

    codesToQuery.forEach(inputCode => {
        let roomID = roomIDs[inputCode]
        if (roomID != undefined) {
            rooms[inputCode] = roomID
        } else {
            invalidRooms.push(inputCode)
        };
    });
    return [rooms, invalidRooms]
};

async function checkFree(errorEmbed, roomCodes, startHour) {
    // roomCodes must be a list of strings
    const inputCodes = await findRoomIdentities(roomCodes);

    const validRooms = Object.values(inputCodes[0]);
    const invalidRooms = inputCodes[1];

    if (validRooms.length == 0) {
        errorEmbed = errorEmbed.addErrorField('None of the given rooms were found in the GLA database', `${invalidRooms.join(', ')}`);
        return [errorEmbed]
    };
    if (invalidRooms.length > 0) {
        errorEmbed = errorEmbed.addErrorField(`These rooms were not found in the GLA database`, `${invalidRooms.join(', ')}`);
    };

    if (!(startHour in Discord.range(0, 23))) {
        if (startHour != null) {
            errorEmbed = errorEmbed.addErrorField('Given hour was invalid. Using current time.')
        };
        startHour = new Date().getHours();
    };

    let endHour = timeToString(parseInt(startHour) + 1);
    startHour = timeToString(startHour);

    let outputEmbed = new Discord.EmbedBuilder()
        .setColor('Green')
        .setTitle(`Checking rooms for ${startHour}`);

    await Timetable.FetchRawTimetableData(validRooms, Timetable.FetchDay(), new Date(), 'location', startHour, endHour)
        .then(async (res) => {
            let freeRooms = []
            let foundEvents = {}

            res.forEach(roomObject => {
                let roomName = roomObject.Name.split('.')[1]
                let events = roomObject.CategoryEvents
 
                if (events.length > 0) {
                    foundEvents[roomName] = []
                    events.forEach(
                        event => {
                            foundEvents[roomName].push(event.Name)
                        }
                    )
                } else {
                    freeRooms.push(roomName)
                };
            });

            if (foundEvents != {}) {
                Object.entries(foundEvents).forEach(
                    room => {
                        outputEmbed.addFields({ name: room[0], value: room[1].join('\n'), inline: true})
                    }
                )
            }  

            outputEmbed.addFields({ name: `These rooms are free from ${startHour}-${endHour}`, value: freeRooms.join('\n') })
        })
        .catch(() => {
            err => {
                console.error(err)
            } 
        });
    const embedsToSend = (!errorEmbed.data.fields) ? [outputEmbed] : [errorEmbed, outputEmbed];
    return embedsToSend
};

exported = {
    checkFree
};

module.exports = exported;