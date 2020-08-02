'use strict';

const generateUrl = require('./generateUrl');
const request = require('request-promise');
const cheerio = require('cheerio');
const Iconv = require('iconv').Iconv;
const encoding = require('encoding-japanese');
const accessDB = require('./crud/accessDB')

const thisMode = 'request';

async function init() {
  const data = [];
  const regex = /[\n\t\s]+/g;
  const urls = await generateUrl.generate(thisMode);

  await Promise.all(urls.map(async (urls) => {
    try {
      await request({ url: urls.url, encoding: null }, (e, response, body) => {
        if ( e ) {
          console.error(e)
        }
        try {
          let textBody;
          let parts = makeRequestParts(urls.parts);
          if (body) {
            const detected = encoding.detect(body);
            let iconv = new Iconv(detected, 'UTF-8//TRANSLIT//IGNORE');
            body = iconv.convert(body).toString();
            const $ = cheerio.load(body);
            textBody = $(parts).text().replace(regex, '');
          } else {
            textBody = '見れなかった';
          }
          const d = {
            url: urls.url,
            body: textBody,
            parts: parts,
            mode: urls.mode
          }
          data.push(d);
        } catch ( e ) {
          console.error(e)
        }
      })
    } catch ( e ) {
      console.error( e )
    }
  }))

  for ( let i in data ) {
    await accessDB.setNewHtml(data[i]);
  }
}

async function scheduleTask() {
  const data = [];
  const notifications = [];
  const regex = /[\n\t\s]+/g;
  let allHtml = await accessDB.getAllHtml();

  for ( let item_index in allHtml ) {
    if ( allHtml[item_index].mode !== thisMode ) { continue; }
    try {
      await request({ url: allHtml[item_index].url, encoding: null }, (e, response, body) => {
        try {
          let newTextBody;
          if (body) {
            const detected = encoding.detect(body);
            let iconv = new Iconv(detected, 'UTF-8//TRANSLIT//IGNORE');
            body = iconv.convert(body).toString();
            const $ = cheerio.load(body);
            newTextBody = $(allHtml[item_index].parts).text().replace(regex, '');
          }
          if ( allHtml[item_index].body !== newTextBody ) {
            const d = {
              id: allHtml[item_index].id,
              url: allHtml[item_index].url,
              body: newTextBody,
              parts: allHtml[item_index].parts,
              mode: allHtml[item_index].mode
            }
            data.push(d);
          }
        } catch (e) {
          console.error(e)
        }
      })
    } catch ( e ) {
      console.error( e )
    }
  }

  for ( let i in data ) {
    await accessDB.updateHtmlById(data[i])
  }
  return notifications
}

async function finish() {
  let allHtml = await accessDB.getAllHtml();

  for ( let item_index in allHtml ) {
    if (allHtml[item_index].mode === thisMode) {
      accessDB.deleteHtmlById(allHtml[item_index].id);
    }
  }
}

function makeRequestParts(parts) {
  if ( parts.tag ) {
    return parts.tag
  }
  if ( parts.id ) {
    return "#"+parts.id
  }
  if ( parts.class ) {
    return parts.class
  }
  return parts
}

module.exports = {
  scheduleTask: scheduleTask,
  init: init,
  finish: finish
}