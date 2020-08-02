'use strict';

const firebase = require('firebase-admin');

const serviceAccount = require('../../env/firebase-project.json');
const dbUrl = require('../../env/db-url.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: dbUrl.url
});

//----------------//
//-- start USER --//
//----------------//

//-- set
async function setNewUser(lineId) {
  let db = firebase.database();
  let lastId = await getLastUserId();
  lastId++;

  db.ref('USERID/' + lastId).set({
    id: lastId,
    userid: lineId
  });
}

//-- get
async function getLastUserId() {
  let db = firebase.database();
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

async function getAllUser() {
  let db = firebase.database();
  let allUser;

  await db.ref("USERID")
  .orderByKey()
  .once('value')
  .then(function(snapshot) {
    allUser = snapshot.val()
  });

  return allUser;
}

//-- delete
async function deleteAllUser() {
  let db = firebase.database();
  let allUser = await getAllUser();

  for ( let item_index in allUser ) {
    if ( allUser[item_index].userid !== 'dummy' ) {
      db.ref('USERID/' + allUser[item_index].id).set({});
    }
  }
}

async function deleteUserByLineId(lineId) {
  let db = firebase.database();
  let allUser = await getAllUser();

  for ( let item_index in allUser ) {
    if ( allUser[item_index].userid === lineId ) {
      db.ref('USERID/' + allUser[item_index].id).set({});
    }
  }
}

//-- boolean
async function isUserStartedByLineId(lineId) {
  let db = firebase.database();
  let allUser = await getAllUser();
  let isStarted = false;

  for ( let item_index in allUser ) {
    if ( allUser[item_index].userid === lineId ) {
      isStarted = true;
      break;
    }
  }
  return isStarted;
}

//--------------//
//-- end USER --//
//--------------//

//----------------//
//-- start HTML --//
//----------------//

//-- set
async function setNewHtml(data) {
  let db = firebase.database();
  let lastId = await getLastHtmlId();
  lastId++;
  db.ref('HTML/' + lastId).set({
    body: data.body,
    id: lastId,
    url: data.url,
    parts: data.parts,
    mode: data.mode
  });
}

//- get
async function getLastHtmlId() {
  let db = firebase.database();
  let lastHtmlId;

  await db.ref("HTML")
  .orderByKey()
  .limitToLast(1)
  .once('value')
  .then(function(snapshot) {
    let lastHtml = snapshot.val()
    for (let i in lastHtml) {
      lastHtmlId = i;
    }
  });

  return lastHtmlId;
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
  
  return allHtml;
}

async function getHtmlByMode(getMode) {
  let db = firebase.database();
  let allHtml;

  await db.ref("HTML")
  .orderByKey()
  .once('value')
  .then(function(snapshot) {
    allHtml = snapshot.val()
  });

  return [allHtml].filter(html => html.mode === getMode)
}

//-- update
async function updateHtmlById(data) {
  let db = firebase.database();
  db.ref('HTML/' + data.id).set({
    body: data.body,
    id: data.id,
    url: data.url,
    parts: data.parts,
    mode: data.mode
  });
}

//-- delete
async function deleteHtmlById(id) {
  let db = firebase.database();
  db.ref('HTML/' + id).set({});
}

//--------------//
//-- end HTML --//
//--------------//

//-------------------//
//-- start TWITTER --//
//-------------------//

//-- set
async function setNewTwitter(data) {
  let db = firebase.database();
  let lastId = await getLastTwitterId();
  lastId++;
  db.ref('TWITTER/' + lastId).set({
    id: lastId,
    time: data.time,
    twitterid: data.twitterid
  });
}

//- get
async function getLastTwitterId() {
  let db = firebase.database();
  let lastTwitterId;

  await db.ref("TWITTER")
  .orderByKey()
  .limitToLast(1)
  .once('value')
  .then(function(snapshot) {
    let lastTwitter = snapshot.val()
    for (let i in lastTwitter) {
      lastTwitterId = i;
    }
  });

  return lastTwitterId;
}

async function getAllTwitter() {
  let db = firebase.database();
  let allTwitter;

  await db.ref("TWITTER")
  .orderByKey()
  .once('value')
  .then(function(snapshot) {
    allTwitter = snapshot.val()
  });
  
  return allTwitter;
}

//-- update
async function updateTwitterById(data) {
  let db = firebase.database();
  db.ref('TWITTER/' + data.id).set({
    id: data.id,
    time: data.time,
    twitterid: data.twitterid
  });
}

//-- delete
async function deleteTwitterById(id) {
  let db = firebase.database();
  db.ref('TWITTER/' + id).set({});
}

//-----------------//
//-- end TWITTER --//
//-----------------//

module.exports = {
  setNewUser: setNewUser,
  getLastUserId: getLastUserId,
  getAllUser: getAllUser,
  deleteAllUser: deleteAllUser,
  deleteUserByLineId: deleteUserByLineId,
  isUserStartedByLineId: isUserStartedByLineId,
  setNewHtml: setNewHtml,
  getLastHtmlId: getLastHtmlId,
  getHtmlByMode: getHtmlByMode,
  getAllHtml: getAllHtml,
  updateHtmlById: updateHtmlById,
  deleteHtmlById: deleteHtmlById,
  setNewTwitter: setNewTwitter,
  getLastTwitterId: getLastTwitterId,
  getAllTwitter: getAllTwitter,
  updateTwitterById: updateTwitterById,
  deleteTwitterById: deleteTwitterById
}