require('dotenv').config();
const commandJSON = require('./bot-commands.json')

const readline = require('readline');
const input = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const guildRegisterURL = 'https://discord.com/api/v10/applications/' + process.env.APPLICATION_ID + '/guilds/' + process.env.GUILD_ID + '/commands'
const appRegisterURL = 'https://discord.com/api/v10/applications/' + process.env.APPLICATION_ID + '/commands'

const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bot ' + process.env.BOT_TOKEN
}

input.question("Register to Guild or as Application commands? [G/a] ", userInput => {
        input.close();
        userInput = userInput.toUpperCase()
        if (userInput == 'G' || userInput == '') {
            console.log(`Registering commands to guild`)
            main()
        } else if (userInput == 'A') {
            console.log(`Registering commands globally, remember that Discord rate limits this`)
            main(true)
        } else {
            console.log(`Invalid response, exiting`)
        }
})

function main(global) {
    const URL = (global) ? appRegisterURL : guildRegisterURL;
    commandJSON.forEach(
        commandData => {
            //console.log(JSON.stringify(commandData))
            fetch(URL, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(commandData)
            }).then(
                res => {
                    if (res.ok) {
                        console.log(`Successfully registered ${commandData.name}, response ${res.status} (${res.statusText})`)
                    } else {
                        console.log(`Failed to register ${commandData.name}, response ${res.status} (${res.statusText})`)
                    };
                }
            ).catch(
                err => {
                    console.log(`Failed to make request for ${commandData.name} (${err})`)
                }
            )
        }
    )
}