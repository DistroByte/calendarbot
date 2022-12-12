const Request = require('request-promise')

const Weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] // Used to fetch the index for a day

const LocationIdentity = '1e042cb1-547d-41d4-ae93-a1f2c3d34538'
const ProgrammeIdentity = '241e4d36-60e0-49f8-b27e-99416745d98d'

function FetchDay() {
    return Weekdays[(new Date().getDay())]
};

function ExtractTimeFromDate(DateObject = new Date()) {
    const hour = DateObject.getHours();
    const minute = DateObject.getMinutes();
    return (hour + ':' + minute)
};

const ReqHeaders = {
    'Authorization': 'basic T64Mdy7m[',
    'Content-Type': 'application/json; charset=utf-8',
    'credentials': 'include',
    'Referer': 'https://opentimetable.dcu.ie/',
    'Origin': 'https://opentimetable.dcu.ie/'
}

//debug stuff.
const debug = false
function dbprint(label, output) {
    if (debug) {
        output = (typeof (output) === 'object') && JSON.stringify(output);
        console.log(label + '\n' + JSON.stringify(output) + '\n')
    }
}


function StartOfWeek(DateToFetch) {
    var CurrentDate = DateToFetch
    var DateDifference = CurrentDate.getDate() - CurrentDate.getDay() + (CurrentDate.getDay() === 0 ? -6 : 1);

    FirstDayInWeek = new Date(CurrentDate.setDate(DateDifference)).toISOString() // Convert our date to ISOString
    const output = FirstDayInWeek.slice(0, -14).concat('T00:00:00.000Z')
    return output
    // Slice the date and add a time for midnight to the end
    // Outputs: YYYY-MM-DDT00:00:00.000Z
}

function ConstructRequestBody(Day, DateToFetch, Identities, StartTime, EndTime) {
    let RequestBodyTemplate = require('./body.json')

    if (typeof(Identities) == 'string') {
        Identities = [Identities]
    };

    FinalDayNumber = Weekdays.indexOf(Day)

    RequestBodyTemplate['ViewOptions']['Weeks'][0]['FirstDayInWeek'] = StartOfWeek(DateToFetch)
    RequestBodyTemplate['ViewOptions']['Days'][0]['Name'] = Day
    RequestBodyTemplate['ViewOptions']['Days'][0]['DayOfWeek'] = FinalDayNumber

    if (typeof (StartTime) == 'string') {
        RequestBodyTemplate['ViewOptions']['TimePeriods'][0]['StartTime'] = StartTime
        RequestBodyTemplate['ViewOptions']['TimePeriods'][0]['EndTime'] = EndTime
    };

    RequestBodyTemplate['CategoryIdentities'] = Identities

    return RequestBodyTemplate
}

async function FetchCourseCodeIdentity(Query) {

    var ReqPayload = {
        method: 'POST',
        uri: `https://opentimetable.dcu.ie/broker/api/CategoryTypes/${ProgrammeIdentity}/Categories/Filter?pageNumber=1&query=${Query}`,
        headers: ReqHeaders,
        json: true
    };

    const output = new Promise(function (resolve, reject) {
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
    return output
}

async function FetchRawTimetableData(CodesToQuery, Day, DateToFetch = new Date(), Mode, StartTime, EndTime) {
    /*  two modes, 'programme' and 'location'. programme is the default.
        programme expects one string or a list with one string, location can take a list of any size.
        times are set to 8:00 - 22:00 if StartTime is not defined. */
    if (typeof (Mode) != 'string') {
        Mode = 'programme';
    };

    let IdentitiesToQuery
    let CategoryIdentity

    if (Mode == 'location') {
        CategoryIdentity = LocationIdentity;
    };

    if (Mode == 'programme') {
        CategoryIdentity = ProgrammeIdentity;
        IdentitiesToQuery = await FetchCourseCodeIdentity(CodesToQuery);
    };

    let output = new Promise(function (resolve, reject) {
        const ReqPayload = {
            method: 'POST',
            uri: `https://opentimetable.dcu.ie/broker/api/categoryTypes/${CategoryIdentity}/categories/events/filter`,
            headers: ReqHeaders,
            body: ConstructRequestBody(Day, DateToFetch, IdentitiesToQuery, StartTime, EndTime),
            json: true
        };

        Request(ReqPayload) // Send the HTTP Request
            .then(async function (res_body) {
                await Promise.all(res_body[0].CategoryEvents.map(async event => {
                    let moduleName = await FetchModuleNameFromCode(event.Name.slice(0, 5));
                    return event.Name = moduleName;
                }));

                resolve(res_body)
            })
            .catch(function (err) { // Catch any errors
                reject(err)
            });
    })
    return output
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

exported = {
    Weekdays, FetchDay, ExtractTimeFromDate, ReqHeaders, StartOfWeek, ConstructRequestBody, FetchCourseCodeIdentity, FetchRawTimetableData, FetchModuleNameFromCode
}

module.exports = exported