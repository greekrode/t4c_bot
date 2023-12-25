require("dotenv").config();
const express = require("express");
const app = express();
const port = 3001;
const axios = require("axios").default;
const moment = require("moment");
const numeral = require("numeral");
const fetch = require("node-fetch");
const redis = require("redis");
const { promisify } = require("util");
// const { marketdata } = require("../marketdata/index");

const { redisMDKey, saveToRedisCacheMD } = require("../helper/redis");
const { formatBroksumDate } = require("../helper/formatter");
const mongoUtil = require("../helper/mongo");
const token = "1128442233:AAEIzvZ9d5FiKc6pssKB6K-ixuBgXpNYNrY";

const redisClient = redis.createClient(
  {
    url: "redis://default:mb7LH8IY5UsPb0i7XfTEhR96kWD8ehIZ@redis-11243.c295.ap-southeast-1-1.ec2.cloud.redislabs.com:11243"
    // url: "redis://172.16.25.93:6379"
  },
  {
  retry_strategy: function (options) {
    if (options.error && options.error.code === "ECONNREFUSED") {
      // End reconnecting on a specific error and flush all commands with
      // a individual error
      return new Error("The server refused the connection");
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      // End reconnecting after a specific timeout and flush all commands
      // with a individual error
      return new Error("Retry time exhausted");
    }
    if (options.attempt > 10) {
      // End reconnecting with built in error
      return undefined;
    }
    // reconnect after
    return Math.min(options.attempt * 100, 3000);
  },
});

redisClient.on("error", function (err) {
  console.error("Redis Error " + err);
});

const getRedis = promisify(redisClient.get).bind(redisClient);

const stockbit = axios.create({
  baseURL: "https://api.stockbit.com/v2.4/",
  headers: {
    Authorization: process.env.STOCKBIT_TOKEN,
    Host: "api.stockbit.com",
    Origin: "https://stockbit.com",
    Referer: "https://stockbit.com",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15",
    Connection: "keep-alive",
  },
});

const tosBaseURL = "https://tos.s-trade.co.id/WebConsole/";

function convertVal(val) {
  return numeral(val).format("0.00a").toUpperCase();
}

function convertToThousand(val) {
  return numeral(val).format(0, 0);
}

function processTOSData(data) {
  const rex = /\(([^()]*)\)/g;
  const resp = rex.exec(data);
  return resp[1].split(",");
}

const getBrokSumData = async (ticker, date) => {
  try {
    const dateInput = moment(date, "MM/DD/YYYY h:mm:ss A");
    let fromDate = dateInput.format("YYYY-MM-DD");
    let toDate = dateInput.format("YYYY-MM-DD");

    if (dateInput.day() == 0) {
      fromDate = dateInput.subtract(2, "days").format("YYYY-MM-DD");
    } else if (dateInput.day() == 6) {
      fromDate = dateInput.subtract(1, "days").format("YYYY-MM-DD");
    } else if (
      dateInput.isBetween(
        moment("00:00:00", "HH:mm:ss"),
        moment("08:54:00", "HH:mm:ss")
      )
    ) {
      if (dateInput.day() == 1) {
        fromDate = dateInput.subtract(3, "days").format("YYYY-MM-DD");
      } else {
        fromDate = dateInput.subtract(1, "days").format("YYYY-MM-DD");
      }
    }

    const res = await stockbit.get(
      "marketdetector/" + ticker + "?from=" + fromDate + "&to=" + toDate
    );

    if (res.data.data != undefined) {
      return res.data.data;
    } else {
      return null;
    }
  } catch (err) {
    console.error(err);
  }
};

const getMWBroksumData = async (ticker, date) => {
  try {
    const dateInput = moment(date, "MM/DD/YYYY h:mm:ss A");
    let toDate = dateInput.format("YYYY-MM-DD");

    const fromDateW = dateInput.subtract(7, "days").format("YYYY-MM-DD");
    const fromDateM = dateInput.subtract(1, "months").format("YYYY-MM-DD");

    const resW = await stockbit.get(
      "marketdetector/" + ticker + "?from=" + fromDateW + "&to=" + toDate
    );
    const resM = await stockbit.get(
      "marketdetector/" + ticker + "?from=" + fromDateM + "&to=" + toDate
    );

    if (resW.data.data != undefined && resM.data.data != undefined) {
      return {
        fromDateW: moment(fromDateW, "YYYY-MM-DD").format("D MMM YYYY"),
        fromDateM: moment(fromDateM, "YYYY-MM-DD").format("D MMM YYYY"),
        dataW: resW.data.data,
        dataM: resM.data.data,
      };
    } else {
      return null;
    }
  } catch (err) {
    console.log(err);
  }
};

const getTickerData = async (ticker) => {
  return await fetch(tosBaseURL + "qsxON?code=" + ticker, {
    method: "POST",
    body: "rID=7110&sID=%7B576431cb-57bf-4398-80c7-c772956ba790%7D&UserLoginToken=",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      Origin: "https://tos.s-trade.co.id",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "*/*",
      Connection: "keep-alive",
      Referer: "https://tos.s-trade.co.id/",
      Cookie:
        "__RequestVerificationToken=Y7VjskrJoNQsqK8lATmonK6YhPtJIpqkc4TrUOSdYu9Z5alPZhHjV9-BYkVMEd_w6-gE4RSGE952EPivggxGtsQbfcjO4hvTUU_36QYYj-A1; ASP.NET_SessionId=b3emxn3zuqmbcr2rhefamiqr",
    },
  })
    .then((result) => result.text())
    .then((text) => processTOSData(text));
};

const getOrderbookData = async (ticker) => {
  try {
    const res = await stockbit.get("orderbook/preview/" + ticker);
    if (res != undefined) {
      return res.data.data;
    }
  } catch (err) {
    console.error(err);
  }
};

const checkRedisCache = (key) => {
  return getRedis(key);
};

const redisBDBuyKey = (ticker, date) => {
  return `BDBuy:${ticker}_${date}`;
};

const redisBDSellKey = (ticker, date) => {
  return `BDSell:${ticker}_${date}`;
};

const redisBDBuyFullKey = (ticker, date) => {
  return `BDBuyFull:${ticker}_${date}`;
};

const redisBDSellFullKey = (ticker, date) => {
  return `BDSellFull:${ticker}_${date}`;
};

const redisBDStatsKey = (ticker, date) => {
  return `BDStats:${ticker}_${date}`;
};

const redisBDStatWMsKey = (ticker, date) => {
  return `BDStatsWM:${ticker}_${date}`;
};

const redisTrxValKey = (ticker) => {
  return "TrxVal:" + ticker;
};

const redisFreqKey = (ticker) => {
  return "Freq:" + ticker;
};

const redistFNetKey = (ticker) => {
  return "Fnet:" + ticker;
};

const redisIndexKey = (region) => {
  return `Index:${region}`;
};

const saveToRedisCache = (key, value) => {
  const finalKey = key.replace("undefined", "");
  const tomorrowDay = moment()
    .add(1, "days")
    .startOf("day")
    .add(510, "minutes");
  const tomorrowFinal = moment(tomorrowDay);
  const nextWeek = moment()
    .add(1, "weeks")
    .startOf("isoWeek")
    .add(510, "minutes");
  if (moment().isBetween(moment("15:35:00", "HH:mm:ss"), tomorrowFinal)) {
    redisClient.set(finalKey, value.toString());
    redisClient.expire(finalKey, tomorrowFinal.diff(moment(), "seconds"));
  } else if (moment().day() == 6 || moment().day() == 0) {
    redisClient.set(finalKey, value);
    redisClient.expire(finalKey, nextWeek.diff(moment(), "seconds"));
  }
};

app.get("/bdbuy", (req, res) => {
  checkRedisCache(redisBDBuyKey(req.query.ticker, req.query.date)).then(
    (cache) => {
      if (cache != null) {
        return res.send(cache);
      }

      return getBrokSumData(req.query.ticker, req.query.date).then((result) => {
        const bd = result.broker_summary.brokers_buy;
        const response =
          bd[0].netbs_broker_code +
          ", " +
          bd[1].netbs_broker_code +
          ", " +
          bd[2].netbs_broker_code +
          ", " +
          bd[3].netbs_broker_code +
          ", " +
          bd[4].netbs_broker_code;
        saveToRedisCache(
          redisBDBuyKey(req.query.ticker, req.query.date),
          response
        );
        res.send(response);
      });
    }
  );
});

app.get("/bdsell", (req, res) => {
  checkRedisCache(redisBDSellKey(req.query.ticker, req.query.date)).then(
    (cache) => {
      if (cache != null) {
        return res.send(cache);
      }

      return getBrokSumData(req.query.ticker, req.query.date).then((result) => {
        const bd = result.broker_summary.brokers_sell;
        const response =
          bd[0].netbs_broker_code +
          ", " +
          bd[1].netbs_broker_code +
          ", " +
          bd[2].netbs_broker_code +
          ", " +
          bd[3].netbs_broker_code +
          ", " +
          bd[4].netbs_broker_code;
        saveToRedisCache(
          redisBDSellKey(req.query.ticker, req.query.date),
          response
        );
        res.send(response);
      });
    }
  );
});

app.get("/bdbuyfull", (req, res) => {
  checkRedisCache(redisBDBuyFullKey(req.query.ticker, req.query.date)).then(
    (cache) => {
      if (cache != null) {
        return res.send(cache);
      }

      return getBrokSumData(req.query.ticker, req.query.date).then((result) => {
        if (result != undefined) {
          const bd = result.broker_summary.brokers_buy;
          let response = "";
          const sizeB = bd.length <= 5 ? bd.length : 5;

          for (i = 0; i < sizeB; i++) {
            response =
              response +
              (i + 1) +
              ". " +
              bd[i].netbs_broker_code +
              " - Lot: " +
              numeral(bd[i].blot).format(0, 0) +
              " - Val: " +
              convertVal(bd[i].bval) +
              " - Avg: " +
              numeral(Math.round(bd[i].netbs_buy_avg_price)).format(0, 0) +
              "\n";
          }

          saveToRedisCache(
            redisBDBuyFullKey(req.query.ticker, req.query.date),
            response
          );
          res.send(response);
        } else {
          res.send(null);
        }
      });
    }
  );
});

app.get("/bdsellfull", (req, res) => {
  checkRedisCache(redisBDSellFullKey(req.query.ticker, req.query.date)).then(
    (cache) => {
      if (cache != null) {
        return res.send(cache);
      }

      return getBrokSumData(req.query.ticker, req.query.date).then((result) => {
        if (result != undefined) {
          const bd = result.broker_summary.brokers_sell;
          let response = "";
          const sizeS = bd.length <= 5 ? bd.length : 5;

          for (i = 0; i < sizeS; i++) {
            response =
              response +
              (i + 1) +
              ". " +
              bd[i].netbs_broker_code +
              " - Lot: " +
              numeral(bd[i].slot).format(0, 0) +
              " - Val: " +
              convertVal(bd[i].sval) +
              " - Avg: " +
              numeral(Math.round(bd[i].netbs_sell_avg_price)).format(0, 0) +
              "\n";
          }

          saveToRedisCache(
            redisBDSellFullKey(req.query.ticker, req.query.date),
            response
          );
          res.send(response);
        } else {
          res.send(null);
        }
      });
    }
  );
});

app.get("/bdstats", (req, res) => {
  checkRedisCache(redisBDStatsKey(req.query.ticker, req.query.date)).then(
    (cache) => {
      if (cache != null) {
        return res.send(cache);
      }

      getBrokSumData(req.query.ticker, req.query.date).then((result) => {
        if (result != undefined) {
          const rbd = result.bandar_detector;
          let response = "";
          if (Object.keys(rbd).length > 0) {
            response = response + "====== Bandarmology Status ======" + "\n";
            response = response + "Buyer: " + rbd.total_buyer + "\n";
            response = response + "Seller: " + rbd.total_seller + "\n";
            response =
              response +
              "TOP 1: " +
              rbd.top1.accdist +
              " (" +
              numeral(rbd.top1.vol).format(0, 0) +
              " Lot - " +
              convertVal(rbd.top1.amount) +
              ")\n";
            response =
              response +
              "TOP 3: " +
              rbd.top3.accdist +
              " (" +
              numeral(rbd.top3.vol).format(0, 0) +
              " Lot - " +
              convertVal(rbd.top3.amount) +
              ")\n";
            response =
              response +
              "TOP 5: " +
              rbd.top5.accdist +
              " (" +
              numeral(rbd.top5.vol).format(0, 0) +
              " Lot - " +
              convertVal(rbd.top5.amount) +
              ")\n";

            saveToRedisCache(
              redisBDStatsKey(req.query.ticker, req.query.date),
              response
            );
            return res.send(response);
          } else {
            return res.send(null);
          }
        } else {
          return res.send(null);
        }
      });
    }
  );
});

app.get("/bdstatswm", (req, res) => {
  checkRedisCache(redisBDStatWMsKey(req.query.ticker, req.query.date)).then(
    (cache) => {
      if (cache != null) {
        return res.send(cache);
      }

      return getMWBroksumData(req.query.ticker, req.query.date).then(
        (resWM) => {
          let response = "";

          if (resWM == undefined) {
            return res.send("");
          }

          if (Object.keys(resWM).length == 0) {
            return res.send("");
          }

          const respnoseBDW = resWM.dataW.bandar_detector;
          const respnoseBDM = resWM.dataM.bandar_detector;
          const responseBSBuyW = resWM.dataW.broker_summary.brokers_buy;
          const responseBSSellW = resWM.dataW.broker_summary.brokers_sell;
          const responseBSBuyM = resWM.dataM.broker_summary.brokers_buy;
          const responseBSSellM = resWM.dataM.broker_summary.brokers_sell;

          const sizeBW = responseBSBuyW.length <= 3 ? responseBSBuyW : 3;
          const sizeSW = responseBSSellW.length <= 3 ? responseBSBuyW : 3;
          const sizeBM = responseBSBuyM.length <= 3 ? responseBSBuyM : 3;
          const sizeSM = responseBSSellM.length <= 3 ? responseBSSellM : 3;
          let t3nbw = "";
          let t3nsw = "";
          let t3nbm = "";
          let t3nsm = "";

          if (Object.keys(respnoseBDW).length != 0) {
            for (i = 0; i < sizeBW; i++) {
              t3nbw =
                t3nbw +
                "\n" +
                responseBSBuyW[i].netbs_broker_code +
                " (" +
                numeral(responseBSBuyW[i].blot).format(0, 0) +
                " lot - " +
                numeral(
                  Math.round(responseBSBuyW[i].netbs_buy_avg_price)
                ).format(0, 0) +
                ")";
            }

            for (i = 0; i < sizeSW; i++) {
              t3nsw =
                t3nsw +
                "\n" +
                responseBSSellW[i].netbs_broker_code +
                " (" +
                numeral(responseBSSellW[i].slot).format(0, 0) +
                " lot - " +
                numeral(
                  Math.round(responseBSSellW[i].netbs_sell_avg_price)
                ).format(0, 0) +
                ")";
            }

            response =
              response + `====== Weekly Info ====== (${resWM.fromDateW})\n`;
            response =
              response +
              "TOP 1: " +
              respnoseBDW.top1.accdist +
              " - TOP 3: " +
              respnoseBDW.top3.accdist +
              " - TOP 5: " +
              respnoseBDW.top5.accdist;
            response = response + "\nNET BUY" + t3nbw;
            response = response + "\nNET SELL" + t3nsw;
          }

          if (Object.keys(respnoseBDM).length != 0) {
            for (i = 0; i < sizeBM; i++) {
              t3nbm =
                t3nbm +
                "\n" +
                responseBSBuyM[i].netbs_broker_code +
                " (" +
                numeral(responseBSBuyM[i].blot).format(0, 0) +
                " lot - " +
                numeral(
                  Math.round(responseBSBuyM[i].netbs_buy_avg_price)
                ).format(0, 0) +
                ")";
            }

            for (i = 0; i < sizeSM; i++) {
              t3nsm =
                t3nsm +
                "\n" +
                responseBSSellM[i].netbs_broker_code +
                " (" +
                numeral(responseBSSellM[i].slot).format(0, 0) +
                " lot - " +
                numeral(
                  Math.round(responseBSSellM[i].netbs_sell_avg_price)
                ).format(0, 0) +
                ")";
            }
            response =
              response +
              `\n\n====== Monthly Info ====== (${resWM.fromDateM})\n`;
            response =
              response +
              "TOP 1: " +
              respnoseBDM.top1.accdist +
              " - TOP 3: " +
              respnoseBDM.top3.accdist +
              " - TOP 5: " +
              respnoseBDM.top5.accdist;
            response = response + "\nNET BUY" + t3nbm;
            response = response + "\nNET SELL" + t3nsm;
          }

          saveToRedisCache(
            redisBDStatWMsKey(req.query.ticker, req.query.date),
            response
          );
          res.send(response);
        }
      );
    }
  );
});

app.get("/trxval", (req, res) => {
  checkRedisCache(redisTrxValKey(req.query.ticker)).then((cache) => {
    if (cache != null) {
      return res.send(cache);
    }

    return getOrderbookData(req.query.ticker).then((result) => {
      if (result != undefined) {
        const response = convertVal(result.value);

        saveToRedisCache(redisTrxValKey(req.query.ticker), response);
        res.send(response);
      } else {
        res.send(null);
      }
    });
  });
});

app.get("/fnet", (req, res) => {
  checkRedisCache(redistFNetKey(req.query.ticker)).then((cache) => {
    if (cache != null) {
      return res.send(cache);
    }
    return getOrderbookData(req.query.ticker).then((result) => {
      if (result != undefined) {
        const response = convertVal(result.fnet);

        saveToRedisCache(redistFNetKey(req.query.ticker), response);
        res.send(response);
      } else {
        res.send(null);
      }
    });
  });
});

app.get("/freq", (req, res) => {
  checkRedisCache(redisFreqKey(req.query.ticker)).then((cache) => {
    if (cache != null) {
      return res.send(cache);
    }
    return getOrderbookData(req.query.ticker).then((result) => {
      if (result != undefined) {
        const response = convertToThousand(result.frequency);

        saveToRedisCache(redisFreqKey(req.query.ticker), response);
        res.send(response);
      } else {
        res.send(null);
      }
    });
  });
});

// app.get("/md", (req, aRes) => {
//   if (moment().day() == 6 || moment.day() == 0) {
//     return aRes.sendStatus(201);
//   }

//   const today = moment().format("MMM Do, YYYY (dddd)");

//   checkRedisCache(redisMDKey(moment().format("YYYYMMDD"))).then((cache) => {
//     if (cache) {
//       return aRes.send(cache);
//     }

//     marketdata.then((res) => {
//       const title = `<b>${today}</b>\n\nDear investor, below are worldwide market data\n\n`;
//       const footer = `<b>By Trade4Cuan (https://t.me/tradeforcuan)</b>\n<i>Source: Investing, Bloomberg, Tradingview, SunSirs, WorldGovernmentBonds</i>`;
//       let textMessage = "";

//       for (i = 0; i < res.length; i++) {
//         textMessage = textMessage + res[i];
//       }

//       const message = title + textMessage + footer;

//       saveToRedisCacheMD(redisMDKey(moment().format("YYYYMMDD")), message);
//       return aRes.send(message);
//     });
//   });
// });

app.listen(port, () => {
  console.log(`T4C Bot Server listening at http://localhost:${port}`);
});
