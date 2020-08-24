const {google} = require('googleapis');
const { callAPIMethod } = require("./api")
const mongoose = require("mongoose")
const User = mongoose.model("users"); 


const SCOPES = ['https://www.googleapis.com/auth/calendar'];




const sendAuthUrl = async (user, channel, oAuth2Client) => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        approval_prompt: "force",
      });
   
    const response = await callAPIMethod(
        "chat.postEphemeral", 
        {
            "channel": `${channel}` ,
            "text": `<${authUrl}|First, click here to link google calendar. > Then, run /scheduler again to send event invites!`, 
            "attachments": [{}],
            "user":`${user}`


        }
    )
  
}

const listEvents = async (user, channel, auth) => {
    
     
     
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
 
       if (events.length) {
         const response = await callAPIMethod(
             'chat.postEphemeral', 
             {
                 "channel": `${channel}`,
                 "attachments": [{}],
                 "user": `${user}`,
                 "blocks":[
                     {
                       "type": "section",
                       "text": {
                         "type": "mrkdwn",
                         "text": `Here's a list of common available meeting times! Select one to invite to.`
                       }
                     },
                     {
                       "type": "section",
                       "block_id": "1",
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
                         "block_id": "2",
                         "text": {
                           "type": "mrkdwn",
                           "text": `• ${events[1] ? events[1].summary : "nothing"}`
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
                         "block_id": "3",
                         "text": {
                           "type": "mrkdwn",
                           "text": `• ${events[2] ? events[2].summary : "nothing"}`
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



const getUserEvents = async (otheruser_id, credentials) => {
  const {client_secret, client_id, redirect_uris} = credentials.web;

  const oAuth2Client = new google.auth.OAuth2(
  client_id, client_secret, redirect_uris[0]);

  const otherUser = await User.findOne({name: otheruser_id})
 

  if(!otherUser){
    console.log("tell other user to sign in")
    
      callAPIMethod(
        'chat.postMessage', 
        {
          "channel": 'D0190K38SG5' , 
          "text": `Please ask Attendee to run /scheduler to start finding mutual meeting times!`
        }
      )

    return 
    
  } 

  const {refresh_token} = otherUser


  oAuth2Client.setCredentials({
    refresh_token
  })

  

  

  const calendar = google.calendar({version: 'v3', auth: oAuth2Client});
    
  const promise = new Promise(function(resolve, reject){

  calendar.events.list({
       calendarId: 'primary',
       timeMin: (new Date()).toISOString(),
       maxResults: 4,
       singleEvents: true,
       orderBy: 'startTime',
     }, async (err, res) => {
        
        //events = res.data.items
        resolve(res.data.items)

      
     });

    })
  //setTimeout(() => {}, 500)
  
  const events = await promise

  return events

}






const createEvent = (start, end, auth) => {

  const calendar = google.calendar({version: 'v3', auth: auth})

  var event = {
    summary: 'Meeting between Adwith and Adwith',
    location: 'your moms house',
    description: "This meeting was scheduled with Slack Scheduler Bot",
    start: {
      dateTime: start,
    },
    end: {
      dateTime: end,
    },
    attendees: [{ email: 'adwithmukherjee@gmail.com' }],
    /*
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 10 }
      ]
    }
    */
  };

  calendar.events.insert(
    {
      auth, 
      calendarId: 'primary', 
      resource: event
    }, 
    function(err, event) {
      if (err) {
        console.log(
          'There was an error contacting the Calendar service: ' + err
        );
        return;
      }
      console.log('Event created: %s', event.htmlLink);
    }

  )
  
}

module.exports = {
    listEvents, 
    sendAuthUrl, 
    createEvent, 
    getUserEvents
}


