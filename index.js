const express = require("express");
const axios = require("axios")
const http = require("http")
const app = express(); 


const server = http.createServer(async (req, res) => {
    const pathName = req.url
    if(pathName === '/test'){
        //TEST 
        await axios.post(
            "https://hooks.slack.com/services/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", 
            {"text":"Hello, World!"}
        )
        res.end("request sent")
    } else {
        //NOT FOUND
    
        res.writeHead(404, {
          "Content-type": "text/html", //the browser is expecting html text code
          
        });
        res.end("<h1>this page could not be found</h1>");
      }
})


server.listen(5000, "127.0.0.1", () => {
    console.log("Listening to server");
  });