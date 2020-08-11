const request = require('request-promise');
const cheerio = require('cheerio');
const { Iconv } = require('iconv');
const encoding = require('encoding-japanese');
const generateUrl = require('./generateUrl');
const compareTxt = require('./util/compareTxt');
const makeRequestStructure = require('./util/makeRequestStructure');
const accessDB = require('./crud/accessDB');

const thisMode = 'request';

async function init() {
  const data = [];
  const regex = /[\n\t\s]+/g;
  const urls = await generateUrl.generate(thisMode);

  await Promise.all(
    urls.map(async (urlinfo) => {
      try {
        await request(
          { url: urlinfo.url, encoding: null },
          (e, response, body) => {
            if (e) {
              console.error(e);
            }
            try {
              let textBody;
              const parts = makeRequestStructure.makeRequestParts(
                urlinfo.parts
              );
              if (body) {
                const detected = encoding.detect(body);
                const iconv = new Iconv(detected, 'UTF-8//TRANSLIT//IGNORE');
                const stringBody = iconv.convert(body).toString();
                const $ = cheerio.load(stringBody);
                textBody = $(parts).text().replace(regex, '');
              } else {
                textBody = '見れなかった';
              }
              const d = {
                url: urlinfo.url,
                body: textBody,
                parts,
                mode: urlinfo.mode,
              };
              data.push(d);
            } catch (err) {
              console.error(err);
            }
          }
        );
      } catch (e) {
        console.error(e);
      }
    })
  );

  data.forEach(async (onedata) => {
    await accessDB.setNewHtml(onedata);
  });
}

async function scheduleTask() {
  const data = [];
  const notifications = [];
  const regex = /[\n\t\s]+/g;
  const allHtml = await accessDB.getAllHtml();

  for (const item_index in allHtml) {
    if (allHtml[item_index].mode !== thisMode) {
      continue;
    }
    try {
      await request(
        { url: allHtml[item_index].url, encoding: null },
        (e, response, body) => {
          try {
            let newTextBody;
            if (body) {
              const detected = encoding.detect(body);
              const iconv = new Iconv(detected, 'UTF-8//TRANSLIT//IGNORE');
              body = iconv.convert(body).toString();
              const $ = cheerio.load(body);
              newTextBody = $(allHtml[item_index].parts)
                .text()
                .replace(regex, '');
            }
            if (allHtml[item_index].body !== newTextBody) {
              const diffResult = compareTxt.makeDiffResult(
                allHtml[item_index].body,
                newTextBody,
                allHtml[item_index].url
              );
              notifications.push(diffResult);

              const d = {
                id: allHtml[item_index].id,
                url: allHtml[item_index].url,
                body: newTextBody,
                parts: allHtml[item_index].parts,
                mode: allHtml[item_index].mode,
              };
              data.push(d);
            }
          } catch (e) {
            console.error(e);
          }
        }
      );
    } catch (e) {
      console.error(e);
    }
  }

  data.forEach(async (onedata) => {
    await accessDB.updateHtmlById(onedata);
  });

  return notifications;
}

async function finish() {
  const allHtml = await accessDB.getAllHtml();
  allHtml.forEach((html) => {
    if (html.mode === thisMode) {
      accessDB.deleteHtmlById(html.id);
    }
  });
}

module.exports = {
  scheduleTask,
  init,
  finish,
};
