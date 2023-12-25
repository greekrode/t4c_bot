const numeral = require("numeral");
const { checkLiquidity } = require("../helper/validator");
const { formatAccDistStatus, formatLiquidity } = require("../helper/formatter");
const MongoClient = require("mongodb").MongoClient;
const url =
  "mongodb://127.0.0.1:27017/?gssapiServiceName=mongodb&retryWrites=true";
const dbName = "kangritelbot";
let _db;

async function getBrokSumdataFromDB(ticker) {
  const client = await MongoClient.connect(url, { useUnifiedTopology: true });
  const db = client.db(dbName);

  try {
    const resD = await db
      .collection("daily_broker_summary")
      .findOne({ ticker });
    const resEW = await db
      .collection("early_week_broker_summary")
      .findOne({ ticker });
    const resW = await db
      .collection("weekly_broker_summary")
      .findOne({ ticker });
    const resEM = await db
      .collection("early_month_broker_summary")
      .findOne({ ticker });
    const resM = await db
      .collection("monthly_broker_summary")
      .findOne({ ticker });

    return {
      resD: resD.data,
      resEW: resEW.data,
      resEM: resEM.data,
      resM: resM.data,
      resW: resW.data,
    };
  } catch (err) {
    console.error(err);
  }
}

async function getBrokSumDataFromDBByTF(tf, filter) {
  const client = await MongoClient.connect(url, { useUnifiedTopology: true });
  const db = client.db(dbName);

  try {
    const resD = await db
      .collection("daily_broker_summary")
      .find(filter)
      .toArray();
    const resEW = await db
      .collection("early_week_broker_summary")
      .find(filter)
      .toArray();
    const resW = await db
      .collection("weekly_broker_summary")
      .find(filter)
      .toArray();
    const resEM = await db
      .collection("early_month_broker_summary")
      .find(filter)
      .toArray();
    const resM = await db
      .collection("monthly_broker_summary")
      .find(filter)
      .toArray();

    return tf == "D"
      ? resD
      : tf == "W"
      ? resW
      : tf == "M"
      ? resM
      : (tf = "EW" ? resEW : (tf = "EM" ? resEM : false));
  } catch (err) {
    console.error(err);
  }
}

const COLLECTIONS = {
  "D": "daily_broker_summary",
  "3D": "3d_broker_summary",
  "EW": "early_week_broker_summary",
  "W": "weekly_broker_summary",
  "EM": "early_month_broker_summary",
  "M": "monthly_broker_summary"
};

async function getLiquidBrokSumDataFromDB(ticker, tf, ad, number) {
  const client = await MongoClient.connect(url, { useUnifiedTopology: true });
  const db = client.db(dbName);

  try {
    const bs = await db.collection(COLLECTIONS[tf] || "").findOne({ ticker });
    const cd = await db.collection("chart_data").findOne({ ticker });
    const liquid = cd.data[0].value;
    const liquidity = checkLiquidity(cd.data[0].value);

    if (liquidity && bs) {
      try {
        const bd = bs.data.bandar_detector;
        if (Object.keys(bd).length !== 0) {
          const result = calculateResult(bd, ad, number, liquid, ticker);
          if (result) return result;
        }
      } catch (err) {
        console.error("Error", err);
        console.error("Liquid Broksum Data Build Failed", ticker);
      }
    }
  } catch (err) {
    console.error("Liquid Broksum Data Fetch Failed", ticker);
  }
}

function calculateResult(bd, ad, number, liquid, ticker) {
  const conditions = {
    "1": bd.top3.percent,
    "3": bd.top3.percent,
    "5": bd.top5.percent,
    "13": bd.top1.percent >= 15 && bd.top3.percent >= 15,
    "35": bd.top3.percent >= 15 && bd.top5.percent >= 15,
    "135": bd.top1.percent >= 15 && bd.top3.percent >= 15 && bd.top5.percent >= 15,
    "15": bd.top1.percent >= 15 && bd.top5.percent >= 15
  };

  const percent = {
    "1": bd.top1.percent,
    "3": bd.top3.percent,
    "5": bd.top5.percent,
    "13": (bd.top1.percent + bd.top3.percent) / 2,
    "35": (bd.top3.percent + bd.top5.percent) / 2,
    "135": (bd.top1.percent + bd.top3.percent + bd.top5.percent) / 3,
    "15": (bd.top1.percent + bd.top5.percent) / 2
  };

  const volume = {
    "1": bd.top1.vol,
    "3": bd.top3.vol,
    "5": bd.top5.vol,
    "13": (bd.top1.vol + bd.top3.vol) / 2,
    "35": (bd.top3.vol + bd.top5.vol) / 2,
    "135": (bd.top1.vol + bd.top3.vol + bd.top5.vol) / 3,
    "15": (bd.top1.vol + bd.top5.vol) / 2
  };

  const condition = conditions[number];
  const isAcc = ad == "ACC";
  const isConditionMet = isAcc ? condition >= 15 : condition <= -15;

  if (isConditionMet) {
    return {
      ticker,
      pct: numeral(percent[number]).format("0.00"),
      accdist: formatAccDistStatus(volume[number], bd.volume),
      liquidity: formatLiquidity(liquid),
    };
  }
}

async function getBrokerCode(code) {
  const client = await MongoClient.connect(url, { useUnifiedTopology: true });
  const db = client.db(dbName);

  return await db.collection("broker_code").findOne({ code });
}

module.exports = {
  connectToServer: function (callback) {
    MongoClient.connect(
      url,
      { useNewUrlParser: true, useUnifiedTopology: true },
      function (err, client) {
        _db = client.db(dbName);
        return callback(err);
      }
    );
  },

  getDb: function () {
    return _db;
  },
  getBrokSumdataFromDB,
  getLiquidBrokSumDataFromDB,
  getBrokSumDataFromDBByTF,
  getBrokerCode,
};
