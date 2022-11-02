from requests import post
from dotenv import dotenv_values

config_dict = dotenv_values(".env")
token = config_dict['TOKEN']
guild_id = config_dict['GUILD_ID']
application_id = config_dict['APPLICATION_ID']

url = 'https://discord.com/api/v10/applications/' + application_id + '/guilds/' + guild_id + '/commands'

# Command goes here
json = {
    "name": "High Five",
    "type": 2
}

# Header for authorisation
headers = {
    "Authorization": "Bot " + token
}

r = post(url, headers=headers, json=json)