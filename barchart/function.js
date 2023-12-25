const numeral = require("numeral");

const calculateChangePct = (prev, change) => {
  const diff = numeral((change / prev) * 100).format("0.00") + "%";
  return diff > 0 ? `+${diff}` : `${diff}`;
};

const contractMonth = (symbol) => {
  const regex = /\((.*)\'.*\)/;
  return symbol.match(regex)[1].replace(/ /g, "");
};

const convertVal = (val) => {
  const final = numeral(val).format("0.00");
  return final > 0 ? `+${final}` : `-${final}`;
};

function mapResponse(response, name) {
  if (response.length > 1) {
    let responseArray = [];
    for (i = 0; i < 2; i++) {
      doc = {
        name: `${name} (${contractMonth(response[i].contractSymbol)})`,
        lastValue: response[i].lastPrice.replace("s", ""),
        change: convertVal(response[i].priceChange),
        changePct: calculateChangePct(
          response[i].previousPrice,
          response[i].priceChange
        ),
      };

      responseArray.push(doc);
    }
    return responseArray;
  }

  return {
    name: `${name} (${contractMonth(response[0].contractSymbol)})`,
    lastValue: response[0].raw.lastPrice,
    change: response[0].raw.priceChange,
    changePct: calculateChangePct(
      response[0].raw.previousPrice,
      response[0].raw.priceChange
    ),
  };
}

module.exports = {
  mapResponse,
};
