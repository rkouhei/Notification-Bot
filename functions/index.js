const express = require('express');
const functions = require('firebase-functions');
const line = require('@line/bot-sdk');

const lineToken = require('./env/linebot.json');

const config = {
  channelSecret: lineToken.Secret,
  channelAccessToken: lineToken.AccessToken,
};
const client = new line.Client(config);

const accessDB = require('./src/crud/accessDB');
const sendLineMessage = require('./src/util/sendLineMessage');
const checkUrl = require('./src/checkUrl');
const checkBrowser = require('./src/checkBrowser');
const checkTwitter = require('./src/checkTwitter');
const templateMessage = require('./data/template_message.json');

async function handleEvent(event) {
  /**
   * @receiveMessage 特別なメッセージ以外
   * @replyText 'default' in template_message.json
   */
  let replyText = templateMessage.default;

  /**
   * @receiveMessage テキスト以外のメッセージ
   * @replyText 'receiveNotTxtMessage' in template_message.json
   */
  if (event.type !== 'message' || event.message.type !== 'text') {
    return sendLineMessage.doReplyMessage(
      client,
      event.replyToken,
      templateMessage.receiveNotTxtMessage
    );
  }

  /**
   * @brief DBへユーザの登録
   * @receiveMessage '開始'
   * @replyText 'newUserStartTrue' or 'newUserStartFalse' in template_message.json
   */
  if (event.message.text === '開始') {
    const isStarted = await accessDB.isUserStartedByLineId(event.source.userId);
    if (!isStarted) {
      await accessDB.setNewUser(event.source.userId);
      replyText = templateMessage.newUserStartTrue;
    } else {
      replyText = templateMessage.newUserStartFalse;
    }
  }

  /**
   * @brief DBからユーザの削除
   * @receiveMessage '終了'
   * @replyText 'UserEndTrue' or 'UserEndFalse' in template_message.json
   */
  if (event.message.text === '終了') {
    const isStarted = await accessDB.isUserStartedByLineId(event.source.userId);
    if (isStarted) {
      await accessDB.deleteUserByLineId(event.source.userId);
      replyText = templateMessage.UserEndTrue;
    } else {
      replyText = templateMessage.UserEndFalse;
    }
  }

  /**
   * @brief 本BOTの使い方説明
   * @receiveMessage 'ヘルプ'
   * @replyText 'help' in template_message.json
   */
  if (event.message.text === 'ヘルプ') {
    replyText = templateMessage.help;
  }

  return sendLineMessage.doReplyMessage(client, event.replyToken, replyText);
}

const app = express();
app.post('/webhook', line.middleware(config), (req, res) => {
  console.log(req.body.events);

  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((result) => console.log(result));
});

// ----------------------//
// -- start 定期実行処理 --//
// ----------------------//

/**
 * @fn 定期実行準備関数
 * @brief pushTask()において確認するURL・Twitterアカウント及び現情報をDBへ保存する
 * @ref './data/site.json'
 * @schedule /1day
 */
async function initTask() {
  await sendLineMessage.doPushMessage(client, 'scheduling initTask()');
  await checkUrl.init();
  await checkBrowser.init();
  await checkTwitter.init();
}

/**
 * @fn 定期実行終了関数
 * @brief DBに登録されているURL・Twitterアカウント情報をクリアする
 * @schedule /1day
 */
async function finishTask() {
  await sendLineMessage.doPushMessage(client, 'scheduling finishTask()');
  await checkUrl.finish();
  await checkBrowser.finish();
  await checkTwitter.finish();
  await accessDB.deleteAllUser();
}

/**
 * @fn 定期実行関数
 * @brief DBに登録されているURL・Twitterアカウントにて前回から変更があるものを登録ユーザに通知を行う
 * @schedule /30min
 */
async function pushTask() {
  const timezoneoffset = -9;
  const now = new Date(
    Date.now() - (timezoneoffset * 60 - new Date().getTimezoneOffset()) * 60000
  ).toLocaleString({ timeZone: 'Asia/Tokyo' });
  await sendLineMessage.doPushMessage(client, now);
  const dataUrl = await checkUrl.scheduleTask();
  const dataBrowser = await checkBrowser.scheduleTask();
  const dataHtml = dataUrl.concat(dataBrowser);
  const dataTwitter = await checkTwitter.scheduleTask();
  if (dataHtml.length === 0 && dataTwitter.length === 0) {
    await sendLineMessage.doPushMessage(client, templateMessage.noChange);
  }
  dataHtml.forEach(async (changeHtml) => {
    await sendLineMessage.doPushMessage(client, changeHtml);
  });
  dataTwitter.forEach(async (changeTwitter) => {
    const pushMessage =
      `@${changeTwitter.twitterid}\n` +
      `Time : ${changeTwitter.time}\n${changeTwitter.text}`;
    await sendLineMessage.doPushMessage(client, pushMessage);
  });
}

// --------------------//
// -- end 定期実行処理 --//
// --------------------//

module.exports = {
  app: functions.https.onRequest(app),
  /**
   * @module schedule sample
   * @usage schedule()の中を各々実行したい時間へ変更する
   */
  initTask: functions.pubsub
    .schedule('30 0 * * *')
    .timeZone('Asia/Tokyo')
    .onRun(async () => {
      await initTask();
      console.log('0:30 : initTask()');
    }),
  finishTask: functions.pubsub
    .schedule('30 8 * * *')
    .timeZone('Asia/Tokyo')
    .onRun(async () => {
      await finishTask();
      console.log('8:30 : finishTask()');
    }),
  pushTask: functions.pubsub
    .schedule('*/30 * * * *')
    .timeZone('Asia/Tokyo')
    .onRun(async () => {
      await pushTask();
      console.log('every 30 minutes : pushTask()');
    }),
};
