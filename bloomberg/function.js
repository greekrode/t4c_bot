const numeral = require("numeral");

const convertToPct = (val) => {
  return val > 0
    ? `+${numeral(val).format("0.00")}%`
    : `${numeral(val).format("0.00")}%`;
};

const convertChange = (val, customFormat) => {
  if (val < 0.001) {
    return val;
  }
  return val > 0
    ? `+${numeral(val).format(customFormat)}`
    : `${numeral(val).format(customFormat)}`;
};

const convertVal = (val, customFormat) => {
  if (val < 0.001) {
    return val;
  }
  return `${numeral(val).format(customFormat)}`;
};

function mapResponse(response, name, customFormat = "0.00") {
  const data = response[0];

  return {
    name,
    lastValue: convertVal(data.price, customFormat),
    change: convertChange(data.priceChange1Day),
    changePct: convertToPct(data.percentChange1Day),
  };
}

module.exports = {
  mapResponse,
};
