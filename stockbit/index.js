require("dotenv").config();
const axios = require("axios");
const moment = require("moment");
const numeral = require("numeral");
const {
  mapDividend,
  mapStockSplit,
  mapRightIssue,
  mapIPO,
  mapRUPS,
  mapBrokSumData,
  mapInsiderData,
} = require("./function");
const {
  STREAM_STOCKBIT_REPORTS_API,
  STREAM_ANNOUNCEMENT_API,
  DIVIDEND_API,
  STOCK_SPLIT_API,
  RIGHT_ISSUE_API,
  IPO_API,
  RUPS_API,
  CHART_DATA_API,
  MARKET_DETECTOR_API,
  INSIDER_API,
  COMPANY_API,
  COMPANY_PROFILE_API,
  ORDERBOOK_DATA_API,
} = require("../constants/api");

const {
  getTokenFromRedis,
  saveTokenToRedis,
} = require("../helper/redis");

const {
  formatStockbitDate,
  formatAccDistStatus,
  formatLiquidity,
} = require("../helper/formatter");

const MongoClient = require("mongodb").MongoClient;
const url =
  "mongodb://127.0.0.1:27017/?gssapiServiceName=mongodb&retryWrites=true";
const dbName = "kangritelbot";

const getNewToken = async () => {
  const response = await axios.post('https://stockbit.com/api/login/email', {
    username: process.env.STOCKBIT_USERNAME,
    password: process.env.STOCKBIT_PASSWORD
  });

  const loginResponse = response.data.data;

  const token = loginResponse.access.token;
  const refreshToken = loginResponse.refresh.token;
  // Save tokens to Redis
  saveTokenToRedis(token, refreshToken, loginResponse.access.expired_at, loginResponse.refresh.expired_at);

  return { token, refreshToken };
};

const refreshToken = async (refreshToken) => {
  const response = await axios.post('https://exodus.stockbit.com/login/refresh', null, {
    headers: { Authorization: `Bearer ${refreshToken}` }
  });

  const refreshResponse = response.data.data;

  const token = refreshResponse.access.token;
  // Save token to Redis
  saveTokenToRedis(token, refreshToken, refreshResponse.access.expired_at, refreshTokenExpiry);

  return token;
};

const callStockbit = async (url, params) => {
  const regex = "https://?(([^.]+).)?stockbit.com";
  const host = url.match(regex)[2];
  let { token, refreshToken } = await getTokenFromRedis();

  // If no token in Redis, get a new one
  if (!token) {
    ({ token, refreshToken } = await getNewToken());
  }

  try {
    // Check profile endpoint
    const profileResponse = await axios.get('https://exodus.stockbit.com/user/profile/kangritel', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (profileResponse.status === 200) {
      return await makeRequest(url, params, token, host);
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Refresh token
      try {
        token = await refreshToken(refreshToken);
        return await makeRequest(url, params, token, host);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Get new token
          ({ token, refreshToken } = await getNewToken());
          return await makeRequest(url, params, token, host);
        }
      }
    }
  }
};

const makeRequest = (url, params, token, host) => {
  return axios({
    method: "GET",
    url,
    params,
    headers: {
      Authorization: `Bearer ${token}`,
      Host: `${host}.stockbit.com`,
      Origin: "https://stockbit.com",
      Referer: "https://stockbit.com",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15",
      Connection: "keep-alive",
    },
  });
};

async function sbReports(ticker) {
  try {
    const params = {
      category: "ideas",
      ticker,
      limit: 100,
    };
    return await callStockbit(STREAM_STOCKBIT_REPORTS_API, params);
  } catch (err) {
    console.error(`${ticker} - ${err.message}`);
  }
}

async function announcementLink(id) {
  try {
    return await callStockbit(`${STREAM_ANNOUNCEMENT_API}/${id}`);
  } catch (err) {
    console.error(`${ticker} - ${err.message}`);
  }
}

async function dividendData() {
  try {
    const response = await callStockbit(DIVIDEND_API);

    if (response.data.data.dividend.length < 0) {
      throw Error("No dividend data");
    }

    return mapDividend(response.data.data.dividend);
  } catch (err) {
    console.error(`${ticker} - ${err.message}`);
  }
}

async function stockSplitData() {
  try {
    const response = await callStockbit(STOCK_SPLIT_API);

    if (response.data.data.stocksplit.length < 0) {
      throw Error("No stock split data");
    }

    return mapStockSplit(response.data.data.stocksplit);
  } catch (err) {
    console.error(`${ticker} - ${err.message}`);
  }
}

async function rightIssueData() {
  try {
    const response = await callStockbit(RIGHT_ISSUE_API);

    if (response.data.data.rightissue.length < 0) {
      throw Error("No stocksplit data");
    }

    return mapRightIssue(response.data.data.rightissue);
  } catch (err) {
    console.error(`${ticker} - ${err.message}`);
  }
}

async function ipoData() {
  try {
    const response = await callStockbit(IPO_API);

    if (response.data.data.ipo.length < 0) {
      throw Error("No IPO data");
    }

    return mapIPO(response.data.data.ipo);
  } catch (err) {
    console.error(`${ticker} - ${err.message}`);
  }
}

async function rupsData() {
  try {
    const response = await callStockbit(RUPS_API);

    if (response.data.data.rups.length < 0) {
      throw Error("No RUPS data");
    }

    return mapRUPS(response.data.data.rups);
  } catch (err) {
    console.error(`${ticker} - ${err.message}`);
  }
}

async function getChartData(ticker) {
  try {
    const toDate =
      moment().startOf("year").dayOfYear() <= 60
        ? moment().startOf("year").subtract(1, "year")
        : moment().startOf("year");
    const params = {
      from: formatStockbitDate(moment()),
      to: formatStockbitDate(toDate),
    };
    const response = await callStockbit(`${CHART_DATA_API}/${ticker}`, params);
    return response.data.data ? response.data.data.chartbit : undefined;
  } catch (err) {
    console.error(`${ticker} - ${err.message}`);
  }
}

async function getBrokSumData(ticker, fromDate, toDate) {
  try {
    const params = {
      from: fromDate,
      to: toDate,
      transaction_type: 'TRANSACTION_TYPE_NET',
      market_board: 'MARKET_BOARD_REGULER',
      investor_type: 'INVESTOR_TYPE_ALL'
    };
    const response = await callStockbit(
      `${MARKET_DETECTOR_API}/${ticker}`,
      params
    );
    
    return mapBrokSumData(response);
  } catch (err) {
    console.error(`${ticker} - ${err.message}`);
  }
}

async function getInsiderData(ticker) {
  try {
    const params = {
      symbol: ticker,
    };
    const response = await callStockbit(INSIDER_API, params);
    return mapInsiderData(response, ticker);
  } catch (err) {
    console.error(`${ticker} - ${err.message}`);
  }
}

async function getCompanyData(ticker) {
  try {
    const response = await callStockbit(`${COMPANY_API}/${ticker}`);
    if (response.data.data) {
      return response.data.data;
    }
  } catch (err) {
    console.error(`${ticker} - ${err.message}`);
  }
}

async function getCompanyProfileData(ticker) {
  try {
    const response = await callStockbit(`${COMPANY_PROFILE_API}/${ticker}`);
    if (response.data.data) {
      return response.data.data;
    }
  } catch (err) {
    console.error(`${ticker} - ${err.message}`);
  }
}

async function getOrderBookData(ticker) {
  try {
    const response = await callStockbit(`${ORDERBOOK_DATA_API}/${ticker}`);
    if (response.data.data) {
      return response.data.data;
    }
  } catch (err) {
    console.error(`${ticker} - ${err.message}`);
  }
}

async function getLiquidBrokSumData(ticker, fromDate, toDate) {
  try {
    const broksum = getBrokSumData(ticker, fromDate, toDate);
    const chart = getChartData(ticker);

    return new Promise((resolve, reject) => {
      Promise.all([broksum, chart]).then((res) => {
        const bs = res[0];
        const cd = res[1];

        try {
          let trx20 = 0;
          if (cd && cd.length > 20) {
            for (i = 0; i < 20; i++) {
              trx20 = trx20 + cd[i].value;
            }
            if (trx20 / 20 >= 500000000 && bs) {
              const bd = bs.bandar_detector;
              if (Object.keys(bd).length !== 0) {
                if (bd.top3.percent >= 20) {
                  resolve({
                    ticker,
                    pct: numeral(bd.top3.percent).format("0.00"),
                    accdist: formatAccDistStatus(bd.top3.vol, bd.volume),
                    liquidity: formatLiquidity(trx20 / 20),
                  });
                }
              }
            }
            resolve();
          }
          resolve();
        } catch (err) {
          console.error(`${ticker} - ${err.message}`);
          resolve();
        }
      });
    });
  } catch (err) {
    console.error(`${ticker} - ${err.message}`);
    resolve();
  }
}

module.exports = {
  sbReports,
  // announcementLink,
  dividendData,
  stockSplitData,
  rightIssueData,
  ipoData,
  rupsData,
  getChartData,
  getBrokSumData,
  getInsiderData,
  getCompanyData,
  getCompanyProfileData,
  getOrderBookData,
  getLiquidBrokSumData,
};
