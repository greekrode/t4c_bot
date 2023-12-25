STOCKBIT_BASE_URL = "https://api.stockbit.com/v2.4";
STOCKBIT_EXODUS_BASE_URL = "https://exodus.stockbit.com";

STREAM_STOCKBIT_REPORTS_API = `${STOCKBIT_EXODUS_BASE_URL}/stream/user/StockbitReports`;
COMPANY_API = `${STOCKBIT_BASE_URL}/company`;

STREAM_ANNOUNCEMENT_API = `${STOCKBIT_BASE_URL}/stream/announcement`;
DIVIDEND_API = `${STOCKBIT_BASE_URL}/calendar/dividend`;
STOCK_SPLIT_API = `${STOCKBIT_BASE_URL}/calendar/stocksplit`;
RIGHT_ISSUE_API = `${STOCKBIT_BASE_URL}/calendar/rightissue`;
IPO_API = `${STOCKBIT_BASE_URL}/calendar/ipo`;
RUPS_API = `${STOCKBIT_BASE_URL}/calendar/rups`;
CHART_DATA_API = `${STOCKBIT_BASE_URL}/tradingview/price`;
MARKET_DETECTOR_API = `${STOCKBIT_EXODUS_BASE_URL}/marketdetectors`;
INSIDER_API = `${COMPANY_API}/majorholder`;
COMPANY_PROFILE_API = `${COMPANY_API}/profile`;
ORDERBOOK_DATA_API = `${STOCKBIT_BASE_URL}/orderbook/preview`;

AJAIB_BASE_URL = "https://app.ajaib.co.id/api/v1";
const FINANCIAL_DATA_API = (ticker) => {
  return `${AJAIB_BASE_URL}/stock/detail/${ticker}/ranked/key_statistics/`;
};

module.exports = {
  STREAM_STOCKBIT_REPORTS_API,
  STREAM_ANNOUNCEMENT_API,
  STOCK_SPLIT_API,
  DIVIDEND_API,
  RIGHT_ISSUE_API,
  IPO_API,
  RUPS_API,
  CHART_DATA_API,
  MARKET_DETECTOR_API,
  INSIDER_API,
  COMPANY_API,
  COMPANY_PROFILE_API,
  ORDERBOOK_DATA_API,
  FINANCIAL_DATA_API,
};
