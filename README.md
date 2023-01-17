# calendarbot
## Get started
Fill in `.env` with the variables `BOT_TOKEN`, `APPLICATION_ID` and `GUILD_ID` (if you want to register guild commands). Then run `register-bot-commands.js`.

## Managing commands
Run `register-bot-commands.js` and it will register everything in `bot-commands.json` (which is filled out with all the commands already). `delete-bot-commands.js` takes every command ID in `command-ids.txt` (separated by whitespace) and unregisters. Both programs ask whether to register to guild or application.
Also, fetch was added to NodeJS in v17.5, so don't use any super old Node installs.