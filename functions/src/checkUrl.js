'use strict';

const sitejson = require('../data/site.json');
const request = require('request-promise');
const cheerio = require('cheerio');

const accessDB = require('./crud/accessDB')

async function init() {
  const data = [];

  await Promise.all(sitejson.urls.map(async (urls) => {
    await request(urls.url, (e, response, body) => {
      if (e) {
        console.error(e)
      }
      try {
        const $ = cheerio.load(body)
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

  for ( let i in data ) {
    await accessDB.setNewHtml(data[i]);
  }
}

async function scheduleTask() {
  const data = [];
  let allHtml = await accessDB.getAllHtml();

  await Promise.all(allHtml.map(async function(item) {
    if (item.url !== 'dummy') {
      await request(item.url, (e, response, body) => {
        if (e) {
          console.error(e)
        }
        try {
          const $ = cheerio.load(body)
          const newTextBody = $(item.parts).text();
          if ( item.body !== newTextBody ) {
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

  for ( let i in data ) {
    await accessDB.updateHtmlById(data[i])
  }
  return data
}

async function finish() {
  const db_finish = this.db;
  let allHtml = await accessDB.getAllHtml(db_finish);
    
  allHtml.map(function(item) {
    if (item.url !== 'dummy') {
      accessDB.deleteHtmlById(item.id, db_finish);
    }
  });
}

//init()
//getAllHtml();
//finish()
//scheduleTask()

module.exports = {
  scheduleTask: scheduleTask,
  init: init,
  finish: finish
}