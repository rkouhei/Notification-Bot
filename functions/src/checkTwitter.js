'use strict';

const Twitter = require('twitter-lite');
const twitter_token = require('../../env/twitter_api_token.json');
const sitejson = require('../data/site.json')
const tw = new Twitter({
  consumer_key: twitter_token.APIKey,
  consumer_secret: twitter_token.APISecretKey,
  bearer_token: twitter_token.bearer_token
});

const accessDB = require('./crud/accessDB')

async function init() {
  const data = [];
  let params;

  await Promise.all(sitejson.twitter.map(async (twitter) => {
    params = {screen_name: twitter.twitterId,　count:1};
    const tweetInfo = await tw.get('statuses/user_timeline', params);
    const d = {
      time: makeDateJSTfromTimestamp(tweetInfo[0].created_at),
      twitterid: twitter.twitterId
    }
    data.push(d);
  }))
  
  for ( let i in data ) {
    await accessDB.setNewTwitter(data[i]);
  }
}

async function scheduleTask() {
  const numTweets = 10;
  const data = [];
  let params;
  let allTwitter = await accessDB.getAllTwitter();

  await Promise.all(allTwitter.map(async (item) => {
    if (item.time !== 'dummy') {
      params = {screen_name: item.twitterid,　count:numTweets};
      const tweetInfo = await tw.get('statuses/user_timeline', params);
      for ( let i = 0; i < numTweets; i++ ) {
        const tweetDate = makeDateJSTfromTimestamp(tweetInfo[i].created_at)
        if ( item.time < tweetDate ) {
          const d = {
            id: item.id,
            time: tweetDate,
            twitterid: item.twitterid,
            text: tweetInfo[i].text
          }
          data.push(d);
        } else {
          break;
        }
      }
    }
  }))

  data.sort(compareByTime)
  for ( let i in data ) {
    await accessDB.updateTwitterById(data[i])
  }
  return data
}

async function finish() {
  let allTwitter = await accessDB.getAllTwitter();
    
  allTwitter.map(function(item) {
    if (item.time !== 'dummy') {
      accessDB.deleteTwitterById(item.id);
    }
  });
}

//--------------------//
//-- Misc Functions --//
//--------------------//

function makeDateJSTfromTimestamp(timestamp) {
  return new Date(Date.parse(timestamp)).toLocaleString({ timeZone: 'Asia/Tokyo' })
}

function compareByTime(a, b) {
  let comp;
  if ( a.time === b.time ) {
    comp = 0;
  } else {
    comp = ( a.time > b.time ) ? 1 : -1;
  }
  return comp;
}

module.exports = {
  scheduleTask: scheduleTask,
  init: init,
  finish: finish
}