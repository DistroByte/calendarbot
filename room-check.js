const Discord = require('discord.js')
const DiscordFunctions = require('./discord-functions.js')
const Timetable = require('./timetable.js')

const invoked = (require.main == module) ? true : false;

// for running directly
function main() {
    let interaction = {
        options: {
            rooms: null,
            hour: null
        }
    };
    const args = process.argv.slice(2);
    interaction.options.rooms = args[0];
    interaction.options.hour = args[1];

    output = checkFree(interaction);
    console.log(output);
};

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
    let outputEmbed = new Discord.EmbedBuilder()
        .setColor('Green');

    const inputCodes = findRoomIdentities(roomCodes);

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
    outputEmbed.setTitle(`Checking rooms for ${startHour}`)

    let currentDay = Timetable.FetchDay();

    await Timetable.FetchRawTimetableData(validRooms, currentDay, new Date(), 'location', startHour, endHour)
        .then(async (res) => {
            let freeRooms = []
            let foundEvents = {}

            res.forEach(roomObject => {
                //console.log(roomObject)
                let roomName = roomObject.Name.split('.')[1]
                let events = roomObject.CategoryEvents
                //console.log(roomName)
 
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
                //outputEmbed.addFields({ name: 'These events were found:' })
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
            // Not sure if this needs handling.
           } 
        });
    const embedsToSend = (!errorEmbed.data.fields) ? [outputEmbed] : [errorEmbed, outputEmbed];
    return embedsToSend
};

exported = {
    checkFree
};

if (invoked) {
    main()
};

module.exports = exported;