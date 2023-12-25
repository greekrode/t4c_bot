const axios = require("axios");
const moment = require("moment");
const { mapping } = require("./mapping");
const { mapResponse, mapResponsePrice, mapBasicTAInfo } = require("./function");

const { TradingViewAPI } = require("tradingview-scraper");
const tvAPI = new TradingViewAPI();

const { futures } = require("../constants/futures");

function callTV(type, ticker) {
  return axios({
    method: "POST",
    url: `https://scanner.tradingview.com/${type}/scan`,
    data: {
      symbols: {
        tickers: [ticker],
      },
      columns: [
        "close",
        "close[1]",
        "Recommend.Other",
        "Recommend.MA",
        "Recommend.All",
        "Pivot.M.Classic.S3",
        "Pivot.M.Classic.S2",
        "Pivot.M.Classic.S1",
        "Pivot.M.Classic.Middle",
        "Pivot.M.Classic.R1",
        "Pivot.M.Classic.R2",
        "Pivot.M.Classic.R3",
      ],
    },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.5",
      Referer: "https://www.tradingview.com/",
      "Content-Type": "application/json",
      Origin: "https://www.tradingview.com",
      Connection: "keep-alive",
      Cookie:
        "_sp_id.cf1a=ba3e72f3-7c39-4aea-a99b-2e8b0906ce16.1617635929.216.1622015946.1621929537.c948368b-eda0-4ec9-b04d-21d28fdb8e40; sessionid=nku1zj10sr60q2ho99ewitx3u8hdsbfo; tv_ecuid=a18097d0-7d19-4780-99d1-cf1ebd526df2; _sp_ses.cf1a=*",
      TE: "Trailers",
    },
  });
}

async function tv(input) {
  try {
    if (!input) {
      throw Error("Parameter input is required");
    }
    const endpoint = mapping[input];
    if (!endpoint) {
      throw Error(`No mapping found for ${input}, check mapping.js`);
    }
    const response = await callTV(endpoint.type, endpoint.ticker);

    if (response.data.data.length == 0) {
      throw Error("No response data", mapping[input]);
    }

    const results = mapResponse(response.data.data, endpoint);
    return results;
  } catch (err) {
    console.error(err.message);
  }
}

const lastFridayForMonth = function () {
  let lastDay = moment().endOf("month").startOf("day");
  switch (lastDay.day()) {
    case 6:
      return lastDay.subtract(1, "days");
    default:
      return lastDay.subtract(lastDay.day() + 2, "days");
  }
};

async function tvPrice(input) {
  try {
    if (!input) {
      throw Error("Parameter input is required");
    }

    const endpoint = mapping[input];
    if (!endpoint) {
      throw Error(`No mapping found for ${input}, check mapping.js`);
    }

    const period =
      endpoint.month >= 0 && moment().isAfter(lastFridayForMonth())
        ? moment()
            .add(endpoint.month + 1, "months")
            .format("MMM-YYYY")
            .split("-")
        : moment().add(endpoint.month, "months").format("MMM-YYYY").split("-");

    const month = futures[period[0]];
    const year = period[1];
    const ticker =
      endpoint.month >= 0 ? endpoint.ticker + month + year : endpoint.ticker;
    const name =
      endpoint.month >= 0 && !endpoint.region
        ? `${endpoint.name}(${period[0]})`
        : endpoint.name;
    const symbol =
      endpoint.month >= 0 && !endpoint.region
        ? `${endpoint.symbol}(${period[0]})`
        : endpoint.symbol;

    const response = await tvAPI.getTicker(ticker);

    const results = mapResponsePrice(response, name, symbol, endpoint.region);
    return results;
  } catch (err) {
    console.error(input, err.message);
  }
}

async function basicTAInfo(ticker) {
  const type = "indonesia";
  const tickerInput = `IDX:${ticker.toUpperCase()}`;

  try {
    const response = await callTV(type, tickerInput);

    if (response.data.data.length == 0) {
      throw Error("No response data", ticker);
    }

    const results = mapBasicTAInfo(response.data.data[0].d);
    return results;
  } catch (err) {
    console.error(err.message);
    return "";
  }
}

module.exports = {
  tv,
  tvPrice,
  basicTAInfo,
};
