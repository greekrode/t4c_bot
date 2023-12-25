const numeral = require("numeral");
const { formatTechnicalValue } = require("../helper/formatter");

const calculateDifference = (last, prev) => {
  const diff = numeral(last - prev).format("0.00");
  return diff > 0 ? `+${diff}` : `${diff}`;
};

const calculateChangePct = (prev, change) => {
  const diff = numeral((change / prev) * 100).format("0.00") + "%";
  return diff > 0 ? `+${diff}` : `${diff}`;
};

const convertChange = (val) => {
  const final = numeral(val).format("0.00");
  return val > 0 ? `+${final}` : `${final}`;
};

const convertChangePct = (val) => {
  const final = numeral(val).format("0.00") + "%";
  return val > 0 ? `+${final}` : `${final}`;
};

const mapResponse = (response, endpoint) => {
  const data = response[0].d;
  const change = calculateDifference(data[0], data[1]);

  return {
    name: endpoint.name,
    lastValue: +data[0].toFixed(2),
    change,
    changePct: calculateChangePct(data[1], change),
    region: endpoint.region ? endpoint.region : "",
    symbol: endpoint.symbol ? endpoint.symbol : "",
  };
};

const mapResponsePrice = (response, name, symbol, region) => {
  return {
    name,
    lastValue: +response.lp.toFixed(2),
    change: convertChange(response.ch),
    changePct: convertChangePct(response.chp),
    symbol: symbol != "" ? symbol : "",
    region,
  };
};

const mapBasicTAInfo = (res) => {
  let technicalInfo = "\n\n<b>==== Technical Info ====</b>";
  technicalInfo = technicalInfo + "\n\n<b>Technical Summary</b>";
  technicalInfo =
    technicalInfo + "\n<code>Oscillators: " + formatTechnicalValue(res[2]);
  technicalInfo =
    technicalInfo + "\nMoving Averages: " + formatTechnicalValue(res[3]);
  technicalInfo =
    technicalInfo + "\nSummary: " + formatTechnicalValue(res[4]) + "</code>";
  // technicalInfo = technicalInfo + "\n\n<b>Pivot Classic</b>";
  // technicalInfo = technicalInfo + "\n<code>S3: " + Math.ceil(res[5]);
  // technicalInfo = technicalInfo + "\nS2: " + Math.ceil(res[6]);
  // technicalInfo = technicalInfo + "\nS1: " + Math.ceil(res[7]);
  // technicalInfo = technicalInfo + "\nPivot: " + Math.ceil(res[8]);
  // technicalInfo = technicalInfo + "\nR1: " + Math.ceil(res[9]);
  // technicalInfo = technicalInfo + "\nR2: " + Math.ceil(res[10]);
  // technicalInfo = technicalInfo + "\nR3: " + Math.ceil(res[11]) + "</code>";

  return technicalInfo;
};

module.exports = {
  mapResponse,
  mapResponsePrice,
  mapBasicTAInfo,
};
