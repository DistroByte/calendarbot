const Request = require('request-promise')
require('dotenv').config();

const Weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] // Used to fetch the index for a day

const ReqHeaders = {
  'Authorization': 'basic T64Mdy7m[',
  'Content-Type': 'application/json; charset=utf-8',
  'credentials': 'include',
  'Referer': 'https://opentimetable.dcu.ie/',
  'Origin': 'https://opentimetable.dcu.ie/'
}

//

function StartOfWeek(DateToFetch) {
  var CurrentDate = DateToFetch
  var DateDifference = CurrentDate.getDate() - CurrentDate.getDay() + (CurrentDate.getDay() === 0 ? -6 : 1);

  FirstDayInWeek = new Date(CurrentDate.setDate(DateDifference)).toISOString() // Convert our date to ISOString
  return FirstDayInWeek.slice(0, -14).concat('T00:00:00.000Z') // Slice the date and add a time for midnight to the end
  // Outputs: YYYY-MM-DDT00:00:00.000Z
}

function ConstructRequestBody(Day, DateToFetch, CourseIdentity) {
  let RequestBodyTemplate = require('./body.json')

  FinalDayNumber = Weekdays.indexOf(Day) + 1

  RequestBodyTemplate['ViewOptions']['Weeks'][0]['FirstDayInWeek'] = StartOfWeek(DateToFetch)
  RequestBodyTemplate['ViewOptions']['Days'][0]['Name'] = Day
  RequestBodyTemplate['ViewOptions']['Days'][0]['DayOfWeek'] = Weekdays.indexOf(Day) + 1

  RequestBodyTemplate['CategoryIdentities'][0] = CourseIdentity

  return RequestBodyTemplate
}

async function FetchCourseCodeIdentity(Query) {

  var ReqPayload = {
    method: 'POST',
    uri: `https://opentimetable.dcu.ie/broker/api/CategoryTypes/241e4d36-60e0-49f8-b27e-99416745d98d/Categories/Filter?pageNumber=1&query=${Query}`,
    headers: ReqHeaders,
    json: true
  };

  return new Promise(function (resolve, reject) {
    Request(ReqPayload) // Send the HTTP Request
      .then(function (res_body) {
        let Results = res_body['Results']

        if (Results.length == 0) {
          reject('Course identity not found with supplied course code.')
        } else {
          resolve(res_body['Results'][0]['Identity'])
        }
      })
      .catch(function (err) { // Catch any errors
        reject(err)
      });
  })
}

async function FetchRawTimetableData(CourseCode, Day, DateToFetch = new Date()) {

  let CourseIdentity = await FetchCourseCodeIdentity(CourseCode);

  return new Promise(function (resolve, reject) {
    const ReqPayload = {
      method: 'POST',
      uri: 'https://opentimetable.dcu.ie/broker/api/categoryTypes/241e4d36-60e0-49f8-b27e-99416745d98d/categories/events/filter',
      headers: ReqHeaders,
      body: ConstructRequestBody(Day, DateToFetch, CourseIdentity),
      json: true
    };

    Request(ReqPayload) // Send the HTTP Request
      .then(async function (res_body) {
        await Promise.all(res_body[0].CategoryEvents.map(async event => {
          let moduleName = await FetchModuleNameFromCode(event.Name.slice(0, 5));
          return event.Name = moduleName;
        }))
        resolve(res_body)
      })
      .catch(function (err) { // Catch any errors
        reject(err)
      });
  })
}

async function FetchModuleNameFromCode(Query) {

  var ReqPayload = {
    method: 'POST',
    uri: `https://opentimetable.dcu.ie/broker/api/CategoryTypes/525fe79b-73c3-4b5c-8186-83c652b3adcc/Categories/Filter?pageNumber=1&query=${Query}`,
    headers: ReqHeaders,
    json: true
  };

  return new Promise(function (resolve, reject) {
    Request(ReqPayload) // Send the HTTP Request
      .then(function (res_body) {
        let Results = res_body['Results'];

        if (Results.length == 0) {
          reject('Course identity not found with supplied course code.');
        } else {
          resolve(res_body['Results'][0]['Name']);
        }
      })
      .catch(function (err) { // Catch any errors
        reject(err);
      });
  });
}

const Discord = require('discord.js');
const scheduler = require('node-schedule');

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
    await interaction.reply('Pong!');
  }

  else if (commandName === 'timetable') {

    console.log(`${interaction.user.username} used ${interaction.commandName}`)

    const courseCode = interaction.options.getString('course').split(' ')[0].toUpperCase();

    const shortDay = ['mon', 'tue', 'wed', 'thu', 'fri']
    const longDay = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    let day = Weekdays[(new Date().getDay() - 1)];

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
    
    FetchRawTimetableData(courseCode, day, new Date())
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
  const day = Weekdays[(new Date().getDay() - 1)];
  FetchRawTimetableData(course, day, new Date())
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
