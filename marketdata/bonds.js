const { investing } = require("../investing/index");
const { tv } = require("../tradingview/index");
const { wgb } = require("../wgb/index");

const us10y = tv("bonds/us-10y");
const id10y = investing("rates-bonds/id-10y");
const idcds = wgb("cds/id-cds");

const promises = [us10y, id10y, idcds];

const bondsText = new Promise((resolve, reject) => {
  Promise.all(promises).then((res) => {
    let textMessage = "";

    for (i = 0; i < res.length; i++) {
      textMessage =
        textMessage +
        `${res[i].name}     ${res[i].lastValue} (${res[i].change} | ${res[i].changePct})\n`;
    }

    resolve(textMessage + "\n");
  });
});

module.exports = { bondsText };
