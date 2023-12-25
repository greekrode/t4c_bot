const { indicesText } = require("./indices");
const { commoditiesText } = require("./commodities");
const { currenciesText } = require("./currencies");
const { bondsText } = require("./bonds");
const { miscText } = require("./misc");

const moment = require("moment");

let today;

if (moment().day() == 6) {
  today = moment().add(2, "days").format("MMM Do, YYYY (dddd)");
} else if (moment().day() == 0) {
  today = moment().add(1, "days").format("MMM Do, YYYY (dddd)");
} else {
  today = moment().format("MMM Do, YYYY (dddd)");
}

const promises = new Promise((resolve, reject) => {
  Promise.all([
    indicesText,
    miscText,
    bondsText,
    currenciesText,
    commoditiesText,
  ]).then((res) => {
    resolve(res);
  });
});

exports.marketdata = promises;