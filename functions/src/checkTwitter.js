const Twitter = require('twitter-lite');
const twitterToken = require('../env/twitter_api_token.json');
const sitejson = require('../data/site.json');
const twitterTime = require('./util/twitterTime');

const tw = new Twitter({
  consumer_key: twitterToken.APIKey,
  consumer_secret: twitterToken.APISecretKey,
  bearer_token: twitterToken.bearer_token,
});

const accessDB = require('./crud/accessDB');

async function init() {
  const data = [];
  let params;

  await Promise.all(
    sitejson.twitter.map(async (twitter) => {
      params = { screen_name: twitter.twitterId, count: 1 };
      const tweetInfo = await tw.get('statuses/user_timeline', params);
      const d = {
        time: twitterTime.makeDateJSTfromTimestamp(tweetInfo[0].created_at),
        twitterid: twitter.twitterId,
      };
      data.push(d);
    })
  );

  data.forEach(async (onedata) => {
    await accessDB.setNewTwitter(onedata);
  });
}

async function scheduleTask() {
  const numTweets = 10;
  const data = [];
  let params;
  const allTwitter = await accessDB.getAllTwitter();

  for (const item_index in allTwitter) {
    if (allTwitter[item_index].time === 'dummy') {
      continue;
    }
    params = {
      screen_name: allTwitter[item_index].twitterid,
      count: numTweets,
    };
    const tweetInfo = await tw.get('statuses/user_timeline', params);
    for (let i = 0; i < numTweets; i++) {
      const tweetDate = twitterTime.makeDateJSTfromTimestamp(
        tweetInfo[i].created_at
      );
      if (allTwitter[item_index].time < tweetDate) {
        const d = {
          id: allTwitter[item_index].id,
          time: tweetDate,
          twitterid: allTwitter[item_index].twitterid,
          text: tweetInfo[i].text,
        };
        data.push(d);
      } else {
        break;
      }
    }
  }

  data.sort(twitterTime.compareByTime);
  data.forEach(async (onedata) => {
    await accessDB.updateTwitterById(onedata);
  });
  return data;
}

async function finish() {
  const allTwitter = await accessDB.getAllTwitter();
  allTwitter.forEach((twitter) => {
    if (twitter.time === 'dummy') {
      accessDB.deleteTwitterById(twitter.id);
    }
  });
}

module.exports = {
  scheduleTask,
  init,
  finish,
};
