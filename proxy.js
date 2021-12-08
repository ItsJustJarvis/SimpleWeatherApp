/* 
    Name:       Reeve Jarvis
    Course:     DGL-213
    Section:    DLU1
    Original:   Module #3 Milestone #2

    Current: Module #3.5 Refactoring
    Latest Update: 11/18/2021

    Filename:   proxy.js

    ** To run the proxy server, enter the following command into the terminal: node proxy.js **
*/


/* eslint-disable no-undef */
"use strict";

const express = require("express");
const request = require("request");

const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});

app.get("/*", (req, res) => {
    request(
        { url: "https://www.metaweather.com/api/location" + req.originalUrl },
        (error, response, body) => {
            if (error || response.statusCode !== 200) {
                return res.status(500).json({ type: "error", message: error });
            }
            res.json(JSON.parse(body));
        }
    );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));