const accessDB = require('../crud/accessDB');

async function doPushMessage(client, sendText) {
  const allUser = await accessDB.getAllUser();

  allUser.forEach((user) => {
    if (user.userid !== 'dummy') {
      client.pushMessage(user.userid, {
        type: 'text',
        text: sendText,
      });
    }
  });
}

function doReplyMessage(client, replyToken, replyText) {
  client.replyMessage(replyToken, {
    type: 'text',
    text: replyText,
  });
}

exports.module = {
  doPushMessage,
  doReplyMessage,
};
