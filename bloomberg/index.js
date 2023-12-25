const axios = require("axios");
const { mapping } = require("./mapping");
const { mapResponse } = require("./function");

function callBloomberg(ticker) {
  return axios({
    method: "GET",
    url: `https://www.bloomberg.com/markets2/api/datastrip/${ticker}`,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.5",
      Referer: "https://www.bloomberg.com/",
      "Content-Type": "application/json",
      Origin: "https://www.tradingview.com",
      Connection: "keep-alive",
      TE: "Trailers",
    },
  });
}

async function bloomberg(input) {
  try {
    if (!input) {
      throw Error("Parameter input is required");
    }
    const endpoint = mapping[input];
    if (!endpoint) {
      throw Error(`No mapping found for ${input}, check mapping.js`);
    }
    const response = await callBloomberg(endpoint.ticker);

    if (response.data.length == 0) {
      throw Error("No response data", mapping[input]);
    }

    const results = mapResponse(
      response.data,
      endpoint.name,
      endpoint.customFormat
    );
    return results;
  } catch (err) {
    console.error(err.message);
  }
}

exports.bloomberg = bloomberg;
