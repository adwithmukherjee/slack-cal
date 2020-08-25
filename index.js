const { caldata } = require("./events");
const express = require("express");
const axios = require("axios");
const http = require("http");
const bodyParser = require("body-parser");
const app = express();
const qs = require("qs");
//const { authorize, listEvents, getAccessToken } = require("./calendar")
const { callAPIMethod } = require("./api");
const { google } = require("googleapis");
const fs = require("fs");
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");
const { notStrictEqual } = require("assert");

let auth = null;
const TOKEN_PATH = "token.json";
const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

propdata1 = [
  {
    start: { dateTime: "2020-08-26T08:00:00-04:00" },
    end: { dateTime: "2020-08-26T09:15:00-04:00" },
  },
  {
    start: { dateTime: "2020-08-26T15:00:00-04:00" },
    end: { dateTime: "2020-08-26T15:15:00-04:00" },
  },
  {
    start: { dateTime: "2020-08-26T15:30:00-04:00" },
    end: { dateTime: "2020-08-26T16:30:00-04:00" },
  },
  {
    start: { dateTime: "2020-08-27T08:00:00-04:00" },
    end: { dateTime: "2020-08-27T09:15:00-04:00" },
  },
  {
    start: { dateTime: "2020-08-27T15:00:00-04:00" },
    end: { dateTime: "2020-08-27T15:15:00-04:00" },
  },
  {
    start: { dateTime: "2020-08-27T15:30:00-04:00" },
    end: { dateTime: "2020-08-27T16:30:00-04:00" },
  },
  {
    start: { dateTime: "2020-08-268T08:00:00-04:00" },
    end: { dateTime: "2020-08-28T09:15:00-04:00" },
  },
  {
    start: { dateTime: "2020-08-28T15:00:00-04:00" },
    end: { dateTime: "2020-08-28T15:15:00-04:00" },
  },
  {
    start: { dateTime: "2020-08-28T15:30:00-04:00" },
    end: { dateTime: "2020-08-28T16:30:00-04:00" },
  },
];

propdata2 = [
  {
    start: { dateTime: "2020-08-26T15:00:00-02:00" },
    end: { dateTime: "2020-08-26T15:15:00-05:00" },
  },
  {
    start: { dateTime: "2020-08-26T15:30:00-05:00" },
    end: { dateTime: "2020-08-26T16:30:00-05:00" },
  },
  {
    start: { dateTime: "2020-08-26T16:30:00-05:00" },
    end: { dateTime: "2020-08-26T20:00:00-05:00" },
  },
  {
    start: { dateTime: "2020-08-27T15:00:00-05:00" },
    end: { dateTime: "2020-08-27T15:15:00-05:00" },
  },
  {
    start: { dateTime: "2020-08-27T15:30:00-05:00" },
    end: { dateTime: "2020-08-27T16:30:00-05:00" },
  },
  {
    start: { dateTime: "2020-08-27T16:30:00-05:00" },
    end: { dateTime: "2020-08-27T20:00:00-05:00" },
  },
];

const listEvents = (auth) => {
  const calendar = google.calendar({ version: "v3", auth });
  calendar.events.list(
    {
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    },
    async (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const events = res.data.items;
      console.log(events);
      if (events.length) {
        await callAPIMethod("chat.postMessage", {
          channel: "D0190K38SG5",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `Here's a list of common available meeting times! Select one to invite to.`,
              },
            },
            {
              type: "section",
              block_id: "section567",
              text: {
                type: "mrkdwn",
                text: `• ${events[0].summary}`,
              },
              accessory: {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Send Invite",
                  emoji: false,
                },
              },
            },
            {
              type: "section",
              block_id: "section568",
              text: {
                type: "mrkdwn",
                text: `• ${events[1].summary ? events[1].summary : "nothing"}`,
              },
              accessory: {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Send Invite",
                  emoji: false,
                },
              },
            },
            {
              type: "section",
              block_id: "section569",
              text: {
                type: "mrkdwn",
                text: `• ${events[2].summary ? events[2].summary : "nothing"}`,
              },
              accessory: {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Send Invite",
                  emoji: false,
                },
              },
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Load more Options",
                    emoji: false,
                  },
                },
              ],
            },
          ],
        });
      } else {
        console.log("No upcoming events found.");
      }
    }
  );
};

const rawBodyBuffer = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || "utf8");
  }
};

app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));

app.get("/callback", (req, res) => {
  const { code } = req.query;

  auth.getToken(code, (err, token) => {
    if (err) return console.error("Error retrieving access token", err);
    auth.setCredentials(token);
    // Store the token to disk for later program executions
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      if (err) return console.error(err);
      console.log("Token stored to", TOKEN_PATH);
    });
  });
  listEvents(auth);
  console.log("test");
  res.redirect("slack://open");
  res.redirect("https://google.com");
});
/*
 * @param-- cal1, cal2 are two sets of events, one from the requestor, one from the attendee :
 */
const findBusyTimes = (cal1, cal2, offset) => {
  var parsed = [];
  var now = new Date();

  if (cal1) {
    console.log("USER 1");
    for (i = 0; i < cal1.length; i++) {
      if (cal1[i]["start"]["dateTime"]) {
        if (
          new Date(cal1[i]["start"]["dateTime"]).getDate() - now.getDate() ===
          offset
        ) {
          var starttime = Date.parse(cal1[i]["start"]["dateTime"]);
          var endtime = Date.parse(cal1[i]["end"]["dateTime"]);
          parsed.push({ start: starttime, end: endtime }); //date.parse is in UTC (so convert to timezone later)
        }
      }
    }
  }
  if (cal2) {
    console.log("USER 2");
    for (i = 0; i < cal2.length; i++) {
      //this gets all the start and end dates of the time
      if (cal2[i]["start"]["dateTime"]) {
        if (
          new Date(cal2[i]["start"]["dateTime"]).getDate() - now.getDate() ===
          offset
        ) {
          var starttime = Date.parse(cal2[i]["start"]["dateTime"]);
          var endtime = Date.parse(cal2[i]["end"]["dateTime"]);
          parsed.push({ start: starttime, end: endtime }); //date.parse is in UTC (so convert to timezone later)
        }
      }
    }
  }
  return parsed;
};

const findFreeTimes = (cal1, cal2, offset) => {
  if (!cal1 && !cal2) {
    return null;
  }
  var times = findBusyTimes(cal1, cal2, offset);

  var now = new Date();
  var morning;
  var evening;

  //get the time zone offsets to know which hours to gate by

  //console.log(parseInt(propdata2[0]["start"]["dateTime"].substring(19, 22)));
  let timezone1 = null;
  let timezone2 = null;
  if (cal1) {
    if (cal1[0]["start"]["dateTime"].substring(19, 20) == "Z") {
      timezone1 = 0;
    } else {
      timezone1 = parseInt(cal1[0]["start"]["dateTime"].substring(19, 22));
    }
    console.log(timezone1);
  }

  if (cal2) {
    if (cal2[0]["start"]["dateTime"].substring(19, 20) == "Z") {
      timezone2 = 0;
    } else {
      timezone2 = parseInt(cal2[0]["start"]["dateTime"].substring(19, 22));
    }
    console.log(timezone2);
  }

  //then it is after 12pm so find times for 2 days from now
  morning = new Date(); //set the morning as 2 days from now
  evening = new Date(); //set the morning as 2 days from now
  morning.setDate(now.getDate() + offset);
  // ideally want to go from 9 to 17
  if (timezone1 - timezone2 > 0) {
    morning.setHours(9 + (timezone1 - timezone2));
    evening.setHours(17);
  } else {
    morning.setHours(9);
    evening.setHours(17 + timezone1 - timezone2);
  }
  morning.setMinutes(0);
  morning.setSeconds(0);
  morning.setMilliseconds(0);
  evening.setDate(now.getDate() + offset);

  evening.setMinutes(0);
  evening.setSeconds(0);
  evening.setMilliseconds(0);

  var parsed = [{ start: Date.parse(morning), end: Date.parse(evening) }];
  for (i = 0; i < times.length; i++) {
    for (k = 0; k < parsed.length; k++) {
      if (parsed[k].end < times[i].start) {
        continue;
      }
      if (parsed[k].start > times[i].end) {
        // if the time block starts after the end of the free block the ignore
        continue;
      }
      if (
        parsed[k].start < times[i].start && // the event is inside the free block
        parsed[k].end > times[i].end
      ) {
        //the end of event is inside free block
        //if the times not free in question is within the block currently free
        parsed.push({ start: times[i].end, end: parsed[k].end }); //then split the array into two arrays with the original having the original start and new end,
        //then the other one should be end of the event and end of current one
        parsed[k].end = times[i].start; //then the original
      } else if (
        parsed[k].start >= times[i].start && // this means the event starts before the current bracket of free time
        parsed[k].end >= times[i].end //but the end of the free bracket happens after the time not free
      ) {
        //half of the event is the free time
        parsed[k].start = times[i].end; //then the start of the event is now later
      } else if (
        parsed[k].start <= times[i].start &&
        parsed[k].end <= times[i].end
      ) {
        parsed[k].end = times[i].start; //then the end of the event is now earlier
      }
      if (parsed[k].end === parsed[k].start) {
        parsed.splice(k, 1);
      }
    }
  }

  // now that the time slots where we're free were found, break them up into 30 minute increments

  let openslots = [];
  for (slots = 0; slots < parsed.length; slots++) {
    if (parsed[slots].start % 1800000 != 0) {
      parsed[slots].start += 1800000 - (parsed[slots].start % 1800000); //round up to the nearest half hour
    }
    let tracker = parsed[slots].start;
    while (parsed[slots].end - tracker >= 1800000) {
      openslots.push({ start: tracker, end: tracker + 1800000 });
      tracker += 1800000;
    }
  }
  return openslots;
};
const getRandomArbitrary = (min, max) => {
  return Math.random() * (max - min) + min;
};
app.get("/hello", (req, res) => {
  //var freeTime1 = findFreeTimes(propdata1);
  //var freeTime2 = findFreeTimes(propdata2);
  let busyTimes = findBusyTimes(propdata1, propdata2, 2); //[];
  // for (i = 2; i < 5; i++) {
  //   //get all the availabilities for the next three days starting two days out
  //   busyTimes.push(findBusyTimes(propdata1, propdata2, i));
  // }
  //<20
  var message = `These are the times you're not free:<br/>`;
  for (i = 0; i < busyTimes.length; i++) {
    message += ` ${new Date(busyTimes[i].start).toString()} to ${new Date(
      busyTimes[i].end
    ).toString()} <br/>`;
  }

  let freeTimes = []; //only need to run these lines to get a 2D array with all free times over three days
  for (day = 2; day < 5; day++) {
    //get all the availabilities for the next three days starting two days out
    freeTimes.push(findFreeTimes(propdata1, propdata2, day));
  }

  var messageFree = `<br/><br/>These are the times you ARE free:<br/>`; //this was just for test
  if (freeTimes) {
    //double nested for loop to print out each time one by one
    for (weekday = 0; weekday < freeTimes.length; weekday++) {
      for (i = 0; i < freeTimes[weekday].length; i++) {
        messageFree += `${new Date(
          freeTimes[weekday][i].start
        ).toString()} to ${new Date(
          freeTimes[weekday][i].end
        ).toString()} <br/>`;
      }
      messageFree += `<br/>`;
    }
  }
  res.send(message + messageFree);
});

app.post("/test", async (req, res) => {
  console.log(req.body);

  const { channel_id, user_id } = req.body;

  //CALENDAR STUFF

  const sendAuthUrl = async (oAuth2Client) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    console.log(authUrl);
    const response = await callAPIMethod("chat.postMessage", {
      channel: channel_id,
      text: `<${authUrl}|First, click here to link google calendar. > Then, run /scheduler again to send event invites!`,
    });
  };

  const authorize = (credentials) => {
    const { client_secret, client_id, redirect_uris } = credentials.web;

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    auth = oAuth2Client;

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, async (err, token) => {
      if (err) return sendAuthUrl(oAuth2Client);
      oAuth2Client.setCredentials(JSON.parse(token));
      listEvents(oAuth2Client);
    });
  };

  const credentialsPath =
    process.env.NODE_ENV === "production"
      ? "./config/credentials_prod.json"
      : "./config/credentials_dev.json";
  fs.readFile(credentialsPath, (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    // Authorize a client with credentials, then call the Google Calendar API.
    authorize(JSON.parse(content));
  });

  //SLACK TEST STUFF
  const conversation_info = await axios.get(
    `https://slack.com/api/conversations.members?token=xoxp-1301288377174-1306647213349-1315407075604-bbec7f6b4ebc601867f82ae4b5904e8d&channel=${channel_id}&pretty=1`
  );
  const { members } = conversation_info.data;
  console.log(members);
  const otherUser =
    members.length === 1
      ? members[0]
      : members[0] === user_id
      ? members[1]
      : members[0];
  console.log("OTHER USER", otherUser);
  let otherUserName = await axios.get(
    `https://slack.com/api/users.info?token=xoxp-1301288377174-1306647213349-1315407075604-bbec7f6b4ebc601867f82ae4b5904e8d&user=${otherUser}&pretty=1`
  );
  /*
    const response = await callAPIMethod(
        "chat.postMessage",

        {
            "channel": channel_id,
            "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": `Here's a list of common available meeting times! Select one to invite ${otherUserName.data.user.real_name} to.`
                  }
                },
                {
                  "type": "section",
                  "block_id": "section567",
                  "text": {
                    "type": "mrkdwn",
                    "text": "• 12:00pm (EST) Thursday, Aug 20, 2020"
                  },
                  "accessory": {
                    "type": "button",
                      "text": {
                          "type": "plain_text",
                          "text": "Send Invite",
                          "emoji": false
                      }
                  }
                },
                {
                    "type": "section",
                    "block_id": "section568",
                    "text": {
                      "type": "mrkdwn",
                      "text": "• 12:00pm (EST) Thursday, Aug 20, 2020 "
                    },
                    "accessory": {
                      "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Send Invite",
                            "emoji": false
                        }
                    }
                },
                {
                    "type": "section",
                    "block_id": "section569",
                    "text": {
                      "type": "mrkdwn",
                      "text": "• 12:00pm (EST) Thursday, Aug 20, 2020 "
                    },
                    "accessory": {
                      "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Send Invite",
                            "emoji": false
                        }
                    }
                },
                {
                    "type": "actions",
                    "elements": [
                      {
                        "type": "button",
                          "text": {
                              "type": "plain_text",
                              "text": "Load more Options",
                              "emoji": false
                          }
                      }
                    ]
                  }
               
                
              ]
            }
           
        
    )
    */

  res.end();
});

const server = app.listen(process.env.PORT || 5000, () => {
  console.log("Listening on port 5000");
});
