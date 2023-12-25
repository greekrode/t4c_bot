const cheerio = require("cheerio");

function mapResponse(response, endpoint, showCandlesData) {
  const candlesData = response.candles;
  const $ = cheerio.load(response.html.chart_info);
  let result;

  const candleArray = {
    candles: response.candles.map((item) => ({
      date: item[0],
      value: item[1],
    })),
  };
  
  result = {
    name: endpoint.name,
    lastValue: Number(
      $("span#chart-info-last").text().replace(",", "")
    ).toFixed(2),
    change: $("span#chart-info-change").text(),
    changePct: $("span#chart-info-change-percent").text() + "%",
    region: endpoint.region ? endpoint.region : "",
    symbol: endpoint.symbol ? endpoint.symbol : "",
  };

  return showCandlesData ? { ...result, ...candleArray } : result;
}

module.exports = {
  mapResponse,
};
