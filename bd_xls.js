const {
  formatAccDistStatus,
  formatBroksumDate,
  calculateCDData,
} = require("./helper/formatter");

const MongoClient = require("mongodb").MongoClient;
const url =
  "mongodb://127.0.0.1:27017/?gssapiServiceName=mongodb&retryWrites=true";
const dbName = "kangritelbot";

const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const { checkLiquidity } = require("./helper/validator");

let allCounter = 0;
const dCsvWriter = createCsvWriter({
  path: "data/dailybd.csv",
  header: [
    { id: "ticker", title: "Ticker" },
    { id: "top1_pct", title: "Top 1 Pct" },
    { id: "top1_stats", title: "Top 1 Status" },
    { id: "top3_pct", title: "Top 3 Pct" },
    { id: "top3_stats", title: "Top 3 Status" },
    { id: "top5_pct", title: "Top 5 Pct" },
    { id: "top5_stats", title: "Top 5 Status" },
    { id: "topavg_pct", title: "Top Broker Average Pct" },
    { id: "topavg_stats", title: "Top Broker Average Status" },
    { id: "f_value", title: "Foreign Value" },
    { id: "f_stats", title: "Foreign Status" },
  ],
});

let dCounter = 1;
let data = [];
MongoClient.connect(url, { useUnifiedTopology: true }, (er, client) => {
  const db = client.db(dbName);
  const { fromDate, toDate } = formatBroksumDate([""]);
  db.collection("daily_broker_summary")
    .find()
    .toArray((err, res) => {
      res.map((r) => {
        db.collection("chart_data").findOne(
          { ticker: r.ticker },
          (err, cRes) => {
            const { trx, foreign } = calculateCDData(
              cRes.data,
              fromDate,
              toDate
            );
            const liquid = checkLiquidity(trx);
            if (r.data && liquid) {
              if (r.data.bandar_detector !== null) {
                const bd = r.data.bandar_detector;
                data.push({
                  ticker: r.ticker,
                  top1_pct: bd.top1.percent,
                  top1_stats: formatAccDistStatus(bd.top1.vol, bd.volume),
                  top3_pct: bd.top3.percent,
                  top3_stats: formatAccDistStatus(bd.top3.vol, bd.volume),
                  top5_pct: bd.top5.percent,
                  top5_stats: formatAccDistStatus(bd.top5.vol, bd.volume),
                  topavg_pct:
                    (bd.top1.percent + bd.top3.percent + bd.top5.percent) / 3,
                  topavg_stats: formatAccDistStatus(
                    (bd.top1.vol + bd.top3.vol + bd.top5.vol) / 3,
                    bd.volume
                  ),
                  f_value: foreign,
                  f_stats: (foreign / trx) * 100,
                });
              }
            }

            if (dCounter == 793) {
              allCounter++;
              dCsvWriter
                .writeRecords(data)
                .then(() => console.log("Success CSV Daily"));
            }
            dCounter++;
          }
        );
      });
    });
});

const ewCsvWriter = createCsvWriter({
  path: "data/earlyweekbd.csv",
  header: [
    { id: "ticker", title: "Ticker" },
    { id: "top1_pct", title: "Top 1 Pct" },
    { id: "top1_stats", title: "Top 1 Status" },
    { id: "top3_pct", title: "Top 3 Pct" },
    { id: "top3_stats", title: "Top 3 Status" },
    { id: "top5_pct", title: "Top 5 Pct" },
    { id: "top5_stats", title: "Top 5 Status" },
    { id: "topavg_pct", title: "Top Broker Average Pct" },
    { id: "topavg_stats", title: "Top Broker Average Status" },
    { id: "f_value", title: "Foreign Value" },
    { id: "f_stats", title: "Foreign Status" },
  ],
});

let ewCounter = 1;
let ewData = [];
MongoClient.connect(url, { useUnifiedTopology: true }, (er, client) => {
  const db = client.db(dbName);
  const { fromDate, toDate } = formatBroksumDate(["", "ew"]);
  db.collection("early_week_broker_summary")
    .find()
    .toArray((err, res) => {
      res.map((r) => {
        db.collection("chart_data").findOne(
          { ticker: r.ticker },
          (err, cRes) => {
            const { trx, foreign } = calculateCDData(
              cRes.data,
              fromDate,
              toDate
            );
            const liquid = checkLiquidity(trx);
            if (r.data && liquid) {
              if (r.data.bandar_detector !== null) {
                const bd = r.data.bandar_detector;
                ewData.push({
                  ticker: r.ticker,
                  top1_pct: bd.top1.percent,
                  top1_stats: formatAccDistStatus(bd.top1.vol, bd.volume),
                  top3_pct: bd.top3.percent,
                  top3_stats: formatAccDistStatus(bd.top3.vol, bd.volume),
                  top5_pct: bd.top5.percent,
                  top5_stats: formatAccDistStatus(bd.top5.vol, bd.volume),
                  topavg_pct:
                    (bd.top1.percent + bd.top3.percent + bd.top5.percent) / 3,
                  topavg_stats: formatAccDistStatus(
                    (bd.top1.vol + bd.top3.vol + bd.top5.vol) / 3,
                    bd.volume
                  ),
                  f_value: foreign,
                  f_stats: (foreign / trx) * 100,
                });
              }
            }

            if (ewCounter == 793) {
              allCounter++;
              ewCsvWriter
                .writeRecords(ewData)
                .then(() => console.log("Success CSV EW"));
            }
            ewCounter++;
          }
        );
      });
    });
});

const emCsvWriter = createCsvWriter({
  path: "data/earlymonthbd.csv",
  header: [
    { id: "ticker", title: "Ticker" },
    { id: "top1_pct", title: "Top 1 Pct" },
    { id: "top1_stats", title: "Top 1 Status" },
    { id: "top3_pct", title: "Top 3 Pct" },
    { id: "top3_stats", title: "Top 3 Status" },
    { id: "top5_pct", title: "Top 5 Pct" },
    { id: "top5_stats", title: "Top 5 Status" },
    { id: "topavg_pct", title: "Top Broker Average Pct" },
    { id: "topavg_stats", title: "Top Broker Average Status" },
    { id: "f_value", title: "Foreign Value" },
    { id: "f_stats", title: "Foreign Status" },
  ],
});

let emCounter = 1;
let emData = [];
MongoClient.connect(url, { useUnifiedTopology: true }, (er, client) => {
  const db = client.db(dbName);
  const { fromDate, toDate } = formatBroksumDate(["", "em"]);
  db.collection("early_month_broker_summary")
    .find()
    .toArray((err, res) => {
      res.map((r) => {
        db.collection("chart_data").findOne(
          { ticker: r.ticker },
          (err, cRes) => {
            const { trx, foreign } = calculateCDData(
              cRes.data,
              fromDate,
              toDate
            );
            const liquid = checkLiquidity(trx);
            if (r.data && liquid) {
              if (r.data.bandar_detector !== null) {
                const bd = r.data.bandar_detector;
                emData.push({
                  ticker: r.ticker,
                  top1_pct: bd.top1.percent,
                  top1_stats: formatAccDistStatus(bd.top1.vol, bd.volume),
                  top3_pct: bd.top3.percent,
                  top3_stats: formatAccDistStatus(bd.top3.vol, bd.volume),
                  top5_pct: bd.top5.percent,
                  top5_stats: formatAccDistStatus(bd.top5.vol, bd.volume),
                  topavg_pct:
                    (bd.top1.percent + bd.top3.percent + bd.top5.percent) / 3,
                  topavg_stats: formatAccDistStatus(
                    (bd.top1.vol + bd.top3.vol + bd.top5.vol) / 3,
                    bd.volume
                  ),
                  f_value: foreign,
                  f_stats: (foreign / trx) * 100,
                });
              }
            }

            if (emCounter == 793) {
              allCounter++;
              emCsvWriter
                .writeRecords(emData)
                .then(() => console.log("Success CSV EM"));
            }
            emCounter++;
          }
        );
      });
    });
});

const d2CsvWriter = createCsvWriter({
  path: "data/2dbd.csv",
  header: [
    { id: "ticker", title: "Ticker" },
    { id: "top1_pct", title: "Top 1 Pct" },
    { id: "top1_stats", title: "Top 1 Status" },
    { id: "top3_pct", title: "Top 3 Pct" },
    { id: "top3_stats", title: "Top 3 Status" },
    { id: "top5_pct", title: "Top 5 Pct" },
    { id: "top5_stats", title: "Top 5 Status" },
    { id: "topavg_pct", title: "Top Broker Average Pct" },
    { id: "topavg_stats", title: "Top Broker Average Status" },
    { id: "f_value", title: "Foreign Value" },
    { id: "f_stats", title: "Foreign Status" },
  ],
});

let d2Counter = 1;
let d2Data = [];
MongoClient.connect(url, { useUnifiedTopology: true }, (er, client) => {
  const db = client.db(dbName);
  const { fromDate, toDate } = formatBroksumDate(["", "2d"]);
  db.collection("2d_broker_summary")
    .find()
    .toArray((err, res) => {
      res.map((r) => {
        db.collection("chart_data").findOne(
          { ticker: r.ticker },
          (err, cRes) => {
            const { trx, foreign } = calculateCDData(
              cRes.data,
              fromDate,
              toDate
            );
            const liquid = checkLiquidity(trx);
            if (r.data && liquid) {
              if (r.data.bandar_detector !== null) {
                const bd = r.data.bandar_detector;
                d2Data.push({
                  ticker: r.ticker,
                  top1_pct: bd.top1.percent,
                  top1_stats: formatAccDistStatus(bd.top1.vol, bd.volume),
                  top3_pct: bd.top3.percent,
                  top3_stats: formatAccDistStatus(bd.top3.vol, bd.volume),
                  top5_pct: bd.top5.percent,
                  top5_stats: formatAccDistStatus(bd.top5.vol, bd.volume),
                  topavg_pct:
                    (bd.top1.percent + bd.top3.percent + bd.top5.percent) / 3,
                  topavg_stats: formatAccDistStatus(
                    (bd.top1.vol + bd.top3.vol + bd.top5.vol) / 3,
                    bd.volume
                  ),
                  f_value: foreign,
                  f_stats: (foreign / trx) * 100,
                });
              }
            }

            if (d2Counter == 793) {
              allCounter++;
              d2CsvWriter
                .writeRecords(d2Data)
                .then(() => console.log("Success CSV D2"));
            }
            d2Counter++;
          }
        );
      });
    });
});

const d3CsvWriter = createCsvWriter({
  path: "data/3dbd.csv",
  header: [
    { id: "ticker", title: "Ticker" },
    { id: "top1_pct", title: "Top 1 Pct" },
    { id: "top1_stats", title: "Top 1 Status" },
    { id: "top3_pct", title: "Top 3 Pct" },
    { id: "top3_stats", title: "Top 3 Status" },
    { id: "top5_pct", title: "Top 5 Pct" },
    { id: "top5_stats", title: "Top 5 Status" },
    { id: "topavg_pct", title: "Top Broker Average Pct" },
    { id: "topavg_stats", title: "Top Broker Average Status" },
    { id: "f_value", title: "Foreign Value" },
    { id: "f_stats", title: "Foreign Status" },
  ],
});

let d3Counter = 1;
let d3Data = [];
MongoClient.connect(url, { useUnifiedTopology: true }, (er, client) => {
  const db = client.db(dbName);
  const { fromDate, toDate } = formatBroksumDate(["", "3d"]);
  db.collection("3d_broker_summary")
    .find()
    .toArray((err, res) => {
      res.map((r) => {
        db.collection("chart_data").findOne(
          { ticker: r.ticker },
          (err, cRes) => {
            const { trx, foreign } = calculateCDData(
              cRes.data,
              fromDate,
              toDate
            );
            const liquid = checkLiquidity(trx);
            if (r.data && liquid) {
              if (r.data.bandar_detector !== null) {
                const bd = r.data.bandar_detector;
                d3Data.push({
                  ticker: r.ticker,
                  top1_pct: bd.top1.percent,
                  top1_stats: formatAccDistStatus(bd.top1.vol, bd.volume),
                  top3_pct: bd.top3.percent,
                  top3_stats: formatAccDistStatus(bd.top3.vol, bd.volume),
                  top5_pct: bd.top5.percent,
                  top5_stats: formatAccDistStatus(bd.top5.vol, bd.volume),
                  topavg_pct:
                    (bd.top1.percent + bd.top3.percent + bd.top5.percent) / 3,
                  topavg_stats: formatAccDistStatus(
                    (bd.top1.vol + bd.top3.vol + bd.top5.vol) / 3,
                    bd.volume
                  ),
                  f_value: foreign,
                  f_stats: (foreign / trx) * 100,
                });
              }
            }

            if (d3Counter == 793) {
              allCounter++;
              d3CsvWriter
                .writeRecords(d3Data)
                .then(() => console.log("Success CSV D3"));
            }
            d3Counter++;
          }
        );
      });
    });
});

const lwCsvWriter = createCsvWriter({
  path: "data/lastweekbd.csv",
  header: [
    { id: "ticker", title: "Ticker" },
    { id: "top1_pct", title: "Top 1 Pct" },
    { id: "top1_stats", title: "Top 1 Status" },
    { id: "top3_pct", title: "Top 3 Pct" },
    { id: "top3_stats", title: "Top 3 Status" },
    { id: "top5_pct", title: "Top 5 Pct" },
    { id: "top5_stats", title: "Top 5 Status" },
    { id: "topavg_pct", title: "Top Broker Average Pct" },
    { id: "topavg_stats", title: "Top Broker Average Status" },
    { id: "f_value", title: "Foreign Value" },
    { id: "f_stats", title: "Foreign Status" },
  ],
});

let lwCounter = 1;
let lwData = [];
MongoClient.connect(url, { useUnifiedTopology: true }, (er, client) => {
  const db = client.db(dbName);
  const { fromDate, toDate } = formatBroksumDate(["", "lw"]);
  db.collection("last_week_broker_summary")
    .find()
    .toArray((err, res) => {
      res.map((r) => {
        db.collection("chart_data").findOne(
          { ticker: r.ticker },
          (err, cRes) => {
            const { trx, foreign } = calculateCDData(
              cRes.data,
              fromDate,
              toDate
            );
            const liquid = checkLiquidity(trx);
            if (r.data && liquid) {
              if (r.data.bandar_detector !== null) {
                const bd = r.data.bandar_detector;
                lwData.push({
                  ticker: r.ticker,
                  top1_pct: bd.top1.percent,
                  top1_stats: formatAccDistStatus(bd.top1.vol, bd.volume),
                  top3_pct: bd.top3.percent,
                  top3_stats: formatAccDistStatus(bd.top3.vol, bd.volume),
                  top5_pct: bd.top5.percent,
                  top5_stats: formatAccDistStatus(bd.top5.vol, bd.volume),
                  topavg_pct:
                    (bd.top1.percent + bd.top3.percent + bd.top5.percent) / 3,
                  topavg_stats: formatAccDistStatus(
                    (bd.top1.vol + bd.top3.vol + bd.top5.vol) / 3,
                    bd.volume
                  ),
                  f_value: foreign,
                  f_stats: (foreign / trx) * 100,
                });
              }
            }

            if (lwCounter == 793) {
              allCounter++;
              lwCsvWriter
                .writeRecords(lwData)
                .then(() => console.log("Success CSV LW"));
            }
            lwCounter++;
          }
        );
      });
    });
});

const l2wCsvWriter = createCsvWriter({
  path: "data/last2weekbd.csv",
  header: [
    { id: "ticker", title: "Ticker" },
    { id: "top1_pct", title: "Top 1 Pct" },
    { id: "top1_stats", title: "Top 1 Status" },
    { id: "top3_pct", title: "Top 3 Pct" },
    { id: "top3_stats", title: "Top 3 Status" },
    { id: "top5_pct", title: "Top 5 Pct" },
    { id: "top5_stats", title: "Top 5 Status" },
    { id: "topavg_pct", title: "Top Broker Average Pct" },
    { id: "topavg_stats", title: "Top Broker Average Status" },
    { id: "f_value", title: "Foreign Value" },
    { id: "f_stats", title: "Foreign Status" },
  ],
});

let l2wCounter = 1;
let l2wData = [];
MongoClient.connect(url, { useUnifiedTopology: true }, (er, client) => {
  const db = client.db(dbName);
  const { fromDate, toDate } = formatBroksumDate(["", "l2w"]);
  db.collection("last_2week_broker_summary")
    .find()
    .toArray((err, res) => {
      res.map((r) => {
        db.collection("chart_data").findOne(
          { ticker: r.ticker },
          (err, cRes) => {
            const { trx, foreign } = calculateCDData(
              cRes.data,
              fromDate,
              toDate
            );
            const liquid = checkLiquidity(trx);
            if (r.data && liquid) {
              if (r.data.bandar_detector !== null) {
                const bd = r.data.bandar_detector;
                l2wData.push({
                  ticker: r.ticker,
                  top1_pct: bd.top1.percent,
                  top1_stats: formatAccDistStatus(bd.top1.vol, bd.volume),
                  top3_pct: bd.top3.percent,
                  top3_stats: formatAccDistStatus(bd.top3.vol, bd.volume),
                  top5_pct: bd.top5.percent,
                  top5_stats: formatAccDistStatus(bd.top5.vol, bd.volume),
                  topavg_pct:
                    (bd.top1.percent + bd.top3.percent + bd.top5.percent) / 3,
                  topavg_stats: formatAccDistStatus(
                    (bd.top1.vol + bd.top3.vol + bd.top5.vol) / 3,
                    bd.volume
                  ),
                  f_value: foreign,
                  f_stats: (foreign / trx) * 100,
                });
              }
            }

            if (l2wCounter == 793) {
              allCounter++;
              l2wCsvWriter
                .writeRecords(l2wData)
                .then(() => console.log("Success CSV L2W"));
            }
            l2wCounter++;
          }
        );
      });
    });
});

const lmCsvWriter = createCsvWriter({
  path: "data/lastmonthbd.csv",
  header: [
    { id: "ticker", title: "Ticker" },
    { id: "top1_pct", title: "Top 1 Pct" },
    { id: "top1_stats", title: "Top 1 Status" },
    { id: "top3_pct", title: "Top 3 Pct" },
    { id: "top3_stats", title: "Top 3 Status" },
    { id: "top5_pct", title: "Top 5 Pct" },
    { id: "top5_stats", title: "Top 5 Status" },
    { id: "topavg_pct", title: "Top Broker Average Pct" },
    { id: "topavg_stats", title: "Top Broker Average Status" },
    { id: "f_value", title: "Foreign Value" },
    { id: "f_stats", title: "Foreign Status" },
  ],
});

let lmCounter = 1;
let lmData = [];
MongoClient.connect(url, { useUnifiedTopology: true }, (er, client) => {
  const db = client.db(dbName);
  const { fromDate, toDate } = formatBroksumDate(["", "lm"]);
  db.collection("last_month_broker_summary")
    .find()
    .toArray((err, res) => {
      res.map((r) => {
        db.collection("chart_data").findOne(
          { ticker: r.ticker },
          (err, cRes) => {
            const { trx, foreign } = calculateCDData(
              cRes.data,
              fromDate,
              toDate
            );
            const liquid = checkLiquidity(trx);
            if (r.data && liquid) {
              if (r.data.bandar_detector !== null) {
                const bd = r.data.bandar_detector;
                lmData.push({
                  ticker: r.ticker,
                  top1_pct: bd.top1.percent,
                  top1_stats: formatAccDistStatus(bd.top1.vol, bd.volume),
                  top3_pct: bd.top3.percent,
                  top3_stats: formatAccDistStatus(bd.top3.vol, bd.volume),
                  top5_pct: bd.top5.percent,
                  top5_stats: formatAccDistStatus(bd.top5.vol, bd.volume),
                  topavg_pct:
                    (bd.top1.percent + bd.top3.percent + bd.top5.percent) / 3,
                  topavg_stats: formatAccDistStatus(
                    (bd.top1.vol + bd.top3.vol + bd.top5.vol) / 3,
                    bd.volume
                  ),
                  f_value: foreign,
                  f_stats: (foreign / trx) * 100,
                });
              }
            }

            if (lmCounter == 793) {
              // allCounter++;
              lmCsvWriter
                .writeRecords(lmData)
                .then(() => console.log("Success CSV LM"));
            }
            lmCounter++;
          }
        );
      });
    });
});

// if (allCounter >= 8) {
//   process.exit();
// }
