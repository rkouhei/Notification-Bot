'use strict';

const express = require('express');
const firebase = require('firebase-admin');
const sitejson = require('../data/site.json');
const request = require('request-promise');
const cheerio = require('cheerio');

const serviceAccount = require('../../env/firebase-project.json');
const dbUrl = require('../../env/db-url.json');
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: dbUrl.url
});

const app = express();

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
          body: textBody
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
    //await setHtml(data[i]);
  }
}

async function finish() {
  let allHtml = await getAllHtml();
    
  allHtml.map(function(item) {
    if (item.url !== 'dummy') {
      deleteHtmlById(item.id);
    }
  });
}

// init()
//getAllHtml();
finish()

//-- crud --//
async function setHtml(data) {
  let db = firebase.database();
  let lastId = await getLastHTMLId(db);
  lastId++;
  db.ref('HTML/' + lastId).set({
    body: data.body,
    id: lastId,
    url: data.url
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

async function deleteHtmlById(id) {
  let db = firebase.database();
  db.ref('HTML/' + id).set({});
}

async function getAllHtml() {
  let db = firebase.database();
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
