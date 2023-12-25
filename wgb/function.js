const numeral = require("numeral");

const convertVal = (val) => {
	return `${numeral(val).format("0.00")}`;
  };

const calculateDifference = (last, prev) => {
  const diff = numeral(last - prev).format("0.00");
  return diff > 0 ? `+${diff}` : `${diff}`;
};

const calculateChangePct = (prev, change) => {
  const diff = numeral((change / prev) * 100).format("0.00") + "%";
  return diff > 0 ? `+${diff}` : `${diff}`;
};

function mapResponse(response, name) {
  const total = response.num;
  const lastValue = response.quote[total][1];
  const prevValue = response.quote[total - 1][1];
  const change = calculateDifference(lastValue, prevValue);

  return {
    name,
    lastValue: convertVal(lastValue),
    change: change,
    changePct: calculateChangePct(prevValue, change),
  };
}

module.exports = {
  mapResponse,
};
