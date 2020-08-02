'use strict';

const express = require('express');
const functions = require('firebase-functions');
const line = require('@line/bot-sdk');

const line_token = require('./env/linebot.json');
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
async function initTask() {
  await doPushMessage('scheduling initTask()')
  await checkUrl.init()
  await checkTwitter.init()
}

/**
 * @fn 定期実行終了関数
 * @brief DBに登録されているURL・Twitterアカウント情報をクリアする
 * @schedule /1day
 */
async function finishTask() {
  await doPushMessage('scheduling finishTask()')
  await checkUrl.finish()
  await checkTwitter.finish()
  await accessDB.deleteAllUser()
}

/**
 * @fn 定期実行関数
 * @brief DBに登録されているURL・Twitterアカウントにて前回から変更があるものを登録ユーザに通知を行う
 * @schedule /30min
 */
async function pushTask() {
  const timezoneoffset = -9;
  const now = new Date(Date.now() - (timezoneoffset * 60 - new Date().getTimezoneOffset()) * 60000).toLocaleString({ timeZone: 'Asia/Tokyo' })
  await doPushMessage(now)
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
  for ( let item_index in allUser ) {
    if ( allUser[item_index].userid !== 'dummy' ) {
      client.pushMessage(allUser[item_index].userid, {
        type: 'text',
        text: sendText,
      })
    }
  };
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
  /**
   * @module schedule sample
   * @usage schedule()の中を各々実行したい時間へ変更する
   */
  initTask: functions.pubsub.schedule('30 0 * * *').timeZone('Asia/Tokyo').onRun(async (context) => {
    await initTask()
    console.log('0:30 : initTask()');
  }),
  finishTask: functions.pubsub.schedule('30 8 * * *').timeZone('Asia/Tokyo').onRun(async (context) => {
    await finishTask()
    console.log('8:30 : finishTask()');
  }),
  pushTask: functions.pubsub.schedule('*/30 * * * *').timeZone('Asia/Tokyo').onRun(async (context) => {
    await pushTask()
    console.log('every 30 minutes : pushTask()');
  }),
  doPushMessage: doPushMessage
}