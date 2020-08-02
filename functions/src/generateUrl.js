const sitejson = require('../data/site.json');

async function generate(mode) {
  const urls = sitejson.urls.filter((html) => html.mode === mode);

  await Promise.all(
    urls.map((urls) => {
      if (urls.parameter) {
        urls.parameter.map((p) => {
          const inText = selectFunction(p);
          urls.url = urls.url.replace(`{${p}}`, inText);
        });
      }
    })
  );

  return urls;
}

// --------------------------------//
// -- start 動的URL生成処理 sample --//
// --------------------------------//

/**
 * @fn 動的URL生成分岐
 * @brief pによって動的URLの一部生成として適用させる関数を変更する
 * @param (p) sitejson.urls.url.parameterの1要素
 * @return string 生成したURLの1要素
 * @usage 必要に応じて適宜関数作成と追加を行う
 */
function selectFunction(p) {
  switch (p) {
    case 'requestDate':
      return makeDate();
  }
}

/**
 * @fn 日付文字列生成 (動的URL生成関数例)
 * @return string YYYYMMDDの形式の今日の日付
 */
function makeDate() {
  const now = new Date();
  const year = now.getFullYear().toString();
  let month = (now.getMonth() + 1).toString();
  if (month.length === 1) {
    month = `0${month}`;
  }
  const date = now.getDate().toString();
  return year + month + date;
}

// -----------------------------------//
// -------- end 動的URL生成処理 --------//
// -----------------------------------//

module.exports = {
  generate,
};
