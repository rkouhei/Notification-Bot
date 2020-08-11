const puppeteer = require('puppeteer');
const generateUrl = require('./generateUrl');
const accessDB = require('./crud/accessDB');
const compareTxt = require('./util/compareTxt');

const thisMode = 'puppeteer';

const browserArgs = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '-–disable-dev-shm-usage',
  '--disable-gpu',
  '--no-first-run',
  '--no-zygote',
  '--single-process',
];

async function init() {
  const data = [];
  const regex = /[\n\t\s]+/g;
  const urls = await generateUrl.generate(thisMode);

  const browser = await puppeteer.launch({
    args: browserArgs,
    headless: true,
  });

  await Promise.all(
    urls.map(async (urlinfo) => {
      try {
        const page = await browser.newPage();
        await page.goto(urlinfo.url, {
          waitUntil: 'networkidle2',
          timeout: 0,
        });

        let textBody = await page.evaluate((parts) => {
          if (parts.tag) {
            return document.getElementsByTagName(parts.tag)[0].innerText;
          }
          if (parts.class) {
            return document.getElementsByClassName(parts.class)[0].innerText;
          }
          if (parts.id) {
            return document.getElementById(parts.id).innerText;
          }
        }, urlinfo.parts);

        textBody = textBody.replace(regex, '');

        const d = {
          url: urlinfo.url,
          body: textBody,
          parts: urlinfo.parts,
          mode: urlinfo.mode,
        };
        data.push(d);
      } catch (e) {
        console.log(e);
      }
    })
  );

  await browser.close();

  data.forEach(async (onedata) => {
    await accessDB.setNewHtml(onedata);
  });
}

async function scheduleTask() {
  const data = [];
  const notifications = [];
  const regex = /[\n\t\s]+/g;
  const allHtml = await accessDB.getAllHtml();

  const browser = await puppeteer.launch({
    args: browserArgs,
    headless: true,
  });

  for (const item_index in allHtml) {
    if (allHtml[item_index].mode === thisMode) {
      try {
        const page = await browser.newPage();
        await page.goto(allHtml[item_index].url, {
          waitUntil: 'networkidle2',
          timeout: 0,
        });

        let newTextBody = await page.evaluate((parts) => {
          if (parts.tag) {
            return document.getElementsByTagName(parts.tag)[0].innerText;
          }
          if (parts.class) {
            return document.getElementsByClassName(parts.class)[0].innerText;
          }
          if (parts.id) {
            return document.getElementById(parts.id).innerText;
          }
        }, allHtml[item_index].parts);

        newTextBody = newTextBody.replace(regex, '');

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
  }

  await browser.close();

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
