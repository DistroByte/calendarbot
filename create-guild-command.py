from requests import post
from dotenv import dotenv_values #type:ignore

config_dict = dotenv_values(".env")
token = config_dict['TOKEN']
guild_id = config_dict['GUILD_ID']
application_id = config_dict['APPLICATION_ID']

url = 'https://discord.com/api/v10/applications/' + application_id + '/guilds/' + guild_id + '/commands'

# Command goes here
json = {
    "name": "timetable",
    "type": 1,
    "description": "Get your timetable for the day.",
    "options": [
        {
            "name": "course",
            "description": "The course code to query.",
            "type": 3,
            "required": True
        },
        {
            "name": "day",
            "description": "The day to query. Defaults to today.",
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