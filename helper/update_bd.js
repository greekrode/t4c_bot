const { formatBroksumDate } = require("./formatter");
const mongoUtil = require("./mongo");
const { getBrokSumData, getChartData } = require("../stockbit");
const axios = require("axios").default;
const token = "1128442233:AAEIzvZ9d5FiKc6pssKB6K-ixuBgXpNYNrY";
const fs = require("fs");
const parse = require("csv-parse");

const updateDBBData = () => {
  mongoUtil.connectToServer((err, client) => {
    if (err) console.log(err);
    const db = mongoUtil.getDb();
    let tickerData = [];
    let itemsProcessed = 1;

    fs.ReadStream("ticker.csv")
      .pipe(parse({ headers: false }))
      .on("data", (row) => {
        if (row[0].length === 4) {
          tickerData.push(row[0]);
        }
      })
      .on("end", () => {
        tickerData.map((row) => {
          const ticker = row;
          var { fromDate, toDate } = formatBroksumDate([""]);
          const broksumD = getBrokSumData(ticker, fromDate, toDate);
          var { fromDate, toDate } = formatBroksumDate(["", "w"]);
          const broksumW = getBrokSumData(ticker, fromDate, toDate);
          var { fromDate, toDate } = formatBroksumDate(["", "ew"]);
          const broksumEW = getBrokSumData(ticker, fromDate, toDate);
          var { fromDate, toDate } = formatBroksumDate(["", "m"]);
          const broksumM = getBrokSumData(ticker, fromDate, toDate);
          var { fromDate, toDate } = formatBroksumDate(["", "em"]);
          const broksumEM = getBrokSumData(ticker, fromDate, toDate);
          const chart = getChartData(ticker);
          Promise.all([
            broksumD,
            broksumW,
            broksumEW,
            broksumM,
            broksumEM,
            chart,
          ]).then((res) => {
            const bsD = res[0];
            const bsW = res[1];
            const bsEW = res[2];
            const bsM = res[3];
            const bsEM = res[4];
            const cd = res[5];

            const query = { ticker };
            const options = { upsert: true };

            setTimeout(() => {
              let update = {
                $set: {
                  ticker,
                  data: bsD,
                },
              };
              db.collection("daily_broker_summary").updateOne(
                query,
                update,
                options
              );
            }, 250);

            setTimeout(() => {
              update = {
                $set: {
                  ticker,
                  data: bsW,
                },
              };
              db.collection("weekly_broker_summary").updateOne(
                query,
                update,
                options
              );
            }, 250);

            setTimeout(() => {
              update = {
                $set: {
                  ticker,
                  data: bsEW,
                },
              };
              db.collection("early_week_broker_summary").updateOne(
                query,
                update,
                options
              );
            }, 250);

            setTimeout(() => {
              update = {
                $set: {
                  ticker,
                  data: bsM,
                },
              };
              db.collection("monthly_broker_summary").updateOne(
                query,
                update,
                options
              );
            }, 250);

            setTimeout(() => {
              update = {
                $set: {
                  ticker,
                  data: bsEM,
                },
              };
              db.collection("early_month_broker_summary").updateOne(
                query,
                update,
                options
              );
            }, 250);

            setTimeout(() => {
              update = {
                $set: {
                  ticker,
                  data: cd,
                },
              };
              db.collection("chart_data").updateOne(query, update, options);
            }, 250);

            console.log(itemsProcessed);
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
            itemsProcessed++;
          });
        });
      });
  });
};

module.exports = {
  updateDBBData,
};
