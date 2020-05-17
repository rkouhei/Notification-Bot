'use strict';

const express = require('express');
const functions = require('firebase-functions');
const firebase = require('firebase-admin');
const line = require('@line/bot-sdk');

const line_token = require('../env/linebot.json');
const config = {
  channelSecret: line_token.Secret,
  channelAccessToken: line_token.AccessToken
};

const serviceAccount = require('../env/firebase-project.json');
const dbUrl = require('../env/db-url.json');
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: dbUrl.url
});

const app = express();
app.post('/webhook', line.middleware(config), (req, res) => {
    console.log(req.body.events);
    req.body.events.map(handleEvent);
});

const client = new line.Client(config);

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return;
  }

  let replyText = event.message.text
  let db = firebase.database();

  //-- 開始処理 --//
  if (event.message.text === '開始') {

    let allUser = await getAllUser(db);
    
    let newData = -1;
    allUser.map(function(item) {
      if (item.userid == event.source.userId) {
        newData = item.id;
      }
    });

    if ( newData === -1 ) {
      let lastId = await getLastUserId(db);
      lastId++;

      db.ref('USERID/' + lastId).set({
        id: lastId,
        userid: event.source.userId
      });

      replyText = '開始しました';
    } else {
      replyText = 'すでに開始しています';
    }

  }

  //-- 終了処理 --//
  if (event.message.text === '終了') {

    let allUser = await getAllUser(db);
    
    let newData = -1;
    allUser.map(function(item) {
      if (item.userid == event.source.userId) {
        newData = item.id;
      }
    });

    if ( newData !== -1 ) {
      db.ref('USERID/' + newData).set({});
      replyText = '終了しました';
    } else {
      replyText = '開始していません';
    }

  }

  
  if ( event.message.text === 'ぷ' ) {
    doPushMessage();
  }
  

  //-- reply --//
  client.replyMessage(event.replyToken, {
    type: 'text',
    text: replyText
  });
}

async function getLastUserId(db) {

  let lastId;

  await db.ref("USERID")
  .orderByKey()
  .limitToLast(1)
  .once('value')
  .then(function(snapshot) {
    let lastUser = snapshot.val()
    for (let i in lastUser) {
      lastId = i;
    }
  });

  return lastId;
}

async function getAllUser(db) {

  let allUser;

  await db.ref("USERID")
  .orderByKey()
  .once('value')
  .then(function(snapshot) {
    allUser = snapshot.val()
  });

  return allUser;
}

async function doPushMessage() {
  let sendText = "ここに変更urlを入れて送る";

  let db = firebase.database();
  let allUser = await getAllUser(db);

  allUser.map(function(item) {
    if ( item.userid !== 'dummy' ) {
      client.pushMessage(item.userid, {
        type: 'text',
        text: sendText,
      })
    }
  });

}

exports.app = functions.https.onRequest(app);