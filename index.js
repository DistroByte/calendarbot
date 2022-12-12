const Discord = require('discord.js');
require('dotenv').config();

const scheduler = require('node-schedule');

const RoomCheck = require('./room-check.js')
const Timetable = require('./timetable.js')
const DiscordFunctions = require('./discord-functions.js')

const client = new Discord.Client({ intents: [Discord.GatewayIntentBits.DirectMessages] });

const debug = true
function dbprint(string) {
    if (debug) console.log(string);
};

client.on('ready', async () => {
    console.log(`${client.user.username} is online!`);

    const userIDs = ['180375991133143040', '798999606288973824', '196704710072205313', '168784878681325569', '747920741638471681', '223814642080677888', '343794669492109312', '354654294269624320', '424297185950302208', '228036177817632770', '757567277909672028', '625611592024981525', '206132779866390528'];
    const userCourses = ['CASE3', 'CASE3', 'CASE3', 'CASE3', 'CASE3', 'CASE3', 'CASE3', 'CASE3', 'CASE3', 'CASE3', 'CASE3', 'CASE3', 'CASE3'];
    //const userIDs = ['180375991133143040']
    //const userCourses = ['CASE3']
    let users = [];
    for await (user of userIDs) {
        users.push(await client.users.fetch(user));
    }
    console.log(`Loaded users`);
    scheduler.scheduleJob('0 6 * * *', () => {
        users.forEach(user => {
            try {
                morningUpdate(user, userCourses[userIDs.indexOf(user.id)]);
            } catch (err) {
                console.log(err);
            }
        });
    })
    morningUpdate(users[0], 'CASE3');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ping') {
        await interaction.reply(
            'Pong!'
        );
    }


    if (commandName === 'timetable') {

        console.log(`${interaction.user.username} used ${interaction.commandName}`)

        const courseCode = interaction.options.getString('course').split(' ')[0].toUpperCase();

        const shortDay = ['mon', 'tue', 'wed', 'thu', 'fri']
        const longDay = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        let day = Timetable.FetchDay();

        if (interaction.options.getString('day') || interaction.options.getString('course').split(' ')[1]) {
            day = interaction.options.getString('day') || interaction.options.getString('course').split(' ')[1];
            day = day.toLowerCase()
            if (!shortDay.includes(day) && !longDay.includes(day)) return await interaction.reply({ content: 'Please include a valid day', ephemeral: true });

            if (day.length > 3) {
                day = longDay.find(toFind => toFind == day)
                day = day.charAt(0).toUpperCase() + day.slice(1)
            } else {
                day = longDay[shortDay.indexOf(day)]
                day = day.charAt(0).toUpperCase() + day.slice(1)
            }
        }

        Timetable.FetchRawTimetableData(courseCode, day, new Date('2022-11-28'))
            .then(async (res) => {
                res = res[0].CategoryEvents;
                //console.log(res)

                if (res.length < 1) {
                    let embed = DiscordFunctions.buildErrorEmbed(commandName, `No events found for ${courseCode}.`)
                    await interaction.reply({ embeds: [embed] });
                    return
                }

                let embed = new Discord.EmbedBuilder()
                    .setTitle(`${courseCode} Timetable for ${day}`)
                    .setColor('Green');

                embed = DiscordFunctions.parseEvents(res, embed)

                await interaction.reply({ embeds: [embed] });
            });
    }

    if (commandName === 'checkfree') {
        embedsToSend = RoomCheck.checkFree(interaction)

        await interaction.reply(
            {embeds: embedsToSend}
        )
    }
    /*
    else {
        let embed = DiscordFunctions.buildErrorEmbed(commandName, `This command doesn't seem to exist.`);

        await interaction.reply(
            {embeds: [embed]}
        );
    };
    */
});

/**
 * @param {Discord.User} user
 * @param {String} course
 */
const morningUpdate = function (user, course) {
    if (!debug) {
        const day = Timetable.Weekdays[(new Date().getDay() - 1)];
        Timetable.FetchRawTimetableData(course, day, new Date())
            .then(async (res) => {
                res = res[0].CategoryEvents;

                if (res.length < 1) return

                let embed = new Discord.EmbedBuilder()
                    .setTitle(`${course} Timetable for ${new Date().toDateString()}`)
                    .setColor('Green');

                embed = DiscordFunctions.parseEvents(res, embed)

                embed.setDescription(`Times shown are in GMT+1`);
                user.send({ embeds: [embed] });
            });
    }
}

client.login(process.env.TOKEN);