const firebase = require('firebase-admin');

const serviceAccount = require('../../env/firebase-project.json');
const dbUrl = require('../../env/db-url.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: dbUrl.url,
});

// ----------------//
// -- start USER --//
// ----------------//

// -- get
async function getLastUserId() {
  const db = firebase.database();
  let lastId;

  await db
    .ref('USERID')
    .orderByKey()
    .limitToLast(1)
    .once('value')
    .then((snapshot) => {
      const lastUser = snapshot.val();
      lastId = Object.keys(lastUser);
    });

  return lastId[0];
}

async function getAllUser() {
  const db = firebase.database();
  let allUser;

  await db
    .ref('USERID')
    .orderByKey()
    .once('value')
    .then((snapshot) => {
      allUser = snapshot.val();
    });

  return allUser;
}

// -- set
async function setNewUser(lineId) {
  const db = firebase.database();
  let lastId = await getLastUserId();
  lastId += 1;

  db.ref(`USERID/${lastId}`).set({
    id: lastId,
    userid: lineId,
  });
}

// -- delete
async function deleteAllUser() {
  const db = firebase.database();
  const allUser = await getAllUser();

  allUser.forEach((user) => {
    if (user.userid !== 'dummy') {
      db.ref(`USERID/${user.id}`).set({});
    }
  });
}

async function deleteUserByLineId(lineId) {
  const db = firebase.database();
  const allUser = await getAllUser();

  allUser.forEach((user) => {
    if (user.userid === lineId) {
      db.ref(`USERID/${user.id}`).set({});
    }
  });
}

// -- boolean
async function isUserStartedByLineId(lineId) {
  const allUser = await getAllUser();
  let isStarted = false;

  allUser.forEach((user) => {
    if (user.userid === lineId) {
      isStarted = true;
    }
  });

  return isStarted;
}

// --------------//
// -- end USER --//
// --------------//

// ----------------//
// -- start HTML --//
// ----------------//

// - get
async function getLastHtmlId() {
  const db = firebase.database();
  let lastHtmlId;

  await db
    .ref('HTML')
    .orderByKey()
    .limitToLast(1)
    .once('value')
    .then((snapshot) => {
      const lastHtml = snapshot.val();
      lastHtmlId = Object.keys(lastHtml);
    });

  return lastHtmlId[0];
}

async function getAllHtml() {
  const db = firebase.database();
  let allHtml;

  await db
    .ref('HTML')
    .orderByKey()
    .once('value')
    .then((snapshot) => {
      allHtml = snapshot.val();
    });

  return allHtml;
}

async function getHtmlByMode(getMode) {
  const db = firebase.database();
  let allHtml;

  await db
    .ref('HTML')
    .orderByKey()
    .once('value')
    .then((snapshot) => {
      allHtml = snapshot.val();
    });

  return [allHtml].filter((html) => html.mode === getMode);
}

// -- set
async function setNewHtml(data) {
  const db = firebase.database();
  let lastId = await getLastHtmlId();
  lastId += 1;
  db.ref(`HTML/${lastId}`).set({
    body: data.body,
    id: lastId,
    url: data.url,
    parts: data.parts,
    mode: data.mode,
  });
}

// -- update
async function updateHtmlById(data) {
  const db = firebase.database();
  db.ref(`HTML/${data.id}`).set({
    body: data.body,
    id: data.id,
    url: data.url,
    parts: data.parts,
    mode: data.mode,
  });
}

// -- delete
async function deleteHtmlById(id) {
  const db = firebase.database();
  db.ref(`HTML/${id}`).set({});
}

// --------------//
// -- end HTML --//
// --------------//

// -------------------//
// -- start TWITTER --//
// -------------------//

// - get
async function getLastTwitterId() {
  const db = firebase.database();
  let lastTwitterId;

  await db
    .ref('TWITTER')
    .orderByKey()
    .limitToLast(1)
    .once('value')
    .then((snapshot) => {
      const lastTwitter = snapshot.val();
      lastTwitterId = Object.keys(lastTwitter);
    });

  return lastTwitterId[0];
}

async function getAllTwitter() {
  const db = firebase.database();
  let allTwitter;

  await db
    .ref('TWITTER')
    .orderByKey()
    .once('value')
    .then((snapshot) => {
      allTwitter = snapshot.val();
    });

  return allTwitter;
}

// -- set
async function setNewTwitter(data) {
  const db = firebase.database();
  let lastId = await getLastTwitterId();
  lastId += 1;
  db.ref(`TWITTER/${lastId}`).set({
    id: lastId,
    time: data.time,
    twitterid: data.twitterid,
  });
}

// -- update
async function updateTwitterById(data) {
  const db = firebase.database();
  db.ref(`TWITTER/${data.id}`).set({
    id: data.id,
    time: data.time,
    twitterid: data.twitterid,
  });
}

// -- delete
async function deleteTwitterById(id) {
  const db = firebase.database();
  db.ref(`TWITTER/${id}`).set({});
}

// -----------------//
// -- end TWITTER --//
// -----------------//

module.exports = {
  setNewUser,
  getLastUserId,
  getAllUser,
  deleteAllUser,
  deleteUserByLineId,
  isUserStartedByLineId,
  setNewHtml,
  getLastHtmlId,
  getHtmlByMode,
  getAllHtml,
  updateHtmlById,
  deleteHtmlById,
  setNewTwitter,
  getLastTwitterId,
  getAllTwitter,
  updateTwitterById,
  deleteTwitterById,
};
