from requests import post
from dotenv import dotenv_values #type:ignore

config_dict = dotenv_values(".env")
token = config_dict['TOKEN']
guild_id = config_dict['GUILD_ID']
application_id = config_dict['APPLICATION_ID']

url = 'https://discord.com/api/v10/applications/' + application_id + '/guilds/' + guild_id + '/commands'

# Command goes here
json = {
    "name": "checkfree",
    "type": 1,
    "description": "Check if rooms are free during any period.",
    "options": [
        {
            "name": "rooms",
            "description": "The room codes to query, separated by space and case-insensitive.",
            "type": 3,
            "required": True
        },
        {
            "name": "hour",
            "description": "The hour to query. Defaults to now.",
            "type": 3
        },
    ]
}

# Header for authorisation
headers = {
    "Authorization": "Bot " + token
}

r = post(url, headers=headers, json=json)
print(r)