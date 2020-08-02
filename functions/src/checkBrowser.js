'use strict';

const generateUrl = require('./generateUrl');
const accessDB = require('./crud/accessDB')
const puppeteer = require('puppeteer');

const browserArgs = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '-–disable-dev-shm-usage',
  '--disable-gpu',
  '--no-first-run',
  '--no-zygote',
  '--single-process',
]

async function init() {
  const data = [];
  const regex = /[\n\t\s]+/g;
  const urls = await generateUrl.generate();

  const browser = await puppeteer.launch({
    args: browserArgs,
    headless: true,
  });

  await Promise.all(urls.map(async (urls) => {
    try {
      const page = await browser.newPage();
      await page.goto(urls.url, {
        waitUntil: 'networkidle2',
        timeout: 0
      });

      let textBody = await page.evaluate((parts) => {
        if ( parts.tag ) {
          return document.getElementsByTagName(parts.tag)[0].innerText;
        }
        if ( parts.class ) {
          return document.getElementsByClassName(parts.class)[0].innerText;
        }
        if ( parts.id ) {
          return document.getElementById(parts.id).innerText;
        }
      }, urls.parts);

      textBody = textBody.replace(regex, '');

      const d = {
        url: urls.url,
        body: textBody,
        parts: urls.parts,
      }
      data.push(d);
      
    } catch ( e ) {
      console.log( e )
    }
  }))
  
  await browser.close();

  for ( let i in data ) {
    await accessDB.setNewHtml(data[i]);
  }
}

async function scheduleTask() {
  const data = [];
  const notifications = [];
  const regex = /[\n\t\s]+/g;
  let allHtml = await accessDB.getAllHtml();

  const browser = await puppeteer.launch({
    args: browserArgs,
    headless: true,
  });

  for ( let item_index in allHtml ) {
    if (allHtml[item_index].mode === thisMode) {
      try {
        const page = await browser.newPage();
        await page.goto(allHtml[item_index].url, {
          waitUntil: 'networkidle2',
          timeout: 0
        });
        
        let newTextBody = await page.evaluate((parts) => {
          if ( parts.tag ) {
            return document.getElementsByTagName(parts.tag)[0].innerText;
          }
          if ( parts.class ) {
            return document.getElementsByClassName(parts.class)[0].innerText;
          }
          if ( parts.id ) {
            return document.getElementById(parts.id).innerText;
          }
        }, allHtml[item_index].parts);

        newTextBody = newTextBody.replace(regex, '');

        if ( allHtml[item_index].body !== newTextBody ) {

          const d = {
            id: allHtml[item_index].id,
            url: allHtml[item_index].url,
            body: newTextBody,
            parts: allHtml[item_index].parts,
          }
          
          data.push(d);
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  await browser.close();

  for ( let i in data ) {
    await accessDB.updateHtmlById(data[i])
  }
  return notifications;
}

async function finish() {
  let allHtml = await accessDB.getAllHtml();

  for ( let item_index in allHtml ) {
    accessDB.deleteHtmlById(allHtml[item_index].id);
  }
}

module.exports = {
  scheduleTask: scheduleTask,
  init: init,
  finish: finish
}