const Discord = require('discord.js')

function parseEvents(eventList, embed, addLocation) {
    // location determines whether or not to add the location
    
    eventList.sort(function (a, b) {
        var aDate = new Date(a.StartDateTime).getTime(), bDate = new Date(b.StartDateTime).getTime();
        return aDate - bDate;
    });

    eventList.forEach(event => {
        const locations = event.Location.split(', ');
        var locationArray = [];
        locations.forEach(location => {
            locationArray.push(location.split('.')[1]);
        })
        embed.addFields(
            {
                name: `${event.Name} (${event.Description})`,
                value: `Time: ${new Date(event.StartDateTime).toLocaleTimeString().slice(0, -6)}-${new Date(event.EndDateTime).toLocaleTimeString().slice(0, -6)}\nLocation: ${locationArray.join(', ')}`
            },
        );
    });
    return embed
};

// embedObject can either be the commandname or an embed object to add info to.
function buildErrorEmbed(commandName, fieldTitle, fieldValue) {
    let outputEmbed = new Discord.EmbedBuilder()
            .setTitle(`Error*(s)* with command: \`/${commandName}\``)
            .setColor('Red');

    outputEmbed.addErrorField = function (errorTitle, errorValue) {
        this.addFields({
            name: errorTitle,
            value: (errorValue) ? errorValue : '\u200b'
        });
        return this
    };

    if (fieldTitle) {
        outputEmbed = outputEmbed.addErrorField(fieldTitle, fieldValue)
    };
    return outputEmbed    
};

exported = {
    parseEvents, buildErrorEmbed
};

module.exports = exported;