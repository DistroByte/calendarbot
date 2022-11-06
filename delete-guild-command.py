from requests import delete
from dotenv import dotenv_values #type:ignore

config_dict = dotenv_values(".env")
token = config_dict['TOKEN']
guild_id = config_dict['GUILD_ID']
application_id = config_dict['APPLICATION_ID']

print('Specify the Command ID of the command to delete.')
command_id = input()


# Header for authorisation
headers = {
    "Authorization": "Bot " + token
}

url = 'https://discord.com/api/v10/applications/' + application_id + '/guilds/' + guild_id + '/commands/' + command_id
r = delete(url, headers=headers)
print(r)
