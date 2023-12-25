const MongoClient = require("mongodb").MongoClient;
const url =
  "mongodb://127.0.0.1:27017/?gssapiServiceName=mongodb&retryWrites=true";
const dbName = "kangritelbot";
const parse = require("csv-parse");
const fs = require("fs");
const moment = require("moment");

MongoClient.connect(url, (er, client) => {
  const db = client.db(dbName);
  fs.ReadStream("Balancepos20220630.csv")
    .pipe(parse({ delimiter: "|" }))
    .on("data", (row) => {
      if (row[2] == "EQUITY" || row[2] == "WARRANT") {
        doc = {
          local_is: row[5],
          local_cp: row[6],
          local_pf: row[7],
          local_ib: row[8],
          local_id: row[9],
          local_mf: row[10],
          local_sc: row[11],
          local_fd: row[12],
          local_ot: row[13],
          local_total: row[14],
          foreign_is: row[15],
          foreign_cp: row[16],
          foreign_pf: row[17],
          foreign_ib: row[18],
          foreign_id: row[19],
          foreign_mf: row[20],
          foreign_sc: row[21],
          foreign_fd: row[22],
          foreign_ot: row[23],
          foreign_total: row[24],
        };

        const query = {
          ticker: row[1],
        };
        const update = {
          $set: {
            "data.agt2022": doc,
          },
        };
        const options = { upsert: true };

        db.collection("ownership").updateOne(
          query,
          update,
          options,
          (err, res) => {}
        );
      }
    });
});
