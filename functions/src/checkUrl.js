'use strict';

const generateUrl = require('./generateUrl');
const request = require('request-promise');
const cheerio = require('cheerio');

const accessDB = require('./crud/accessDB')

async function init() {
  const data = [];
  const regex = /[\n\t\s]+/g;
  const sitejson = await generateUrl.generate();

  await Promise.all(sitejson.urls.map(async (urls) => {
    await request(urls.url, {timeout: 1500}, (e, response, body) => {
      try {
        const $ = cheerio.load(body)
        const textBody = $(urls.parts).text().replace(regex, '');
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
  const regex = /[\n\t\s]+/g;
  let allHtml = await accessDB.getAllHtml();

  await Promise.all(allHtml.map(async function(item) {
    if (item.url !== 'dummy') {
      await request(item.url, (e, response, body) => {
        if (e) {
          console.error(e)
        }
        try {
          const $ = cheerio.load(body)
          const newTextBody = $(item.parts).text().replace(regex, '');
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
  let allHtml = await accessDB.getAllHtml();

  allHtml.map(function(item) {
    if (item.url !== 'dummy') {
      accessDB.deleteHtmlById(item.id);
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