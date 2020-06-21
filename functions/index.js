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
const checkUrl = require('./src/checkUrl');
const checkTwitter = require('./src/checkTwitter');

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
    initTask();
    replyText = 'site DB init'
  }
  if ( event.message.text === 'ふぃに' ) {
    finishTask()
    replyText = 'site DB clear'
  }
  if ( event.message.text === 'ぷ' ) {
    pushTask()
    replyText = 'push test'
  }
  //---- end 手動起動テスト ----//
  
  doReplyMessage(event.replyToken, replyText)
}

//----------------------//
//-- start 定期実行処理 --//
//----------------------//

/**
 * @fn 定期実行準備関数
 * @brief pushTask()において確認するURL・Twitterアカウント及び現情報をDBへ保存する
 * @ref './data/site.json'
 * @schedule /1day
 */
function initTask() {
  checkUrl.init()
  checkTwitter.init()
}

/**
 * @fn 定期実行終了関数
 * @brief DBに登録されているURL・Twitterアカウント情報をクリアする
 * @schedule /1day
 */
function finishTask() {
  checkUrl.finish()
  checkTwitter.finish()
}

/**
 * @fn 定期実行関数
 * @brief DBに登録されているURL・Twitterアカウントにて前回から変更があるものを登録ユーザに通知を行う
 * @schedule /30min
 */
async function pushTask() {
  const dataHtml = await checkUrl.scheduleTask();
  const dataTwitter = await checkTwitter.scheduleTask();
  for ( let i in dataHtml ) {
    await doPushMessage(dataHtml[i].url)
  }
  for ( let i in dataTwitter ) {
    let pushMessage = "@" + dataTwitter[i].twitterid + "\n" + "Time : " + dataTwitter[i].time + "\n" +dataTwitter[i].text;
    await doPushMessage(pushMessage)
  }
}

//--------------------//
//-- end 定期実行処理 --//
//--------------------//

//---------------------//
//-- start Messaging --//
//---------------------//

async function doPushMessage(sendText) {
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