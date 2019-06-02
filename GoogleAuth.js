const { google } = require('googleapis');
const { readFile, writeFile } = require('fs');
const readLine = require('readline');
const { PIEClient } = require("./index.js");
const { spreadsheetId, valueInputOption } = require('./config.json');

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const TOKEN_PATH = "google-token.json";

async function getGoogleAuth() {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_ID, process.env.GOOGLE_SECRET, process.env.REDIRECT_URI
    );

    return new Promise((res, rej) => {
        readFile(TOKEN_PATH, (err, token) => {
            if (err) {
                authorize(oAuth2Client).then(oAuth2Client => {
                    res(oAuth2Client);
                }).catch(err => {
                    console.error("Could not Authorize Google");
                    rej(err);
                });
            } else {
                oAuth2Client.setCredentials(JSON.parse(token));
                res(oAuth2Client);
            }
        });
    });
}

async function authorize(oAuth2Client){
    return new Promise((res, rej) => {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
    
        console.log("Authorize this bot by visiting this url:", authUrl);
    
        const rl = readLine.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    
        rl.question("Enter the code from the page here: ", code => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) rej("Error while trying to retrieve access token", err);
                oAuth2Client.setCredentials(token);
                writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if(err) rej("Error while writing file", err);
                    console.log("Token stored");
                    res(oAuth2Client);
                });
            });
        });
    });
}

/**
 * @param { PIEClient } client
 * @param { string } range 
 * @param { string[] } values 
 */
function editSheets(client, range, values) {
    const resource = {
        values,
    };

    client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption,
        resource,
    }, (err, result) => {
        if (err) {
            // Handle error
            console.log(err);
        } else {
            console.log('%d cells updated.', result.data.updatedCells);
        }
    });
}

async function readSheets(client, range) {
    return new Promise((res, rej) => {
        client.sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        }, (err, result) => {
            if(err) rej(err);
            res(result);
        });
    });
}

module.exports = {
    getGoogleAuth,
    editSheets,
    readSheets,
}