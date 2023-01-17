require('dotenv').config();

const fs = require('fs');
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

console.log('Make sure command-ids.txt is present in the current directory.')
input.question('Delete a Guild or Application command? [G/a] ', userInput => {
        input.close();
        userInput = userInput.toUpperCase()
        if (userInput == 'G' || userInput == '') {
            console.log(`Deleting commands from guild`)
            main()
        } else if (userInput == 'A') {
            console.log(`Deleting commands globally, remember that Discord rate limits this`)
            main(true)
        } else {
            console.log(`Invalid response, exiting`)
        }
})


function main(global) {
    const URL = (global) ? appRegisterURL : guildRegisterURL;
    const commandIDs = fs.readFileSync('./command-ids.txt', 'utf-8').split(/\s+/)
    commandIDs.forEach(
        commandID => {
            fetch(`${URL}\\${commandID}`, {
                method: 'DELETE',
                headers: headers
            }).then(
                res => {
                    if (res.ok) {
                        console.log(`Successfully deleted ${commandID}, response ${res.status} (${res.statusText})`)
                    } else {
                        console.log(`Failed to delete ${commandID}, response ${res.status} (${res.statusText})`)
                    };
                }
            ).catch(
                err => {
                    console.log(`Failed to make request for ${commandID} (${err})`)
                }
            )
        }
    )
}
