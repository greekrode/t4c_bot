const mongoUtil = require("./helper/mongo");
const fs = require("fs");
const parse = require("csv-parse");

mongoUtil.connectToServer((err, client) => {
  const db = mongoUtil.getDb();
  let tickerData = [];

  db.collection("ticker").drop(function (err, delOK) {
    if (err) throw err;
    if (delOK) {
      fs.ReadStream("ticker.csv")
        .pipe(parse({ headers: false }))
        .on("data", (row) => {
          if (row[0].length === 4) {
            tickerData.push(row[0]);
          }
        })
        .on("end", () => {
          tickerData.map((row) => {
            const doc = {
              ticker: row,
            };

            db.collection("ticker").insertOne(doc, (err, res) => {
              if (err) {
                console.log(err);
              }
            });
          });
        });
    }
  });
});
