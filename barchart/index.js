require("dotenv").config();
const axios = require("axios");
const { mapping } = require("./mapping");
const { mapResponse } = require("./function");
const fs = require("fs");

function loginBarChart() {
  return axios({
    method: "GET",
    url: "https://www.barchart.com/",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      DNT: 1,
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": 1,
    },
  });
}

function callBarChart(ticker, page, limit) {
  // const login = await loginBarChart();

  // const cookiesHeaders = login.headers["set-cookie"];
  // const laravelToken = cookiesHeaders[0];
  // const XSRFToken = cookiesHeaders[1];
  // const laravelSession = cookiesHeaders[2];
  // const market = cookiesHeaders[3];

  return axios({
    method: "GET",
    url: "https://www.barchart.com/proxies/core-api/v1/quotes/get",
    params: {
      fields:
        "symbol,contractSymbol,lastPrice,priceChange,openPrice,highPrice,lowPrice,previousPrice,volume,openInterest,tradeTime,symbolCode,symbolType,hasOptions",
      list: "futures.contractInRoot",
      root: ticker,
      page,
      limit,
      raw: 1,
    },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.5",
      Referer: "https://www.barchart.com",
      "Content-Type": "application/json",
      Origin: "https://www.barchart.com",
      Connection: "keep-alive",
      Cookie: process.env.BARCHART_COOKIE,
      "X-XSRF-TOKEN": process.env.BARCHART_TOKEN,
    },
  });
}

async function barchart(input, page = 1, limit = 10) {
  try {
    if (!input) {
      throw Error("Parameter input is required");
    }

    const endpoint = mapping[input];
    if (!endpoint) {
      throw Error(`No mapping found for ${input}, check mapping.js`);
    }

    const response = await callBarChart(endpoint.ticker, page, limit);

    if (response.data.count == 0) {
      throw Error("No response found");
    }
    const results = mapResponse(response.data.data, endpoint.name);
    return results;
  } catch (err) {
    const login = await loginBarChart();

    const cookiesHeaders = login.headers["set-cookie"];
    const laravelToken = cookiesHeaders[0].split(";")[0];
    const XSRFToken = cookiesHeaders[1].split(";")[0];
    const laravelSession = cookiesHeaders[2].split(";")[0];
    const market = cookiesHeaders[3].split(";")[0];
    const XSRFTokenHeaders = XSRFToken.split("=")[1];
  }
}

exports.barchart = barchart;
