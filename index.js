const express = require("express");
const mongoose = require("mongoose")
const axios = require("axios")
const bodyParser = require("body-parser")
const fs = require('fs');
const {google} = require('googleapis');

const app = express(); 

const keys = require("./config/keys.js")
require("./models/User")
const { listEvents, sendAuthUrl, getUserEvents, createEvent } = require("./api/calendar");
const { callAPIMethod } = require("./api/api.js");
const { findFreeTimes } = require("./utils/eventFinder")
 
mongoose.connect(keys.mongoURI, {
  useNewUrlParser: true, 
  useUnifiedTopology: true,
})

const User = mongoose.model("users"); 
const credentialsPath = process.env.NODE_ENV === "production" ? './config/credentials_prod.json' : './config/credentials_dev.json'


let requestingUser = null;
let activeChannel = null; 

let auth = null

const authorize = async (user_id, credentials) => {
  const {client_secret, client_id, redirect_uris} = credentials.web;

  const oAuth2Client = new google.auth.OAuth2(
  client_id, client_secret, redirect_uris[0]);

 
  auth = oAuth2Client

  // Check if we have previously stored a token.

  const user = await User.findOne({name: user_id})
 

  if(!user){
    return sendAuthUrl(user_id, activeChannel, oAuth2Client)
  } 

  const {refresh_token} = user

  

  oAuth2Client.setCredentials({
    refresh_token
  })
  //listEvents(requestingUser, activeChannel, oAuth2Client)


  
}


const rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  }; 
  
app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));



app.get('/callback', (req,res) => {
  
  const { code } = req.query
    console.log(req.query)
    
    console.log(auth)
    auth.getToken(code, async (err, token) => {
      
        if (err) return console.error('Error retrieving access token', err);
        //auth.setCredentials(token);
        console.log(token)
        // Store the token to disk for later program executions
        const { refresh_token } = token

        

        auth.setCredentials({
          refresh_token
        });

        
        const existingUser = await User.findOne({name: requestingUser})
        if(existingUser){
        } else {
          try{
            const user = new User({
              name: requestingUser, 
        
              refresh_token,
  
            })
            await user.save()
            
          } catch {
              console.log("error uh oh" )
          }
        }

        
    });

    
    listEvents(requestingUser, activeChannel, auth)
    console.log("test")
    res.redirect("slack://open")
    
    

})


app.post('/button', async (req,res) => {
  
  const choice = parseInt(JSON.parse(req.body.payload).actions[0].block_id)
  console.log(choice)
  createEvent(beginningISO, endISO, auth)
  res.end("beans")

});




const getOtherUser = async(channel_id, user_id) => {
  const conversation_info = await axios.get(`https://slack.com/api/conversations.members?token=xoxp-1301288377174-1306647213349-1315407075604-bbec7f6b4ebc601867f82ae4b5904e8d&channel=${channel_id}&pretty=1`)
    const { members } = conversation_info.data
    
    const otherUser = members.length === 1 ? members[0] : members[0] === user_id ? members[1] : members[0]; 
    const userInfo = await axios.get(`https://slack.com/api/users.info?token=xoxp-1301288377174-1306647213349-1315407075604-bbec7f6b4ebc601867f82ae4b5904e8d&user=${otherUser}&pretty=1`)
    return  userInfo.data

}


let beginningISO = null
let endISO = null 

app.post('/test', async (req,res)=>{
    
    
    const { channel_id, user_id } = req.body
  
    //CALENDAR STUFF

    
    requestingUser = user_id
    activeChannel = channel_id

    let credentials = null; 

    fs.readFile(credentialsPath, (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Calendar API.
      credentials = JSON.parse(content)
      authorize(user_id, credentials);
    });

    //console.log(await getOtherUser(channel_id, user_id))
    
    const otherUser = await getOtherUser(channel_id, user_id)
   
    


    const user2 = await getUserEvents(otherUser.user.id, credentials)
   
    const user1 = await getUserEvents(user_id, credentials)

    console.log(user1)
    
    const freeTimes = findFreeTimes(user2, user1)

    console.log(new Date(freeTimes[0].start).toISOString())

    const beginning = new Date(freeTimes[0].start).toLocaleString("en-US", {timeZone: "America/New_York"})
    const end = new Date(new Date(freeTimes[0].start).getTime()+30*60000).toLocaleString("en-US", {timeZone: "America/New_York"})
    
    await callAPIMethod(
      'chat.postEphemeral', 
      {
          "channel": `${channel_id}`,
          "attachments": [{}],
          "user": `${user_id}`,
          "blocks":[
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": `Here's a list of common available meeting times! Select one to invite ${otherUser.user.real_name} to.`
                }
              },
              {
                "type": "section",
                "block_id": "1",
                "text": {
                  "type": "mrkdwn",
                  "text": `• ${beginning}-${end.substring(11,16)} EST `
                },
                "accessory": {
                  "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Schedule",
                        "emoji": false
                    }
                }
              }
              
             
              
            ]
      }
    )

    beginningISO = new Date(freeTimes[0].start).toISOString(); 
    endISO = new Date(new Date(freeTimes[0].start).getTime()+30*60000).toISOString()

    //

    console.log(beginning);
    console.log(end);



    
    

  
    


    //SLACK TEST STUFF
    
    
    
    //let otherUserName = await axios.get(`https://slack.com/api/users.info?token=xoxp-1301288377174-1306647213349-1315407075604-bbec7f6b4ebc601867f82ae4b5904e8d&user=${otherUser}&pretty=1`)
  
 
    res.end()
})

const server = app.listen(process.env.PORT || 5000, () => {
    console.log("Listening on port 5000")
})
