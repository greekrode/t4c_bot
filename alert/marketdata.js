// const axios = require("axios");
// const moment = require("moment");
// const {
//   redisMDKey,
//   checkRedisCache,
//   saveToRedisCacheMD,
// } = require("../helper/redis");
// const { marketdata } = require("../marketdata/index");

// const token = "1128442233:AAEIzvZ9d5FiKc6pssKB6K-ixuBgXpNYNrY";

// if (
//   moment().day() === 6 ||
//   moment().day() === 0 ||
//   moment().isBetween(
//     moment("09:00:00", "HH:mm:ss"),
//     moment("23:59:59", "HH:mm:ss")
//   ) ||
//   moment().isBetween(
//     moment("00:00:00", "HH:mm:ss"),
//     moment("06:59:59", "HH:mm:ss")
//   )
// ) {
//   process.exit();
// }

// const chatId = [
//   229886930,
//   "-1001214043290",
//   "-1001180515812",
//   "-1001443386283",
//   "-1001287411917",
//   "-1001229494468",
//   "-1001410209109",
//   "-1001205124614",
//   "-1001574613054",
// ];

// let itemProcessed = 0;

// checkRedisCache(redisMDKey(moment().format("YYYYMMDD"))).then((cache) => {
//   if (cache) {
//     chatId.map((id) => {
//       axios({
//         method: "POST",
//         url: `https://api.telegram.org/bot${token}/sendMessage`,
//         data: {
//           chat_id: id,
//           text: cache,
//           parse_mode: "HTML",
//         },
//       }).then(() => {
//         itemProcessed++;

//         if (itemProcessed === chatId.length) {
//           process.exit();
//         }
//       });
//     });
//   }

//   const today = moment().format("MMM Do, YYYY (dddd)");

//   marketdata.then((res) => {
//     const title = `<b>${today}</b>\n\nDear investor, below are worldwide market data\n\n`;
//     const footer = `<b>By Trade4Cuan (https://t.me/tradeforcuan)</b>\n<i>Source: Investing, Bloomberg, Tradingview, SunSirs, WorldGovernmentBonds</i>`;
//     let textMessage = "";

//     for (i = 0; i < res.length; i++) {
//       textMessage = textMessage + res[i];
//     }

//     const message = title + textMessage + footer;
//     saveToRedisCacheMD(redisMDKey(moment().format("YYYYMMDD")), message);
//     chatId.map((id) => {
//       axios({
//         method: "POST",
//         url: `https://api.telegram.org/bot${token}/sendMessage`,
//         data: {
//           chat_id: id,
//           text: message,
//           parse_mode: "HTML",
//         },
//       }).then(() => {
//         itemProcessed++;

//         if (itemProcessed === chatId.length) {
//           process.exit();
//         }
//       });
//     });
//   });
// });
