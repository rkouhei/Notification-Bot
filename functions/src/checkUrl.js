'use strict';

// const express = require('express');
// const firebase = require('firebase-admin');
const sitejson = require('../data/site.json');
const request = require('request-promise');
const cheerio = require('cheerio');
//const index = require('../index');

// const serviceAccount = require('../../env/firebase-project.json');
// const dbUrl = require('../../env/db-url.json');
// firebase.initializeApp({
//   credential: firebase.credential.cert(serviceAccount),
//   databaseURL: dbUrl.url
// });

//const app = express();

async function init() {
  // bodyとってくる
  const data = [];

  await Promise.all(sitejson.urls.map(async (urls) => {
    await request(urls.url, (e, response, body) => {
      if (e) {
        console.error(e)
      }
      try {
        const $ = cheerio.load(body)              //bodyの読み込み(functionが返却されてる？)
        // $('html').each((i, elem) => {   //'m_unit'クラス内のh3タグ内要素に対して処理実行
        //     titles_arr[i] = $(elem).text()        //配列にタイトルを挿入していく
        // })
        const textBody = $(urls.parts).text();
        const d = {
          url: urls.url,
          body: textBody,
          parts: urls.parts
        }
        data.push(d);
      } catch (e) {
        console.error(e)
      }
    })
  }))

  //console.log(data);
  // url作る(日毎に異なるやつ)
  for ( let i in data ) {
    //console.log(data[i]);
    await setHtml(data[i], this.db);
  }
}

async function scheduleTask() {
  const data = [];
  let allHtml = await getAllHtml(this.db);

  await Promise.all(allHtml.map(async function(item) {
    if (item.url !== 'dummy') {
      await request(item.url, (e, response, body) => {
        if (e) {
          console.error(e)
        }
        try {
          const $ = cheerio.load(body)
          const newTextBody = $(item.parts).text();
          console.log('今からbody比較する URL:'+item.url)
          if ( item.body !== newTextBody ) {
            console.log('body比較したけど違った')
            const d = {
              id: item.id,
              url: item.url,
              body: newTextBody,
              parts: item.parts
            }
            data.push(d);
          }
        } catch (e) {
          console.error(e)
        }
      })
    }
  }))

  console.log('set前')
  console.log(data);
  for ( let i in data ) {
    console.log('入ってる?')
    await updateHtmlById(data[i], this.db)
    // push 関数
    // await index.doPushMessage(data[i].url)
  }
  return data

  // exports.{{Function名}} = functions.pubsub.schedule('every 1 minutes').onRun((context) => {
  //   console.log("毎分実行します！");
  //   return null;
  // });
}

async function finish() {
  const db_finish = this.db;
  let allHtml = await getAllHtml(db_finish);
    
  allHtml.map(function(item) {
    if (item.url !== 'dummy') {
      deleteHtmlById(item.id, db_finish);
    }
  });
}

//init()
//getAllHtml();
//finish()
//scheduleTask()

//-- crud --//
// tmp function
let db;
function setDB(firebase) {
  this.db = firebase.database();
}

async function setHtml(data, db) {
  //let db = firebase.database();
  let lastId = await getLastHTMLId(db);
  lastId++;
  db.ref('HTML/' + lastId).set({
    body: data.body,
    id: lastId,
    url: data.url,
    parts: data.parts
  });
}

async function updateHtmlById(data, db) {
  //let db = firebase.database();
  db.ref('HTML/' + data.id).set({
    body: data.body,
    id: data.id,
    url: data.url,
    parts: data.parts
  });
}

async function getLastHTMLId(db) {

  let lastHTMLId;

  await db.ref("HTML")
  .orderByKey()
  .limitToLast(1)
  .once('value')
  .then(function(snapshot) {
    let lastHtml = snapshot.val()
    for (let i in lastHtml) {
      lastHTMLId = i;
    }
  });

  return lastHTMLId;
}

async function deleteHtmlById(id, db) {
  //let db = firebase.database();
  db.ref('HTML/' + id).set({});
}

async function getAllHtml(db) {
  //let db = firebase.database();
  let allHtml;

  await db.ref("HTML")
  .orderByKey()
  .once('value')
  .then(function(snapshot) {
    allHtml = snapshot.val()
  });

  // allHtml.map(function(item) {
  //   console.log(item.id)
  //   //console.log(item.url);
  //   console.log(item.body);
  // });
  
  return allHtml;
}

//-- end crud --//
module.exports = {
  setDB: setDB,
  scheduleTask: scheduleTask,
  init: init,
  finish: finish
}