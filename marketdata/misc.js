const { investing } = require("../investing/index");
const { tv } = require("../tradingview/index");
const { bloomberg } = require("../bloomberg/index");

const vix = investing("indices/us-vix");
const crb = bloomberg("indices/crb-commodity-index");
const bcomin = bloomberg("indices/bloomberg-industrials-metals-index");

// indo on us
const tlk = tv("stocks/tlk-us");
const eido = tv("etf/eido");
const eem = tv("mf/eem");

const promises = [vix, crb, bcomin, tlk, eido, eem];

const miscText = new Promise((resolve, reject) => {
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

module.exports = { miscText };
