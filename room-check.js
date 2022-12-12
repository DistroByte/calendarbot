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

function checkFree(interaction) {
    const { commandName } = interaction
    let outputEmbed = new Discord.EmbedBuilder()
        .setColor('Green');

    let errorEmbed = DiscordFunctions.buildErrorEmbed(commandName)

    const roomCodes = (invoked) ? interaction.options.rooms.toUpperCase().split(' ') : interaction.options.getString('rooms').toUpperCase().split(' ');
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

    let startHour = (invoked) ? interaction.options.hour : interaction.options.getString('hour');
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

    output = []

    Timetable.FetchRawTimetableData(validRooms, 'Tuesday', new Date('2022-11-29'), 'location', startHour, endHour)
        .then(async (res) => {
            //console.log(res[0], '\nthe stuff goes here\n\n')
            //console.log(res)

            let freeRooms = []

            res.forEach(roomObject => {
                //console.log(roomObject)
                let roomName = roomObject.Name.split('.')[1]
                let events = roomObject.CategoryEvents
                console.log(roomName, events)
 
                if (events.length > 0) {
                    console.log('c')
                } else {
                    freeRooms.push(roomName)
                };
            });

            /*
            res.sort(function (a, b) {
                var aDate = new Date(a.StartDateTime).getTime(), bDate = new Date(b.StartDateTime).getTime();
                return aDate - bDate;
            });

            res.forEach(module => {
                const locations = module.Location.split(', ');
                var locationArray = [];
                locations.forEach(location => {
                    locationArray.push(location.split('.')[1]);
                })
                output.push(
                    {
                        name: `${module.Name} (${module.Description})`,
                        value: `Time: ${new Date(module.StartDateTime).toLocaleTimeString().slice(0, -6)}-${new Date(module.EndDateTime).toLocaleTimeString().slice(0, -6)}\nLocation: ${locationArray.join(', ')}`
                    },
                );
            });
            */
        })
        .catch(() => {
            
        });

    //reply += `Checking rooms ${roomCodes} at hour ${startHour}, for today, which is ${currentDay}, or more technically ${currentDate}.`;
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