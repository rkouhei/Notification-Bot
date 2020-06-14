'use strict';

const firebase = require('firebase-admin');

const serviceAccount = require('../../../env/firebase-project.json');
const dbUrl = require('../../../env/db-url.json');
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
async function deleteUserByLineId(lineId) {
  let db = firebase.database();
  let allUser = await getAllUser();
  allUser.map(function(item) {
    if (item.userid === lineId) {
      db.ref('USERID/' + item.id).set({});
    }
  });
}

//-- boolean
async function isUserStartedByLineId(lineId) {
  let db = firebase.database();
  let allUser = await getAllUser();
  let isStarted = false;
  allUser.map(function(item) {
    if (item.userid === lineId) {
      isStarted = true;
    }
  });
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
    parts: data.parts
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

//-- update
async function updateHtmlById(data) {
  let db = firebase.database();
  db.ref('HTML/' + data.id).set({
    body: data.body,
    id: data.id,
    url: data.url,
    parts: data.parts
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

module.exports = {
  setNewUser: setNewUser,
  getLastUserId: getLastUserId,
  getAllUser: getAllUser,
  deleteUserByLineId: deleteUserByLineId,
  isUserStartedByLineId: isUserStartedByLineId,
  setNewHtml: setNewHtml,
  getLastHtmlId: getLastHtmlId,
  getAllHtml: getAllHtml,
  updateHtmlById: updateHtmlById,
  deleteHtmlById: deleteHtmlById
}