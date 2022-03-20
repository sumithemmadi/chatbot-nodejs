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
        var mysqlConnect = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: process.env.DBPASSWORD,
            database: process.env.DBNAME
        });
        var fulfillmentText = response.queryResult.fulfillmentText;
        var fulfillmentText = fulfillmentText.replace(":+1:", ".")
        var fulfillmentText = fulfillmentText.replace("\u0027", "'")
        var fulfillmentText = fulfillmentText.replace("\%nick\%",sender);

        mysqlConnect.connect(function (err) {
            if (err) throw err;
            var sql = `SELECT * FROM UnknownNumber  WHERE PhoneNumber=\"${sender}\";`;
            mysqlConnect.query(sql, function (err, result) {
                if (err) throw err;
                if (result.length == 0 && sender.charAt(0) == "+") {
                    mysqlConnect.query(`INSERT INTO UnknownNumber (PhoneNumber, Name, newState)  VALUES('${sender}', 'new', 0);`)
                    var message = {
                        "replies": [
                            {
                                "message": "Who are you ?"
                            }
                        ]
                    }
                } else if (sender.charAt(0) == "+" && result[0].newState < 2) {
                    switch (result[0].newState) {
                        case 0:
                            if (response.queryResult.intent.displayName == "user.name") {
                                // console.log(response.queryResult.parameters.fields.person.structValue.fields.name.stringValue)
                                mysqlConnect.query(`UPDATE UnknownNumber SET temporaryName = '${response.queryResult.parameters.fields.person.structValue.fields.name.stringValue}',newState = 1 WHERE  PhoneNumber='${sender}'`);
                                var message = {
                                    "replies": [
                                        {
                                            "message": `Your name is ${response.queryResult.parameters.fields.person.structValue.fields.name.stringValue} ?`
                                        },
                                        {
                                            "message": `Reply with yes or no ?`
                                        }
                                    ]
                                }
                                break;
                            } else {
                                var message = {
                                    "replies": [
                                        {
                                            "message": "What is your name ?"
                                        }
                                    ]
                                }
                                break;
                            }
                        case 1:
                            if (response.queryResult.intent.displayName == "name.conformation.yes") {
                                mysqlConnect.query(`UPDATE UnknownNumber SET Name = '${result[0].temporaryName}',newState = 2 WHERE  PhoneNumber='${sender}'`);
                                var message = {
                                    "replies": [
                                        {
                                            "message": `Thank you ${result[0].temporaryName}.`
                                        }
                                    ]
                                }
                                break;
                            }
                            else if (response.queryResult.intent.displayName == "smalltalk.common.NO") {
                                mysqlConnect.query(`DELETE FROM UnknownNumber WHERE  PhoneNumber='${sender}'`);
                                var message = {
                                    "replies": [
                                        {
                                            "message": fulfillmentText
                                        }
                                    ]
                                }
                                break;

                            } else {
                                var message = {
                                    "replies": [
                                        {
                                            "message": `Please reply with yes or no ?`
                                        }
                                    ]
                                }
                                break;
                            }
                    }

                } else {
                    var message = {
                        "replies": [
                            {
                                "message": fulfillmentText
                            }
                        ]
                    }
                }
                res.send(message)
            })
        })
    })

})

app.listen(port, () => {
    console.log(`listening on port ${port}`);
})