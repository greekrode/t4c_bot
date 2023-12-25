require("dotenv").config();
const axios = require("axios");

const { FINANCIAL_DATA_API } = require("../constants/api");

const callAjaib = (url, params) => {
  return axios({
    method: "GET",
    url,
    params,
    headers: {
      Authorization: process.env.AJAIB_TOKEN,
      Referer: "https://invest.ajaib.co.id/",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15",
      "Accept-Language": "id",
      Origin: "https://invest.ajaib.co.id/",
    },
  });
};

async function getFinancialData(ticker) {
  try {
    const response = await callAjaib(FINANCIAL_DATA_API(ticker));
    return response.data;
  } catch (err) {
    console.error(err.message);
  }
}

module.exports = { getFinancialData };
