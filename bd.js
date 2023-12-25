const { formatBroksumDate } = require("./helper/formatter");
const mongoUtil = require("./helper/mongo");
const { getBrokSumData, getChartData } = require("./stockbit/index");
const axios = require("axios").default;
const token = "1128442233:AAEIzvZ9d5FiKc6pssKB6K-ixuBgXpNYNrY";
const fs = require("fs");
const parse = require("csv-parse");
const throttledQueue = require("throttled-queue");

var throttle = throttledQueue(1, 500);

const periods = ["", "w", "ew", "m", "em", "3d", "2d", "lw", "l2w", "lm"];
const collections = [
  "daily_broker_summary",
  "weekly_broker_summary",
  "early_week_broker_summary",
  "monthly_broker_summary",
  "early_month_broker_summary",
  "2d_broker_summary",
  "3d_broker_summary",
  "last_week_broker_summary",
  "last_2week_broker_summary",
  "last_month_broker_summary",
];

mongoUtil.connectToServer((err, client) => {
  const db = mongoUtil.getDb();
  let tickerData = [];
  let itemsProcessed = 0;

  fs.ReadStream("ticker.csv")
    .pipe(parse({ headers: false }))
    .on("data", (row) => {
      if (row[0].length === 4) {
        tickerData.push(row[0]);
      }
    })
    .on("end", () => {
      tickerData.map((row) => {
        throttle(() => {
          const ticker = row;
          const promises = periods.map((period, index) => {
            const { fromDate, toDate } = formatBroksumDate(["", period]);
            return getBrokSumData(ticker, fromDate, toDate);
          });
          
          Promise.all(promises)
            .then((res) => {
              const query = { ticker };
              const options = { upsert: true };
          
              res.forEach((data, index) => {
                const update = {
                  $set: {
                    ticker,
                    data,
                  },
                };
                db.collection(collections[index]).updateOne(query, update, options);
              });
          
              return getChartData(ticker);
            })
            .then((chartData) => {
              const query = { ticker };
              const options = { upsert: true };
              const update = {
                $set: {
                  ticker,
                  data: chartData,
                },
              };
              db.collection("chart_data").updateOne(query, update, options);
              console.log(`Processed: ${ticker}`);
            })
            .catch((err) => {
              console.log(`Failed to process: ${ticker}`);
            })
            .finally(() => {
              itemsProcessed++;
              if (itemsProcessed == tickerData.length) {
                axios({
                  method: "POST",
                  url: `https://api.telegram.org/bot${token}/sendMessage`,
                  data: {
                    chat_id: "229886930",
                    text: "Cron has been run successfully",
                  },
                }).then(() => {
                  process.exit();
                });
              }
            });
        });
      });
    });
});