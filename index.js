const Discord = require('discord.js');
require('dotenv').config();

const scheduler = require('node-schedule');

const Labfree = require('./labfree.js')
const Timetable = require('./timetable.js')

const client = new Discord.Client({ intents: [Discord.GatewayIntentBits.DirectMessages] });

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

  if (commandName === 'checkfree') {
    const reply = Labfree.checkfree(interaction)

    await interaction.reply(
      reply
    );
  }

  else if (commandName === 'timetable') {

    console.log(`${interaction.user.username} used ${interaction.commandName}`)

    const courseCode = interaction.options.getString('course').split(' ')[0].toUpperCase();

    const shortDay = ['mon', 'tue', 'wed', 'thu', 'fri']
    const longDay = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    let day = Timetable.Weekdays[(new Date().getDay() - 1)];

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
    
    Timetable.FetchRawTimetableData(courseCode, day, new Date())
      .then(async (res) => {
        console.log(res)
        res = res[0].CategoryEvents;

        if (res.length < 1) {
          console.log('No events.') 
          return
        }

        res.sort(function (a, b) {
          var aDate = new Date(a.StartDateTime).getTime(), bDate = new Date(b.StartDateTime).getTime();
          return aDate - bDate;
        });

        let embed = new Discord.EmbedBuilder()
          .setTitle(`${courseCode} Timetable for ${day}`)
          .setColor('Green');

        res.forEach(module => {
          const locations = module.Location.split(', ');
          var locationArray = [];
          locations.forEach(location => {
            locationArray.push(location.split('.')[1]);
          })
          embed.addFields(
            {
              name: `${module.Name} (${module.Description})`, 
              value: `Time: ${new Date(module.StartDateTime).toLocaleTimeString().slice(0, -6)}-${new Date(module.EndDateTime).toLocaleTimeString().slice(0, -6)}\nLocation: ${locationArray.join(', ')}`
            },
          );
        });
        await interaction.reply({ embeds: [embed] });
      });
  }
})

/**
 * @param {Discord.User} user
 * @param {String} course
 */
const morningUpdate = function (user, course) {
  const day = Timetable.Weekdays[(new Date().getDay() - 1)];
  Timetable.FetchRawTimetableData(course, day, new Date())
    .then(async (res) => {
      res = res[0].CategoryEvents;

      if (res.length < 1) return

      res.sort(function (a, b) {
        var aDate = new Date(a.StartDateTime).getTime(), bDate = new Date(b.StartDateTime).getTime();
        return aDate - bDate;
      });

      let embed = new Discord.EmbedBuilder()
        .setTitle(`${course} Timetable for ${new Date().toDateString()}`)
        .setColor('Green');

      res.forEach(module => {
        const locations = module.Location.split(', ');
        var locationArray = [];
        locations.forEach(location => {
          locationArray.push(location.split('.')[1]);
        })
        embed.addFields(
          {
            name: `${module.Name} (${module.Description})`, 
            value: `Time: ${new Date(module.StartDateTime).toLocaleTimeString().slice(0, -6)}-${new Date(module.EndDateTime).toLocaleTimeString().slice(0, -6)}\nLocation: ${locationArray.join(', ')}`
          },
        );
      });

      embed.setDescription(`Times shown are in GMT+1`);
      user.send({ embeds: [embed] });
    });
}

client.login(process.env.TOKEN);

// Exporting the timetable stuff might be a good idea. Fuck, splitting them would be good.
