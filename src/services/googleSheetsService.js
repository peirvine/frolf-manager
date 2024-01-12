/* eslint-disable array-callback-return */
import axios from 'axios'
import { SignJWT, importPKCS8 } from 'jose';

const sheetID = process.env.REACT_APP_SHEET_ID
const rankingsRange = process.env.REACT_APP_SHEET_RANKINGS_RANGE
const historyRange = process.env.REACT_APP_SHEET_HISTORICAL_RANGE
const scorecardRange = process.env.REACT_APP_SHEET_SCORECARD_RANGE
const privateKey = process.env.REACT_APP_GOOGLE_PRIVATE_KEY
const now = new Date().getTime() / 1000;
const oneHour = 60 * 60;
const expireTime = now + oneHour;

async function getBearer() {
  const data = {
    iss: process.env.REACT_APP_GOOGLE_SERVICE_ACCOUNT,
    iat: now,
    exp: expireTime,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
  }
  const importedPrivateKey = await importPKCS8(privateKey.replaceAll('\\n','\n'), 'RS256');
  const jwt = await new SignJWT(data).setProtectedHeader({ alg: 'RS256', typ: "JWT" }).sign(importedPrivateKey);
  return getOAuthToken(jwt)
}

function getOAuthToken(jwt) {
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
  const res = axios.post("https://oauth2.googleapis.com/token?grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" + jwt, headers)
    .then(function (response) {
      // handle success
      return response.data.access_token
    })
    .catch(function (error) {
      // handle error
      // console.log('OAuth error', error);
    })
  return res
}


export async function getRankingsFromGoogle () {
  const bearer = await getBearer()
  return google2(bearer)
}

function google2 (bearer) {
  var options = {
    method: 'GET',
    url: 'https://sheets.googleapis.com/v4/spreadsheets/'+sheetID+'/values/'+rankingsRange,
    params: {
      dateTimeRenderOption: 'FORMATTED_STRING',
      majorDimension: 'ROWS',
      valueRenderOption: 'FORMATTED_VALUE'
    },
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + bearer
    }
  };
  return axios.request(options).then(function (response) {
    return response.data
  }).catch(function (error) {
    console.error(error);
    return error
  });
}

export async function addScorecardToGoogle (card) {
  const bearer = await getBearer()
  return saveToGoogle(card, bearer)
}

function saveToGoogle(card, bearer) {
  const newCard = parseCard(card)
  var options = {
    method: 'POST',
    url: 'https://sheets.googleapis.com/v4/spreadsheets/'+sheetID+'/values/'+scorecardRange+':append',
    params: {
      includeValuesInResponse: false,
      insertDataOption: 'OVERWRITE',
      responseDateTimeRenderOption: 'FORMATTED_STRING',
      responseValueRenderOption: 'FORMATTED_VALUE',
      valueInputOption: 'RAW'
    },
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + bearer
    },
    data: {
      values: newCard
    }
  };
  return axios.request(options).then(function (response) {
    return true
  }).catch(function (error) {
    console.error(error);
    return false
  });
}

function parseCard(card) {
  let playerScores = {
    alex: '',
    benton: '',
    greg: '',
    jimmy: '',
    lane: '',
    peter: '',
    rob: '',
    samir: '',
  }
  const numHoles = card.playerArray[0].holes.length

  card.playerArray.map(x => {
    const player = x.player
    if ("alex oelke".match(player.toLowerCase())) {
      playerScores["alex"] = parseInt(x.total)
    }
    if ("benton campbell".match(player.toLowerCase())) {
      playerScores["benton"] = parseInt(x.total)
    }
    if ("greg ledray".match(player.toLowerCase())) {
      playerScores["greg"] = parseInt(x.total)
    }
    if ("jimmy donadio".match(player.toLowerCase())) {
      playerScores["jimmy"] = parseInt(x.total)
    }
    if ("lane scherber".match(player.toLowerCase())) {
      playerScores["lane"] = parseInt(x.total)
    }
    if ("peter irvine".match(player.toLowerCase())) {
      playerScores["peter"] = parseInt(x.total)
    }
    if ("robert renkor".match(player.toLowerCase()) || "rob renkor".match(player.toLowerCase())) {
      playerScores["rob"] = parseInt(x.total)
    }
    if ("samir ramakrishnan".match(player.toLowerCase())) {
      playerScores["samir"] = parseInt(x.total)
    }
  })
  
  return [[ card.course, card.layout, parseInt(card.par), numHoles].concat(Object.values(playerScores))]
}



/* Elo Tracking */

export async function getHistoricalRankingsFromGoogle () {
  const bearer = await getBearer()
  return historical(bearer)
}

function historical(bearer) {
  var options = {
    method: 'GET',
    url: 'https://sheets.googleapis.com/v4/spreadsheets/'+sheetID+'/values/'+historyRange,
    params: {
      dateTimeRenderOption: 'FORMATTED_STRING',
      majorDimension: 'ROWS',
      valueRenderOption: 'FORMATTED_VALUE'
    },
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + bearer
    }
  };
  return axios.request(options).then(function (response) {
    const data = response.data.values
    let graphArray = []
    data.map(course => {
      const output = {
        name: course[0],
        alex: course[1],
        benton: course[2],
        greg: course[3],
        jimmy: course[4],
        lane: course[5],
        peter: course[6],
        rob: course[7],
        samir: course[8]
      }
      graphArray.push(output)
    })
    return graphArray
  }).catch(function (error) {
    console.error(error);
  });
}