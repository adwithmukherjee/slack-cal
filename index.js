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

let auth = null;
const TOKEN_PATH = "token.json";
const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

propdata1 = [
  {
    start: { dateTime: "2020-08-21T08:00:00-04:00" },
    end: { dateTime: "2020-08-21T09:15:00-04:00" },
  },
  {
    start: { dateTime: "2020-08-21T15:00:00-04:00" },
    end: { dateTime: "2020-08-21T15:15:00-04:00" },
  },
  {
    start: { dateTime: "2020-08-21T15:30:00-04:00" },
    end: { dateTime: "2020-08-21T16:30:00-04:00" },
  },
];

propdata2 = [
  {
    start: { dateTime: "2020-08-21T15:00:00-05:00" },
    end: { dateTime: "2020-08-21T15:15:00-05:00" },
  },
  {
    start: { dateTime: "2020-08-21T15:30:00-05:00" },
    end: { dateTime: "2020-08-21T16:30:00-05:00" },
  },

  {
    start: { dateTime: "2020-08-21T16:30:00-05:00" },
    end: { dateTime: "2020-08-21T20:00:00-05:00" },
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

const findFreeTimes = (times) => {
  var now = new Date();
  var morning;
  var evening;
  if (now.getHours() > 12) {
    //then it is after 12pm so find times for 2 days from now
    morning = new Date(); //set the morning as 2 days from now
    morning.setDate(now.getDate() + 2);
    morning.setHours(8);
    morning.setMinutes(0);
    morning.setSeconds(0);

    morning.setMilliseconds(0);

    evening = new Date(); //set the morning as 2 days from now
    evening.setDate(now.getDate() + 2);
    evening.setHours(20);
    evening.setMinutes(0);
    evening.setSeconds(0);

    evening.setMilliseconds(0);
  } else {
    //we're somewhere before 12pm on the day so
    morning = new Date(); //set the morning as 2 days from now
    morning.setDate(now.getDate());
    morning.setHours(8);
    morning.setMinutes(0);
    morning.setSeconds(0);

    morning.setMilliseconds(0);

    evening = new Date(); //set the morning as 2 days from now
    evening.setDate(now.getDate());
    evening.setHours(20);
    evening.setMinutes(0);
    evening.setSeconds(0);

    evening.setMilliseconds(0);
  }

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
  return parsed;
};

const findBusyTimes = (cal1, cal2) => {
  var parsed = [];

  for (i = 0; i < cal1.length; i++) {
    //this gets all the start and end dates of the time
    if (cal1[i]["start"]["dateTime"]) {
      var starttime = Date.parse(cal1[i]["start"]["dateTime"]);
      var endtime = Date.parse(cal1[i]["end"]["dateTime"]);
      parsed.push({ start: starttime, end: endtime }); //date.parse is in UTC (so convert to timezone later)
    }
  }

  for (i = 0; i < cal2.length; i++) {
    //this gets all the start and end dates of the time
    if (cal2[i]["start"]["dateTime"]) {
      var starttime = Date.parse(cal2[i]["start"]["dateTime"]);
      var endtime = Date.parse(cal2[i]["end"]["dateTime"]);
      parsed.push({ start: starttime, end: endtime }); //date.parse is in UTC (so convert to timezone later)
    }
  }

  return parsed;
};

app.get("/hello", (req, res) => {
  //var freeTime1 = findFreeTimes(propdata1);
  //var freeTime2 = findFreeTimes(propdata2);
  var busyTimes = findBusyTimes(propdata1, propdata2);
  var message = `These are the times you're not free:<br/>`;
  for (i = 0; i < busyTimes.length; i++) {
    message += `${new Date(busyTimes[i].start).toString()} to ${new Date(
      busyTimes[i].end
    ).toString()} <br/>`;
  }

  var freeTimes = findFreeTimes(busyTimes);
  var messageFree = `<br/><br/>These are the times you ARE free:<br/>`;
  for (i = 0; i < freeTimes.length; i++) {
    messageFree += `${new Date(freeTimes[i].start).toString()} to ${new Date(
      freeTimes[i].end
    ).toString()} <br/>`;
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
