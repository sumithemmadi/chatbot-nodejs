const express = require("express");
const uuid = require('uuid');
const app = express();
var { sendQueries } = require("./src/index.js");
var mysql = require('mysql');
require("dotenv").config()
const port = 8080;

app.use(
    express.urlencoded({
        extended: true
    })
)

app.use(express.json())


app.post("/", (req, res) => {

    const projectId = process.env.PROJECTID
    const credentialsFile = process.env.KEYFILE
    const sessionId = uuid.v4();
    const languageCode = 'en-US';
    var text = req.body.query.message;
    var sender = `${req.body.query.sender}`.toString();
    var name = sender;


    var data = sendQueries(projectId, sessionId, text, languageCode, credentialsFile);

    data.then(function (response) {
        // var mysqlConnect = mysql.createConnection({
        //     host: "localhost",
        //     user: "root",
        //     password: process.env.DBPASSWORD,
        //     database: process.env.DBNAME
        // });
        var fulfillmentText = response.queryResult.fulfillmentText;
        var fulfillmentText = fulfillmentText.replace(":+1:", ".")
        var fulfillmentText = fulfillmentText.replace("\u0027", "'")
        var fulfillmentText = fulfillmentText.replace("\%nick\%",sender);
        var message = {
                 "replies": [
                    {
                        "message": fulfillmentText
                    }
                ]
            }
        res.send(message)
    })

})

app.listen(port, () => {
    console.log(`listening on port ${port}`);
})