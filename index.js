const express = require("express");
const axios = require("axios")
const http = require("http");
const bodyParser = require("body-parser")
const app = express(); 
const qs = require("qs")
const { callAPIMethod } = require("./api")


const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://josh:joshua00@cluster0.dwb86.mongodb.net/users?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
  const collection = client.db("users").collection("users");
  console.log('success');
  // perform actions on the collection object
  client.close();
});


const parseReq = (req, key) => {
    //returns the string between "key=" and the next "&"
    const data = `${req}`
    const startIndex = data.search(key)+key.length+1
    const endIndex = data.slice(startIndex, -1).search("&")
    return data.slice(startIndex, -1).substring(0,endIndex)
}

const getOtherUser = (members) => {

    const otherUser = otherUser = members[0] === user_id ? members[1] : members[0]; 
    return otherUser
}

const rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  };
  
app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));

app.post('/test', async (req,res)=>{
    const { channel_id, user_id } = req.body
  

    //const members = await axios.get(`https://slack.com/api/conversations.members?token=xoxp-1301288377174-1306647213349-1315407075604-bbec7f6b4ebc601867f82ae4b5904e8d&channel=${channel_id}&pretty=1`)


    
    const conversation_info = await axios.get(`https://slack.com/api/conversations.members?token=xoxp-1301288377174-1306647213349-1315407075604-bbec7f6b4ebc601867f82ae4b5904e8d&channel=${channel_id}&pretty=1`)
    const { members } = conversation_info.data
    console.log(members)
    const otherUser = members.length === 1 ? members[0] : members[0] === user_id ? members[1] : members[0]; 
    console.log("OTHER USER", otherUser)
    let otherUserName = await axios.get(`https://slack.com/api/users.info?token=xoxp-1301288377174-1306647213349-1315407075604-bbec7f6b4ebc601867f82ae4b5904e8d&user=${otherUser}&pretty=1`)
   
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
            
    
 
    res.end()
})

const server = app.listen(5000, () => {
    console.log("Listening on port 5000")
})