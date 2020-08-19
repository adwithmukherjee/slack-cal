const express = require("express");
const axios = require("axios")
const http = require("http");
const bodyParser = require("body-parser")
const app = express(); 
const qs = require("qs")
const { callAPIMethod } = require("./api")

const parseReq = (req, key) => {
    //returns the string between "key=" and the next "&"
    const data = `${req}`
    const startIndex = data.search(key)+key.length+1
    const endIndex = data.slice(startIndex, -1).search("&")
    return data.slice(startIndex, -1).substring(0,endIndex)
}


const rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  };
  
app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));

app.post('/test', async (req,res)=>{
    const { channel_id } = req.body
    console.log(channel_id)
    const response = await callAPIMethod(
        "chat.postMessage",

        {
            "channel": channel_id,
            "text": "Hello world! This is a test :tada:",
           
        }
    )
    console.log(response)
 
    res.end()
})

const server = app.listen(5000, () => {
    console.log("Listening on port 5000")
})