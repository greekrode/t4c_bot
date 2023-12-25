const {
  exportPath,
  scriptPath,
  interval,
  convertVal,
  formatAccDistStatus,
  formatBdAccTitle,
} = require("./formatter");
const {
  getBrokSumData,
  getCompanyData,
  getCompanyProfileData,
} = require("../stockbit/index");
const { getFinancialData } = require("../ajaib/index");
const chokidar = require("chokidar");

const moment = require("moment");
const numeral = require("numeral");
const fs = require("fs");

const Holidays = require("date-holidays");
const hd = new Holidays();
const mongoUtil = require("../helper/mongo");
const { getBrokSumdataFromDB } = require("../helper/mongo");

async function watchFileExist(imgUrl, event) {
  return new Promise((resolve, reject) => {
    const watcher = chokidar.watch(imgUrl, {
      persistent: true,
      usePolling: true,
      alwaysStat: false,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 50,
      },
    });

    watcher
      .on("add", (imgUrl) => {
        resolve({ exist: true });
      })
      .on("change", (imgUrl) => {
        resolve({ exist: true });
      });
  });
}

const processor = (input) => {
  const tf = input.tf.toLowerCase();
  const tfPath =
    tf.localeCompare("d", undefined, { sensitivity: "base" }) === 0
      ? ""
      : `_${tf}`;

  return {
    imgUrl: `${exportPath(input.sym)}_${input.command}${tfPath}.PNG`,
    interval: interval(tf),
    script: scriptPath(input.command, tfPath, input.sym),
  };
};

const generateBDMessage = (
  d,
  w,
  m,
  fromDateFormatted,
  fromDateWFormatted,
  fromDateMFormatted
) => {
  let textMessage = "";
  const responseBD = d.bandar_detector;
  const responseBSBuy = d.broker_summary.brokers_buy;
  const responseBSSell = d.broker_summary.brokers_sell;
  // const responseBDW = w.bandar_detector;
  // const responseBSBuyW = w.broker_summary.brokers_buy;
  // const responseBSSellW = w.broker_summary.brokers_sell;
  // const responseBDM = m.bandar_detector;
  // const responseBSBuyM = m.broker_summary.brokers_buy;
  // const responseBSSellM = m.broker_summary.brokers_sell;

  textMessage =
    textMessage +
    "\n\n<b>------ Info ------</b>" +
    "\nBuyer: " +
    responseBD.total_buyer +
    "\nSeller: " +
    responseBD.total_seller +
    "\nNet Volume: " +
    numeral(responseBD.volume).format(0, 0) +
    "\nNet Value: " +
    convertVal(responseBD.value) +
    "\nAverage: " +
    numeral(responseBD.average).format(0, 0) +
    // "\n\n<b>------ Weekly Info ( since " +
    // fromDateWFormatted.format("D MMM YYYY") +
    // " ) ------</b>" +
    // "\nTOP 1: " +
    // formatAccDistStatus(responseBDW.top1.vol, responseBDW.volume) +
    // "\nTOP 3: " +
    // formatAccDistStatus(responseBDW.top3.vol, responseBDW.volume) +
    // "\nTOP 5: " +
    // formatAccDistStatus(responseBDW.top5.vol, responseBDW.volume) +
    // "\n<b>===== TOP 3 NET BUYER ===== </b>" +
    // `\n1. ${responseBSBuyW[0].netbs_broker_code} (${numeral(
    //   responseBSBuyW[0].blot
    // ).format(0, 0)} lot - Avg: ${numeral(
    //   Math.round(responseBSBuyW[0].netbs_buy_avg_price)
    // ).format(0, 0)})` +
    // `\n2. ${responseBSBuyW[1].netbs_broker_code} (${numeral(
    //   responseBSBuyW[1].blot
    // ).format(0, 0)} lot - Avg: ${numeral(
    //   Math.round(responseBSBuyW[1].netbs_buy_avg_price)
    // ).format(0, 0)})` +
    // `\n3. ${responseBSBuyW[2].netbs_broker_code} (${numeral(
    //   responseBSBuyW[2].blot
    // ).format(0, 0)} lot - Avg: ${numeral(
    //   Math.round(responseBSBuyW[2].netbs_buy_avg_price)
    // ).format(0, 0)})` +
    // "\n<b>===== TOP 3 NET SELLER ===== </b>" +
    // `\n1. ${responseBSSellW[0].netbs_broker_code} (${numeral(
    //   responseBSSellW[0].slot
    // ).format(0, 0)} lot - Avg: ${numeral(
    //   Math.round(responseBSSellW[0].netbs_sell_avg_price)
    // ).format(0, 0)})` +
    // `\n2. ${responseBSSellW[1].netbs_broker_code} (${numeral(
    //   responseBSSellW[1].slot
    // ).format(0, 0)} lot - Avg: ${numeral(
    //   Math.round(responseBSSellW[1].netbs_sell_avg_price)
    // ).format(0, 0)})` +
    // `\n3. ${responseBSSellW[2].netbs_broker_code} (${numeral(
    //   responseBSSellW[2].slot
    // ).format(0, 0)} lot - Avg: ${numeral(
    //   Math.round(responseBSSellW[2].netbs_sell_avg_price)
    // ).format(0, 0)})` +
    // "\n\n<b>------ Monthly Info ( since " +
    // fromDateMFormatted.format("D MMM YYYY") +
    // " ) ------</b>" +
    // "\nTOP 1: " +
    // formatAccDistStatus(responseBDM.top1.vol, responseBDM.volume) +
    // "\nTOP 3: " +
    // formatAccDistStatus(responseBDM.top3.vol, responseBDM.volume) +
    // "\nTOP 5: " +
    // formatAccDistStatus(responseBDM.top5.vol, responseBDM.volume) +
    // "\n<b>===== TOP 3 NET BUYER ===== </b>" +
    // `\n1. ${responseBSBuyM[0].netbs_broker_code} (${numeral(
    //   responseBSBuyM[0].blot
    // ).format(0, 0)} lot - Avg: ${numeral(
    //   Math.round(responseBSBuyM[0].netbs_buy_avg_price)
    // ).format(0, 0)})` +
    // `\n2. ${responseBSBuyM[1].netbs_broker_code} (${numeral(
    //   responseBSBuyM[1].blot
    // ).format(0, 0)} lot - Avg: ${numeral(
    //   Math.round(responseBSBuyM[1].netbs_buy_avg_price)
    // ).format(0, 0)})` +
    // `\n3. ${responseBSBuyM[2].netbs_broker_code} (${numeral(
    //   responseBSBuyM[2].blot
    // ).format(0, 0)} lot - Avg: ${numeral(
    //   Math.round(responseBSBuyM[2].netbs_buy_avg_price)
    // ).format(0, 0)})` +
    // "\n<b>===== TOP 3 NET SELLER ===== </b>" +
    // `\n1. ${responseBSSellM[0].netbs_broker_code} (${numeral(
    //   responseBSSellM[0].slot
    // ).format(0, 0)} lot - Avg: ${numeral(
    //   Math.round(responseBSSellM[0].netbs_sell_avg_price)
    // ).format(0, 0)})` +
    // `\n2. ${responseBSSellM[1].netbs_broker_code} (${numeral(
    //   responseBSSellM[1].slot
    // ).format(0, 0)} lot - Avg: ${numeral(
    //   Math.round(responseBSSellM[1].netbs_sell_avg_price)
    // ).format(0, 0)})` +
    // `\n3. ${responseBSSellM[2].netbs_broker_code} (${numeral(
    //   responseBSSellM[2].slot
    // ).format(0, 0)} lot - Avg: ${numeral(
    //   Math.round(responseBSSellM[2].netbs_sell_avg_price)
    // ).format(0, 0)})` +
    "\n\n<b>------ TOP 1 ------</b>" +
    "\nVolume: " +
    numeral(responseBD.top1.vol).format(0, 0) +
    "\nAmount: " +
    convertVal(responseBD.top1.amount) +
    "\nStatus: " +
    formatAccDistStatus(responseBD.top1.vol, responseBD.volume) +
    "\n<b>------ TOP 3 ------</b>" +
    "\nVolume: " +
    numeral(responseBD.top3.vol).format(0, 0) +
    "\nAmount: " +
    convertVal(responseBD.top3.amount) +
    "\nStatus: " +
    formatAccDistStatus(responseBD.top3.vol, responseBD.volume) +
    "\n<b>------ TOP 5 ------</b>" +
    "\nVolume: " +
    numeral(responseBD.top5.vol).format(0, 0) +
    "\nAmount: " +
    convertVal(responseBD.top5.amount) +
    "\nStatus: " +
    formatAccDistStatus(responseBD.top5.vol, responseBD.volume);

  let sizeB = responseBSBuy.length <= 10 ? responseBSBuy.length : 10;
  let sizeS = responseBSSell.length <= 10 ? responseBSSell.length : 10;

  textMessage = textMessage + "\n\n<b>------------ NET BUY ------------</b>\n";
  for (i = 0; i < sizeB; i++) {
    const bodyB = responseBSBuy[i];

    textMessage =
      textMessage +
      (i + 1) +
      ". " +
      bodyB.netbs_broker_code +
      " - Lot: " +
      numeral(bodyB.blot).format(0, 0) +
      " - Val: " +
      convertVal(bodyB.bval) +
      " - Avg: " +
      numeral(Math.round(bodyB.netbs_buy_avg_price)).format(0, 0) +
      "\n";
  }

  textMessage = textMessage + "\n<b>------------ NET SELL ------------</b>\n";
  for (i = 0; i < sizeS; i++) {
    const bodyS = responseBSSell[i];

    textMessage =
      textMessage +
      (i + 1) +
      ". " +
      bodyS.netbs_broker_code +
      " - Lot: " +
      numeral(bodyS.slot).format(0, 0) +
      " - Val: " +
      convertVal(bodyS.sval) +
      " - Avg: " +
      numeral(Math.round(bodyS.netbs_sell_avg_price)).format(0, 0) +
      "\n";
  }

  return textMessage;
};

const getBD = (ticker, fromDate, toDate, fallback = false) => {
  return new Promise((resolve, reject) => {
    const fromDateFormatted = moment(fromDate, "YYYY-MM-DD");
    const toDateFormatted = moment(toDate, "YYYY-MM-DD");

    let fromDateWFormatted = fromDateFormatted.clone().startOf("week");
    let fromDateW = fromDateWFormatted.format("YYYY-MM-DD");

    if (fromDateFormatted.diff(fromDateWFormatted, "days") <= 1) {
      fromDateWFormatted = fromDateWFormatted.subtract(1, "week");

      fromDateW = fromDateWFormatted.format("YYYY-MM-DD");
    }

    let fromDateMFormatted = fromDateFormatted.clone().startOf("month");
    let fromDateM = fromDateMFormatted.format("YYYY-MM-DD");

    if (fromDateFormatted.diff(fromDateMFormatted) == 0) {
      fromDateMFormatted = fromDateMFormatted.subtract(1, "month");

      fromDateM = fromDateMFormatted.format("YYYY-MM-DD");
    }

    textMessage =
      "<b>Broker Summary</b>\n<b>Ticker: " +
      ticker +
      "</b>" +
      "\n<i>Period: </i>" +
      fromDateFormatted.format("D MMM YYYY") +
      " to " +
      toDateFormatted.format("D MMM YYYY");

    if (fallback) {
      const broksum = getBrokSumdataFromDB(ticker);
      broksum.then((res) => {
        const d = res.resD;
        const w = res.resEW;
        const m = res.resEM;

        textMessage =
          textMessage +
          generateBDMessage(
            d,
            w,
            m,
            fromDateFormatted,
            fromDateWFormatted,
            fromDateMFormatted
          );
        textMessage =
          textMessage +
          "\n\n<i>Karena ada masalah dengan datafeed, data yang tersedia hanya data hari ini.</i>";
        resolve(textMessage);
      });
    } else {
      try {
        const dailyBD = getBrokSumData(ticker, fromDate, toDate, fallback);
        const weeklyBD = getBrokSumData(ticker, fromDateW, toDate, fallback);
        const monthlyBD = getBrokSumData(ticker, fromDateM, toDate, fallback);

        dailyBD.then((d) => {
          Promise.all([weeklyBD, monthlyBD]).then((res) => {
            const w = res[0];
            const m = res[1];

            if (d.bandar_detector !== null || d.bandar_detector) {
              textMessage =
                textMessage +
                generateBDMessage(
                  d,
                  w,
                  m,
                  fromDateFormatted,
                  fromDateWFormatted,
                  fromDateMFormatted
                );
              resolve(textMessage);
            } else {
              textMessage = textMessage + "\n\nNo data available";
              resolve(textMessage);
            }
          });
        });
      } catch (err) {
        reject(err);
      }
    }
  });
};

const bdAccFilter = (data, accLevel, type, ticker) => {
  try {
    if (
      (data || data != null) &&
      Object.keys(data.bandar_detector).length !== 0
    ) {
      const responseBD = data.bandar_detector;
      if (
        accLevel.toUpperCase() == "TOP" &&
        responseBD.top1.accdist == type + " Acc" &&
        responseBD.top3.accdist == type + " Acc" &&
        responseBD.top5.accdist == type + " Acc"
      ) {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error(ticker);
  }
};

const generateBdAccMessage = (accLevel, type, finalData) => {
  let textMessage = "";
  const title = formatBdAccTitle(accLevel, type);
  const dataMessage = finalData.sort().map((fd) => {
    return "\n" + fd;
  });

  const footer =
    "\n\n<i>Untuk analisa broker summary, ketik<code> /bd XXXX</code></i>";
  return title + dataMessage.join("") + footer;
};

const fsReadFileHtml = (fileName) => {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, "utf8", (error, htmlString) => {
      if (!error && htmlString) {
        resolve(htmlString);
      } else {
        reject(error);
      }
    });
  });
};

module.exports = {
  processor,
  getBD,
  watchFileExist,
  bdAccFilter,
  generateBdAccMessage,
  fsReadFileHtml,
};
