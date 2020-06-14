'use strict';

const express = require('express');
const functions = require('firebase-functions');
const line = require('@line/bot-sdk');

const line_token = require('../env/linebot.json');
const config = {
  channelSecret: line_token.Secret,
  channelAccessToken: line_token.AccessToken
};

const accessDB = require('./src/crud/accessDB')
const check = require('./src/checkUrl');

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

  //-- 開始処理 --//
  if (event.message.text === '開始') {

    let isStarted = await accessDB.isUserStartedByLineId(event.source.userId);
    if ( !isStarted ) {
      await accessDB.setNewUser(event.source.userId)
      replyText = '開始しました';
    } else {
      replyText = 'すでに開始しています';
    }

  }

  //-- 終了処理 --//
  if (event.message.text === '終了') {

    let isStarted = await accessDB.isUserStartedByLineId(event.source.userId);
    if ( isStarted ) {
      accessDB.deleteUserByLineId(event.source.userId);
      replyText = '終了しました';
    } else {
      replyText = '開始していません';
    }

  }

  //---- start 手動起動テスト ----//

  if ( event.message.text === 'いに' ) {
    check.init()
    replyText = 'HTML DB init'
  }

  if ( event.message.text === 'ふぃに' ) {
    check.finish()
    replyText = 'HTML DB clear'
  }
  
  if ( event.message.text === 'ぷ' ) {
    const data = await check.scheduleTask();
    for ( let i in data ) {
      doPushMessage(data[i].url)
    }
    replyText = 'push test'
  }

  //---- end 手動起動テスト ----//
  
  doReplyMessage(event.replyToken, replyText)
}

//---------------//
//-- Messaging --//
//---------------//

async function doPushMessage(sendText) {
  // let sendText = "ここに変更urlを入れて送る";
  let allUser = await accessDB.getAllUser();

  allUser.map(function(item) {
    if ( item.userid !== 'dummy' ) {
      client.pushMessage(item.userid, {
        type: 'text',
        text: sendText,
      })
    }
  });

}

function doReplyMessage(replyToken, replyText) {
  client.replyMessage(replyToken, {
    type: 'text',
    text: replyText
  });
}
//-------------------//
//-- end Messaging --//
//-------------------//

module.exports = {
  app: functions.https.onRequest(app),
  doPushMessage: doPushMessage
}