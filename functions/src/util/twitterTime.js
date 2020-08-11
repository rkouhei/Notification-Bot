function makeDateJSTfromTimestamp(timestamp) {
  const timezoneoffset = -9;
  const dateJST = new Date(
    Date.parse(timestamp) -
      (timezoneoffset * 60 - new Date().getTimezoneOffset()) * 60000
  ).toLocaleString({ timeZone: 'Asia/Tokyo' });
  return dateJST;
}

function compareByTime(a, b) {
  let comp;
  if (a.time === b.time) {
    comp = 0;
  } else {
    comp = a.time > b.time ? 1 : -1;
  }
  return comp;
}

module.exports = {
  makeDateJSTfromTimestamp,
  compareByTime,
};
