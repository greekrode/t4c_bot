const { tv } = require("../tradingview/index");
const { bloomberg } = require("../bloomberg/index");

const dxy = tv("currencies/us-dollar-index");
const idr = bloomberg("currencies/idr-spot-rate");
const eur = bloomberg("currencies/euro-spot-rate");

const promises = [dxy, idr, eur];

const currenciesText = new Promise((resolve, reject) => {
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

module.exports = { currenciesText };
