const express = require("express");
const axios = require("axios")
const http = require("http");
const bodyParser = require("body-parser")
const app = express(); 
const qs = require("qs")
//const { authorize, listEvents, getAccessToken } = require("./calendar")
const { callAPIMethod } = require("./api")
const {google} = require('googleapis');
const fs = require('fs');

let auth = null; 
const TOKEN_PATH = 'token.json';
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

const listEvents = (auth) => {
    const calendar = google.calendar({version: 'v3', auth});
    calendar.events.list({
      calendarId: 'primary',
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    }, async (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const events = res.data.items;
      console.log(events)
      if (events.length) {
        await callAPIMethod(
            'chat.postMessage', 
            {
                "channel": 'D0190K38SG5',
                "blocks": [
                    {
                      "type": "section",
                      "text": {
                        "type": "mrkdwn",
                        "text": `Here's a list of common available meeting times! Select one to invite to.`
                      }
                    },
                    {
                      "type": "section",
                      "block_id": "section567",
                      "text": {
                        "type": "mrkdwn",
                        "text": `• ${events[0].summary}`
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
                          "text": `• ${events[1].summary ? events[1].summary : "nothing"}`
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
                          "text": `• ${events[2].summary ? events[2].summary : "nothing"}`
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
      } else {
        console.log('No upcoming events found.');
      }
    });
}

const rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  }; 
  
app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));




app.get('/callback', (req,res) => {
  res.send("poops")
  /*const { code } = req.query
    

    auth.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        auth.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
      });
    listEvents(auth)
    console.log("test")
    res.redirect("slack://open")
    res.redirect("https://google.com") 
    */

})


app.post('/test', async (req,res)=>{
    console.log(req.body)
    
    const { channel_id, user_id } = req.body
  
    //CALENDAR STUFF

    
    

    const sendAuthUrl = async (oAuth2Client) => {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
          });
        console.log(authUrl)
        const response = await callAPIMethod(
            "chat.postMessage", 
            {
                "channel": channel_id, 
                "text": `<${authUrl}|First, click here to link google calendar. > Then, run /scheduler again to send event invites!`
            }
        )
    }

    const authorize = (credentials) => {
        const {client_secret, client_id, redirect_uris} = credentials.web;

        const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

        auth = oAuth2Client

    // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, async (err, token) => {
            if (err) return sendAuthUrl(oAuth2Client);
            oAuth2Client.setCredentials(JSON.parse(token));
            listEvents(oAuth2Client);
        });
    }

    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Calendar API.
        authorize(JSON.parse(content));
    });

    
    


    //SLACK TEST STUFF
    const conversation_info = await axios.get(`https://slack.com/api/conversations.members?token=xoxp-1301288377174-1306647213349-1315407075604-bbec7f6b4ebc601867f82ae4b5904e8d&channel=${channel_id}&pretty=1`)
    const { members } = conversation_info.data
    console.log(members)
    const otherUser = members.length === 1 ? members[0] : members[0] === user_id ? members[1] : members[0]; 
    console.log("OTHER USER", otherUser)
    let otherUserName = await axios.get(`https://slack.com/api/users.info?token=xoxp-1301288377174-1306647213349-1315407075604-bbec7f6b4ebc601867f82ae4b5904e8d&user=${otherUser}&pretty=1`)
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
            
    
 
    res.end()
})

const server = app.listen(5000, () => {
    console.log("Listening on port 5000")
})
