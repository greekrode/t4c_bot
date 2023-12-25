require("dotenv").config();
const { Telegraf, Extra, Markup, Context } = require("telegraf");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const exec = require("child_process").exec;
const fs = require("fs");
const token = process.env.BOT_TOKEN;
const bot = new Telegraf(token);
const moment = require("moment");
moment.locale("id");
var ObjectID = require("mongodb").ObjectID;
const numeral = require("numeral");
const axios = require("axios").default;
const parse = require("csv-parse");
const Promise = require("bluebird");
const _ = require("lodash");
const Path = require("path");
const jimp = require("jimp");
const cron = require("node-cron");
const doc = new GoogleSpreadsheet(
  "14HmqbaKZsKf54LYrtppHthLo5k-RLWbCYV8bbzQLkQU"
);
const uuid = require('uuid');

// doc.useServiceAccountAuth({
//   client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
//   private_key: process.env.GOOGLE_PRIVATE_KEY,
// });

const {
  dividendData,
  stockSplitData,
  rightIssueData,
  ipoData,
  rupsData,
} = require("./stockbit/index");

const {
  redisBDKey,
  redisBDSKey,
  redisOWKey,
  redisInfoKey,
  redisChartKey,
  saveToRedisCache,
  checkRedisCache,
  setMaintenance,
  unsetMaintenance,
  setFallback,
  unsetFallback,
  flushRedis,
  redisOWSKey,
  publish,
  subscribe,
  onMessage,
  setRedisWithTTL,
  deleteRedis,
} = require("./helper/redis");

const {
  convertVal,
  convertToThousand,
  calculateOwnership,
  formatMessageInput,
  formatTimeframeInput,
  formatBroksumDate,
  checkDividendStatus,
  checkRightIssueStatus,
  checkWarrantStatus,
  formatDateWithShortMonth,
  checkStockSplitStatus,
  formatTF,
} = require("./helper/formatter");

const { htmlTable } = require("./helper/createTable");

const {
  checkTimeFrame,
  checkSpecificTimeFrame,
  getChatMember,
  checkValidSBDType,
  checkBDTimeFrame,
  isOwner,
  checkPeriode,
  checkValidCabe,
} = require("./helper/validator");

const { processor, getBD, fsReadFileHtml } = require("./helper/function");

const { authenticator } = require("./helper/authenticator");

const { getInsiderData, getBrokSumData } = require("./stockbit/index");

const { updateDBBData } = require("./helper/update_bd");

const {
  sendPhoto,
  sendHTMLMessage,
  sendHelp,
  sendStats,
  sendCp,
  sendScreener,
} = require("./helper/sender");

const {
  getLiquidBrokSumDataFromDB,
  getBrokSumDataFromDBByTF,
  getBrokerCode,
} = require("./helper/mongo");

const mongoUtil = require("./helper/mongo");

const scriptPathCommand =
  "start /b wscript C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\";

const exportPath = (sym) => {
  return "C:\\Users\\Administrator\\Documents\\AmiExport//" + sym;
};

const clearOldMessages = (bot) => {
  // Get updates for the bot
  const updates = bot.telegram.getUpdates(0, 100, -1);

  //  Add 1 to the ID of the last one, if there is one
  return updates.length > 0 ? updates[updates.length - 1].update_id + 1 : 0;
};

bot.use(authenticator());
bot.catch((err, ctx) => {
  console.log(`Ooops, encountered an error for ${ctx.updateType}`, err);
});
bot.polling.offset = clearOldMessages(bot);

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

const ajaibStock = axios.create({
  baseURL: "https://app.ajaib.co.id/api/v1/stock/detail/",
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0",
    "Accept-Language": "id",
    Referer: "https://invest.ajaib.co.id/",
    Authorization: process.env.AJAIB_TOKEN,
    Origin: "https://invest.ajaib.co.id/",
  },
});

const now = new Date();
const nowM = moment();

const mdb = require("mongodb");
const MongoClient = mdb.MongoClient;
const MongoError = mdb.MongoError;
const url =
  "mongodb://127.0.0.1:27017/?gssapiServiceName=mongodb&retryWrites=true";
const dbName = "kangritelbot";

const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const { ConsoleMessage } = require("puppeteer");

const width = 1920; //px
const height = 1080; //px
const chartCallback = (ChartJS) => {
  // Global config example: https://www.chartjs.org/docs/latest/configuration/
  ChartJS.defaults.global.elements.rectangle.borderWidth = 2;
  ChartJS.defaults.global.defaultFontColor = "#fff";
  ChartJS.defaults.global.defaultFontSize = 27;
  ChartJS.defaults.global.title.fontSize = 40;
  // Global plugin example: https://www.chartjs.org/docs/latest/developers/plugins.html
  ChartJS.plugins.register({
    id: "custom_canvas_background_color",
    beforeDraw: (chart) => {
      const ctx = chart.canvas.getContext("2d");
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    },
  });

  ChartJS.helpers.merge(ChartJS.defaults.global.plugins.datalabels, {
    color: "#FFF",
    font: {
      size: 28,
    },
  });
};
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width,
  height,
  chartCallback,
  plugins: {
    requireLegacy: ["chartjs-plugin-datalabels"],
  },
});

const getCompanyProfile = async (ticker) => {
  try {
    const resC = await stockbit.get("company/" + ticker);
    const resP = await stockbit.get("company/profile/" + ticker);
    if (resC.data.data != undefined && resP.data.data != undefined) {
      return Object.assign({}, resC.data.data, resP.data.data);
    }
    return undefined;
  } catch (err) {
    console.error(err);
  }
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

const getFinancialData = async (ticker) => {
  try {
    const res = await ajaibStock.get(ticker + "/ranked/key_statistics/");
    return res.data;
  } catch (err) {
    console.error(err);
  }
};

const getCalendarData = async () => {
  try {
    const res = await stockbit.get("calendar?symbol=");

    if (res.data.data != undefined) {
      return res.data.data;
    }
  } catch (err) {
    console.error(err);
  }
};

const checkTicker = (ticker) => {
  return new Promise((resolve, reject) => {
    MongoClient.connect(url, (err, client) => {
      const db = client.db(dbName);
      const query = { ticker: ticker.toUpperCase() };
      db.collection("ticker")
        .find(query)
        .toArray((err, res) => {
          if (res.length > 0) {
            resolve({ existed: true });
          }
        });
    });
  });
};

function checkFileExist(imgUrl) {
  // if (eod || weekend) {
  //     const exist = fs.existsSync(imgUrl);
  //     return exist;
  // }
  return false;
}

bot.command("start", (ctx) => {
  var type = ctx.message.chat.type;

  const inlineMessageRatingKeyboard = Markup.inlineKeyboard([
    [Markup.callbackButton("🎉 Welcome 🎉", "welcome")],
    [Markup.callbackButton("💡 Trial", "trial")],
    [
      Markup.urlButton("📚 T4C Discussion Group", "http://t.me/tradeforcuan"),
      Markup.urlButton("👨‍👨‍👧‍👦 Bot Group", "https://t.me/t4cbot_group"),
      // Markup.callbackButton("⌨️ Commands", "help"),
    ],
    [
      Markup.callbackButton("🙎‍ Profile", "profile"),
      Markup.callbackButton("💰 Donate", "donate"),
    ],
    [Markup.callbackButton("Buka Akun Sekuritas", "bukaakun")],
  ]).extra();

  if (type == "private") {
    ctx.telegram.sendMessage(
      ctx.chat.id,
      "Welcome to T4C (Trade4Cuan) Bot!\n\nBot untuk membantu anda dalam FA, TA & Bandarmology saham IHSG\n\nTrial berlaku untuk 7 hari dengan ketik /trial\n\nOwner: @kangritel",
      inlineMessageRatingKeyboard
    );
  }
});

// bot.command("guide", (ctx) => {
//   authenticator(ctx).then((authResult) => {
//     if (!authResult.valid) {
//       return;
//     }
//     let guideUrl = "http://bit.ly/t4cbot_guide";

//     return ctx.reply(guideUrl).catch((err) => {
//       console.error(err);
//     });
//   });
// });

// bot.command("guide@t4c_bot", (ctx) => {
//   authenticator(ctx).then((authResult) => {
//     if (!authResult.valid) {
//       return;
//     }
//     let guideUrl = "http://bit.ly/t4cbot_guide";

//     return ctx.reply(guideUrl).catch((err) => {
//       console.error(err);
//     });
//   });
// });

bot.command("donate", (ctx) => {
  const imgUrl = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\bot_donate.png";
  ctx.telegram.sendChatAction(ctx.message.chat.id, "upload_photo");
  return ctx.telegram.sendPhoto(
    ctx.message.chat.id,
    { source: fs.ReadStream(imgUrl) },
    {
      caption:
        "Donasi Bot\n\nT4C x IF : https://t.me/tradeforcuan_channel/2053",
    }
  );
});

bot.command("donate@t4c_bot", (ctx) => {
  const imgUrl = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\bot_donate.png";
  ctx.telegram.sendChatAction(ctx.message.chat.id, "upload_photo");
  return ctx.telegram.sendPhoto(
    ctx.message.chat.id,
    { source: fs.ReadStream(imgUrl) },
    {
      caption:
        "Donasi Bot\n\nT4C x IF : https://t.me/tradeforcuan_channel/2053",
    }
  );
});

bot.command("scrhelp", (ctx) => {
  let textMessage =
    "<b>Bot Screening Help</b>\n" + "Command : <i>/scr [type]</i>";
  textMessage =
    textMessage +
    "\n\n" +
    "<b>Screening Type</b>" +
    "\n" +
    "ss - Slow Stochastic (Daily, Weekly, Monthly)\n" +
    "macd - Swing with MACD\n" +
    "mat - EMA8/MA21 Trading Signal\n" +
    "pvu - Price Up and Volume Up (Vol Break MA20)\n" +
    "pvd - Price Down and Volume Down (Vol Down by at least 25% and below MA20)\n" +
    "brr - Bullish Reversal RSI\n" +
    "adf - Accum/Distribution Foreign\n" +
    "jjs - Jajan Sore\n" +
    "rma - Rebound MA (EMA8, MA20, MA50, MA200)\n" +
    "vs1 - Vol Spike & Price Up";

  textMessage =
    textMessage +
    "\n" +
    "Contoh penggunaan: /scr ss\n\n" +
    "<i>*SS, MACD, MAT, GATORMFI, PVU, PVD, RMA dan JJS di update setiap 15 menit\n" +
    "BRR, ADF dan MAT di update setiap 1 jam dan deket closing sesi 1 dan sesi 2</i>";

  textMessage =
    textMessage +
    "\n\n" +
    "<i>**Hasil screening dikirimkan dalam bentuk file HTML</i>";

  return sendHTMLMessage(ctx, textMessage);
});

bot.command("scrhelp@t4c_bot", (ctx) => {
  let textMessage =
    "<b>Bot Screening Help</b>\n" + "Command : <i>/scr [type]</i>";
  textMessage =
    textMessage +
    "\n\n" +
    "<b>Screening Type</b>" +
    "\n" +
    "ss - Slow Stochastic (Daily, Weekly, Monthly)\n" +
    "macd - Swing with MACD\n" +
    "gcma - Golden Cross EMA8/MA20\n" +
    "signal - Trading Signal (Buy / Sell / Spec Buy / Hold)\n" +
    "gator - Alligator\n" +
    "mat - EMA8/MA20 Trading Signal\n" +
    "pvu - Price Up and Volume Up (Vol Break MA20)\n" +
    "pvd - Price Up and Volume Down (Vol Down by at least 25% and below MA20)\n" +
    "bma - Bullish MA Formation (MA5 > MA20, MA20>MA50, MA50>MA100, MA100>MA200)\n" +
    "brr - Bullish Reversal RSI\n" +
    "adf - Accum/Distribution Foreign\n" +
    "jjs - Jajan Sore";

  textMessage =
    textMessage +
    "\n" +
    "Contoh penggunaan: /scr ss\n\n" +
    "<i>*SS, MACD, GCMA, GATORMFI, PVU, PVD dan JJS di update setiap 15 menit\n" +
    "*Signal,, BMA, BRR, ADF dan MAT di update setiap 1 jam dan deket closing sesi 1 dan sesi 2</i>";

  textMessage =
    textMessage +
    "\n\n" +
    "<i>**Hasil screening dikirimkan dalam bentuk file HTML</i>";

  return sendHTMLMessage(ctx, textMessage);
});

bot.action("bukaakun", (ctx) => {
  const data = ctx.update.callback_query;
  ctx.telegram.sendChatAction(data.message.chat.id, "typing");

  const inlineMessageRatingKeyboard = Markup.inlineKeyboard([
    [
      Markup.urlButton(
        "Android",
        "https://play.google.com/store/apps/details?id=com.star.smartphone.main"
      ),
      Markup.urlButton(
        "iOS",
        "https://apps.apple.com/id/app/star-for-mobile/id411438189"
      ),
    ],
    [
      Markup.urlButton(
        "Cara Registrasi",
        "https://www.youtube.com/watch?v=921h_7PD6QM&ab_channel=SamuelSekuritas"
      ),
    ],
  ]).extra();

  if (data.message.chat.type == "private") {
    const message = `T4C x Samuel Sekuritas (IF)
    
Lakukan registrasi melalui aplikasi STAR pada smartphone anda melalui link dibawah
Pada kolom "Kode Referral", masukkan kode "RODE" 
 Mohon untuk masukkan kode referral supaya terdaftar sebagai nasabah saya
      
Untuk minimal deposit sebesar 10juta rupiah dengan minimal transaksi tiap bulannya (akumulasi buy & sell) adalah 250juta rupiah akan bergabung di T4C Cilok Elite
      
Jika tidak bisa melakukan minimal deposit dan tidak mencapai minimal transaksi, maka bisa menggunakan opsi 50:50 dimana setengah biaya T4C Cilok Elite akan dibayar terpisah
      
Untuk akses bot, semua nasabah yang mendaftar dengan kode referral "RODE" akan mendapatkan akses gratis
      
Jika sudah selesai daftar, PM @kangritel supaya bisa dicatet dan silahkan ditunggu email pemberitahuan untuk RDN, User ID dan Password
Untuk registrasi akan selesai paling lama 2x24 jam, jika lewat daripada itu, silahkan contact saya
      
Terima kasih!`;
    ctx.telegram.sendMessage(
      data.message.chat.id,
      message,
      inlineMessageRatingKeyboard
    );
  }
});

bot.action("help", (ctx) => {
  const data = ctx.update.callback_query;
  return sendHelp(data);
});

bot.command("help", (ctx) => {
  return sendHelp(ctx);
});

bot.command("help@t4c_bot", (ctx) => {
  return sendHelp(ctx);
});

bot.command("regme", (ctx) => {
  var type = ctx.message.chat.type;
  if (type == "private") {
    ctx.replyWithMarkdown(
      "Copy this id and send to @akangritel \n" +
      "`" +
      ctx.message.from.id +
      "`"
    );
  }
});

bot.command("register", (ctx) => {
  var message = ctx.message.text
    .substr(ctx.message.entities[0].length + 1, ctx.message.text.length)
    .split(" ");
  const userId = message[0];
  const time = message[1];
  var senderId = ctx.message.from.id;
  const today = moment();
  const subsTime = today.add(time, "M").toString();
  getChatMember(ctx).then((res) => {
    if (isOwner(res)) {
      MongoClient.connect(url, (er, client) => {
        const db = client.db(dbName);
        const query = { user_id: parseInt(userId) };
        const doc = {
          user_id: parseInt(userId),
          paid: true,
          trial: false,
          trial_end_at: null,
          subscription_end_at: subsTime,
        };
        db.collection("allowed_private_users")
          .find(query)
          .toArray((err, res) => {
            if (res.length > 0) {
              db.collection("allowed_private_users")
                .updateOne(
                  { _id: ObjectID(res[0]._id) },
                  {
                    $set: {
                      user_id: parseInt(userId),
                      paid: true,
                      trial: false,
                      trial_end_at: null,
                      subscription_end_at: subsTime,
                    },
                  },
                  { upsert: true }
                )
                .then((err, res) => {
                  ctx.reply(
                    "User ID: " +
                    userId +
                    " is registered successfully. Donation will end at: " +
                    moment(subsTime).format("dddd, D MMM YYYY") +
                    "\nSilahkan join channel alert\n\nhttps://t.me/joinchat/Uw8ERgsJch1jMzJl"
                  );
                });
            } else {
              db.collection("allowed_private_users").insertOne(
                doc,
                (err, res) => {
                  if (err) {
                    ctx.reply("Fail to register user");
                  } else {
                    ctx.reply(
                      "User ID: " +
                      userId +
                      " is registered successfully. Donation will end at: " +
                      moment(subsTime).format("dddd, D MMM YYYY") +
                      "\nSilahkan join channel alert\n\nhttps://t.me/joinchat/Uw8ERgsJch1jMzJl"
                    );
                  }
                }
              );
            }
          });
      });
    }
  });
});

bot.command("extend", (ctx) => {
  var message = ctx.message.text
    .substr(ctx.message.entities[0].length + 1, ctx.message.text.length)
    .split(" ");
  const userId = message[0];
  const time = message[1].split("");
  const timePeriod = time[1] == undefined ? "M" : time[1];
  var senderId = ctx.message.from.id;
  getChatMember(ctx).then((res) => {
    if (isOwner(res)) {
      MongoClient.connect(url, (er, client) => {
        const db = client.db(dbName);
        const query = { user_id: parseInt(userId) };
        db.collection("allowed_private_users").findOne(query, (err, res) => {
          if (res) {
            const currentSubs = moment(res.subscription_end_at);
            const subsTime = currentSubs.add(time[0], timePeriod).toString();
            db.collection("allowed_private_users")
              .updateOne(
                { _id: ObjectID(res._id) },
                {
                  $set: {
                    user_id: parseInt(userId),
                    paid: true,
                    trial: false,
                    trial_end_at: null,
                    subscription_end_at: subsTime,
                  },
                },
                { upsert: true }
              )
              .then((err, res) => {
                ctx.reply(
                  "User ID: " +
                  userId +
                  " is extended successfully. Donation will end at: " +
                  moment(subsTime).format("dddd, D MMM YYYY")
                );
              });
          }
        });
      });
    }
  });
});

bot.command("reggroup", (ctx) => {
  getChatMember(ctx).then((res) => {
    if (isOwner(res)) {
      const message = formatMessageInput(ctx);
      const special = message[0] == "" || !message[0] ? false : true;
      const period = !message[1] ? 1 : message[1];
      const groupId = ctx.message.chat.id;
      const groupName = ctx.message.chat.title;
      MongoClient.connect(url, (er, client) => {
        const db = client.db(dbName);
        const doc = {
          group_id: groupId.toString(),
          group_name: groupName,
          special: special,
          expired_at: moment().add(period, "months").toString(),
        };
        db.collection("allowed_group").insertOne(doc, (err, res) => {
          if (!err) {
            ctx.reply("Bot is now enabled! Happy cuan cilok!");
            console.log("Bot registered", groupId);
          } else {
            console.error(err);
          }
        });
      });
    }
  });
});

bot.command("extendg", (ctx) => {
  getChatMember(ctx).then((res) => {
    if (isOwner(res)) {
      const message = formatMessageInput(ctx);
      const period = message[0] == "" || !message[0] ? 1 : message[0];
      const groupId = ctx.message.chat.id;
      MongoClient.connect(url, (er, client) => {
        const db = client.db(dbName);
        const query = { groupd_id: groupId.toString() };
        db.collection("allowed_group").findOne(query, (err, res) => {
          if (res) {
            const currentSubs = moment(res.expired_at);
            const subsTime = currentSubs.add(period, "M").toString();

            db.collection("allowed_group")
              .updateOne(
                { _id: ObjectID(res._id) },
                {
                  $set: {
                    group_id: groupId.toString(),
                    special: res.special,
                    expired_at: subsTime,
                  },
                },
                { upsert: true }
              )
              .then((er, res2) => {
                if (!er) {
                  ctx.reply("Bot has been extended! Happy cuan cilok!");
                  console.log("Bot registered", groupId);
                } else {
                  console.error(er);
                }
              });
          }
        });
      });
    }
  });
});

bot.action("donate", (ctx) => {
  const imgUrl = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\bot_donate.png";
  const data = ctx.update.callback_query;
  ctx.telegram.sendChatAction(data.message.chat.id, "upload_photo");
  return ctx.telegram.sendPhoto(
    data.message.chat.id,
    { source: fs.ReadStream(imgUrl) },
    {
      caption:
        "Donasi Bot\n\nT4C x IF : https://t.me/tradeforcuan_channel/2053",
    }
  );
});

bot.action("trial", (ctx) => {
  const data = ctx.update.callback_query;
  var senderId = data.from.id;
  var type = data.message.chat.type;
  if (type == "private") {
    MongoClient.connect(url, (er, client) => {
      const db = client.db(dbName);
      const today = new Date();
      const trial = today.setDate(today.getDate() + 7);
      const query = { user_id: senderId };
      db.collection("allowed_private_users")
        .find(query)
        .toArray((err, res) => {
          if (res.length == 0) {
            const doc = {
              user_id: parseInt(senderId),
              paid: false,
              trial: true,
              trial_end_at: trial,
              subscription_end_at: null,
            };
            db.collection("allowed_private_users").insertOne(
              doc,
              (err, res) => {
                if (err) {
                  ctx.reply("Fail to start trial");
                } else {
                  const trialEndAt = res.ops[0].trial_end_at;
                  const trialEndDate =
                    moment(trialEndAt).format("dddd, D MMM YYYY");
                  ctx.replyWithHTML(
                    "<b>Your ID :" +
                    senderId +
                    "</b>\n" +
                    "Your trial will end at: " +
                    trialEndDate +
                    "\n\nTo donate directly, type /donate\nEnjoy the bot!\n\n<i>If the bot is not working, contact @kangritel</i>"
                  );
                }
              }
            );
          } else {
            if (res[0].paid) {
              ctx.reply("You donated already.");
            } else {
              const trialEndAt = res[0].trial_end_at;
              const trialEndDate =
                moment(trialEndAt).format("dddd, D MMM YYYY");
              ctx.replyWithHTML(
                "<b>Your ID :" +
                senderId +
                "</b>\n" +
                "Your trial will end at: " +
                trialEndDate +
                "\n\nTo donate directly, type /donate\nEnjoy the bot!\n\n<i>If the bot is not working, contact @kangritel</i>"
              );
            }
          }
        });
    });
  }
});

bot.command("trial", (ctx) => {
  var senderId = ctx.message.from.id;
  var type = ctx.message.chat.type;
  if (type == "private") {
    MongoClient.connect(url, (er, client) => {
      const db = client.db(dbName);
      const today = new Date();
      const trial = today.setDate(today.getDate() + 7);
      const query = { user_id: senderId };
      db.collection("allowed_private_users")
        .find(query)
        .toArray((err, res) => {
          if (res.length == 0) {
            const doc = {
              user_id: parseInt(senderId),
              paid: false,
              trial: true,
              trial_end_at: trial,
              subscription_end_at: null,
            };
            db.collection("allowed_private_users").insertOne(
              doc,
              (err, res) => {
                if (err) {
                  ctx.reply("Fail to start trial");
                } else {
                  const trialEndAt = res.ops[0].trial_end_at;
                  const trialEndDate =
                    moment(trialEndAt).format("dddd, D MMM YYYY");
                  ctx.replyWithHTML(
                    "<b>Your ID :" +
                    senderId +
                    "</b>\n" +
                    "Your trial will end at: " +
                    trialEndDate +
                    "\n\nTo donate directly, type /donate\nEnjoy the bot!"
                  );
                }
              }
            );
          } else {
            if (res[0].paid) {
              ctx.reply("You donated already.");
            } else {
              const trialEndAt = res[0].trial_end_at;
              const trialEndDate =
                moment(trialEndAt).format("dddd, D MMM YYYY");
              ctx.replyWithHTML(
                "<b>Your ID :" +
                senderId +
                "</b>\n" +
                "Trial will end at: " +
                trialEndDate
              );
            }
          }
        });
    });
  }
});

bot.action("profile", (ctx) => {
  const ctxData = ctx.update.callback_query;
  const senderId = ctxData.from.id;
  const type = ctxData.message.chat.type;
  if (type == "private") {
    MongoClient.connect(url, (er, client) => {
      const db = client.db(dbName);
      const query = { user_id: senderId };
      db.collection("allowed_private_users").findOne(query, (err, res) => {
        if (!res) {
          return sendHTMLMessage(
            ctx,
            "<b>Your ID :" +
            senderId +
            "</b>\n" +
            "Anda tidak mempunyai akses private bot\nSilahkan donasi untuk mendapat akses private bot."
          );
        }

        if (res.paid) {
          const subsEndAt = res.subscription_end_at;
          const subsEndDate = moment(subsEndAt).format("dddd, D MMM YYYY");
          return sendHTMLMessage(
            ctx,
            "<b>Your ID :" +
            senderId +
            "</b>\n" +
            "Your donation will end at: " +
            subsEndDate.toString()
          );
        } else if (res.trial) {
          const trialEndAt = res.trial_end_at;
          const trialEndDate = moment(trialEndAt).format("dddd, D MMM YYYY");
          return sendHTMLMessage(
            ctx,
            "<b>Your ID :" +
            senderId +
            "</b>\n" +
            "Trial will end at: " +
            trialEndDate
          );
        }
      });
    });
  }
});

bot.command("profile", (ctx) => {
  const senderId = ctx.message.from.id;
  const type = ctx.message.chat.type;
  if (type == "private") {
    MongoClient.connect(url, (er, client) => {
      const db = client.db(dbName);
      const query = { user_id: senderId };
      db.collection("allowed_private_users").findOne(query, (err, res) => {
        if (!res) {
          return sendHTMLMessage(
            ctx,
            "<b>Your ID :" +
            senderId +
            "</b>\n" +
            "Anda tidak mempunyai akses private bot\nSilahkan donasi untuk mendapat akses private bot."
          );
        }

        if (res.paid) {
          const subsEndAt = res.subscription_end_at;
          const subsEndDate = moment(subsEndAt).format("dddd, D MMM YYYY");
          sendHTMLMessage(
            ctx,
            "<b>Your ID :" +
            senderId +
            "</b>\n" +
            "Your donation will end at: " +
            subsEndDate.toString()
          );
        } else if (res.trial) {
          const trialEndAt = res.trial_end_at;
          const trialEndDate = moment(trialEndAt).format("dddd, D MMM YYYY");
          sendHTMLMessage(
            ctx,
            "<b>Your ID :" +
            senderId +
            "</b>\n" +
            "Trial will end at: " +
            trialEndDate
          );
        }
      });
    });
  }
});

bot.command("stats", (ctx) => {
  sendStats(ctx);
});

bot.command("stats@t4c_bot", (ctx) => {
  sendStats(ctx);
});

bot.action("ta", (ctx) => {
  const data = ctx.update.callback_query;
  const inlineMessageRatingKeyboard = Markup.inlineKeyboard([
    [
      Markup.callbackButton("Main", "main"),
      Markup.callbackButton("Simple", "ez"),
    ],
    [
      Markup.callbackButton("Spike", "spike"),
      Markup.callbackButton("Advanced", "adv"),
    ],
    [
      Markup.callbackButton("NBSA + Frequency", "nbs"),
      Markup.callbackButton("Trendlines", "trend"),
    ],
    [
      Markup.callbackButton("Fibonacci", "fibo"),
      Markup.callbackButton("Holy Grails", "holy"),
    ],
    [
      Markup.callbackButton("Price Action", "action"),
      Markup.callbackButton("Swing", "swing"),
    ],
  ]).extra();

  const symbol = data.message.text.split("\n")[0];
  return ctx.telegram.sendMessage(
    data.message.chat.id,
    symbol + " Technichal Analysis",
    inlineMessageRatingKeyboard
  );
});

bot.action("main", (ctx) => {
  const data = ctx.update.callback_query;
  authenticator(data).then((result) => {
    if (!authResult.valid) {
      return;
    }
    const sym = data.message.text.split(" ")[0];
    checkTicker(sym).then((result) => {
      if (!result.existed) {
        return;
      }
      var script = scriptPathCommand + "\\main\\main.js " + sym;
      imgUrl = exportPath(sym) + "_main.PNG";
      interval = "Daily";

      if (!checkFileExist(imgUrl)) {
        exec(script);

        watchFileExist(imgUrl, "").then((result) => {
          if (result.exist == true) {
            setTimeout(() => {
              return ctx.telegram.sendPhoto(
                data.message.chat.id,
                { source: fs.ReadStream(imgUrl) },
                { caption: "Main - $" + sym.toUpperCase() + " - " + interval }
              );
            }, 150);
          }
        });
      } else {
        setTimeout(() => {
          return ctx.telegram.sendPhoto(
            data.message.chat.id,
            { source: fs.ReadStream(imgUrl) },
            { caption: "Main - $" + sym.toUpperCase() + " - " + interval }
          );
        }, 150);
      }
    });
  });
});

bot.action("ez", (ctx) => {
  const data = ctx.update.callback_query;
  authenticator(data).then((result) => {
    if (!authResult.valid) {
      return;
    }
    const sym = data.message.text.split(" ")[0];
    checkTicker(sym).then((result) => {
      if (!result.existed) {
        return;
      }
      var script = scriptPathCommand + "\\ez\\ez.js " + sym;
      imgUrl = exportPath(sym) + "_ez.PNG";
      interval = "Daily";

      if (!checkFileExist(imgUrl)) {
        exec(script);
        watchFileExist(imgUrl, "").then((result) => {
          if (result.exist == true) {
            setTimeout(() => {
              return ctx.telegram.sendPhoto(
                data.message.chat.id,
                { source: fs.ReadStream(imgUrl) },
                { caption: "Simple - $" + sym.toUpperCase() + " - " + interval }
              );
            }, 150);
          }
        });
      } else {
        setTimeout(() => {
          return ctx.telegram.sendPhoto(
            data.message.chat.id,
            { source: fs.ReadStream(imgUrl) },
            { caption: "Simple - $" + sym.toUpperCase() + " - " + interval }
          );
        }, 150);
      }
    });
  });
});

bot.action("sr", (ctx) => {
  const data = ctx.update.callback_query;
  authenticator(data).then((result) => {
    if (!authResult.valid) {
      return;
    }
    const sym = data.message.text.split("\n")[0];
    checkTicker(sym).then((result) => {
      if (!result.existed) {
        return;
      }
      var script = scriptPathCommand + "\\pivot\\pivot.js " + sym;
      imgUrl = exportPath(sym) + "_pivot_d.PNG";
      interval = "Daily";

      if (!checkFileExist(imgUrl)) {
        exec(script);
        watchFileExist(imgUrl, "").then((result) => {
          if (result.exist == true) {
            setTimeout(() => {
              return ctx.telegram.sendPhoto(
                data.message.chat.id,
                { source: fs.ReadStream(imgUrl) },
                {
                  caption:
                    "Pivot & S/R - $" + sym.toUpperCase() + " - " + interval,
                }
              );
            }, 150);
          }
        });
      } else {
        setTimeout(() => {
          return ctx.telegram.sendPhoto(
            data.message.chat.id,
            { source: fs.ReadStream(imgUrl) },
            {
              caption: "Pivot & S/R - $" + sym.toUpperCase() + " - " + interval,
            }
          );
        }, 150);
      }
    });
  });
});

bot.command("info", (ctx) => {
  const message = formatMessageInput(ctx);
  const symbol = message[0].toUpperCase();

  let companyProfile,
    orderBookData,
    financialData = "";

  checkRedisCache(redisInfoKey(symbol)).then((cache) => {
    if (cache != null) {
      if (cache.length >= 4000) {
        const breakIndex = cache.indexOf("break here");
        sendHTMLMessage(ctx, cache.substring(0, breakIndex));
        return sendHTMLMessage(
          ctx,
          cache.substring(breakIndex + 11, cache.length)
        );
      } else {
        return sendHTMLMessage(ctx, cache);
      }
    }

    getCompanyProfile(symbol).then((res) => {
      if (res != undefined) {
        companyProfile = "<b>" + symbol + " - " + res.name + "</b>";
        companyProfile =
          companyProfile +
          "\nSector: " +
          res.sector +
          "     Sub-sector: " +
          res.sub_sector;
        const notation = res.notation;
        if (notation.length > 0) {
          companyProfile = companyProfile + "\n\n<b>Notation</b>";
          notation.map((no) => {
            companyProfile =
              companyProfile +
              "<i>\n" +
              no.notation_code +
              " - " +
              no.notation_desc +
              "</i>";
          });
        }
        companyProfile =
          companyProfile + "\n\n" + res.background.replace(/</g, "");
        companyProfile = companyProfile + "\n\n<b>Shareholders</b><i>";
        const shareholders = res.shareholder;
        if (shareholders != undefined) {
          for (i = 0; i < shareholders.length; i++) {
            if (shareholders[i].percentage != "0.00%") {
              companyProfile =
                companyProfile +
                "\n" +
                shareholders[i].shareholder +
                " (" +
                shareholders[i].percentage +
                ")";
            }
          }
        } else {
          companyProfile = companyProfile + "\n<i>NO SHAREHOLDERS DATA</i>";
        }
        companyProfile = companyProfile + "</i>";

        getOrderbookData(symbol).then((res2) => {
          orderBookData = "\n\n<b>Price Info</b>";
          orderBookData =
            orderBookData +
            "\n<i>Bid: " +
            res.orderbook.bid.price +
            " (" +
            convertToThousand(res.orderbook.bid.volume / 100) +
            ")" +
            "    Offer: " +
            res.orderbook.offer.price +
            " (" +
            convertToThousand(res.orderbook.offer.volume / 100) +
            ")";
          orderBookData =
            orderBookData +
            "\nPrevious: " +
            convertToThousand(res2.previous) +
            "   Close: " +
            convertToThousand(res2.lastprice) +
            "\nOpen: " +
            res2.open +
            "    High: " +
            res2.high +
            "    Low: " +
            res2.low +
            "\nAverage: " +
            res2.average +
            "\nChange: " +
            res2.change +
            " (" +
            Math.round(res2.percentage_change * 100) / 100 +
            "%)" +
            "\nVolume: " +
            convertVal(res2.volume);
          orderBookData = orderBookData + "\nValue: " + convertVal(res2.value);
          orderBookData =
            orderBookData + "\nFrequency: " + convertToThousand(res2.frequency);
          orderBookData =
            orderBookData +
            "\nForeign Buy: " +
            convertVal(res2.fbuy) +
            "\nForeign Sell: " +
            convertVal(res2.fsell) +
            "\nNet Foreign: " +
            convertVal(res2.fnet) +
            "\nForeign Percentage: " +
            res2.foreign +
            "%" +
            "\nDomestic Percentage: " +
            res2.domestic +
            "%</i>";

          getFinancialData(symbol).then((res3) => {
            if (res3) {
              const keyData = res3.ranked_items;
              financialData = "\n\n<b>==== Key Stats ==== </b>";
              if (res3.review_status == null) {
                financialData = financialData + "\n<i>NO FINANCIAL DATA</i>";
              } else {
                financialData =
                  financialData +
                  " \nRating: " +
                  res3.review_status.replace(/_/g, " ") +
                  "\n<i>";
                keyData.map((row) => {
                  if (row.unit == "percentage") {
                    financialData =
                      financialData +
                      "\n" +
                      row.label +
                      ": " +
                      (row.value * 100).toFixed(2) +
                      "%";
                  } else {
                    valueData = row.value != null ? row.value.toFixed(2) : 0;
                    financialData =
                      financialData + "\n" + row.label + ": " + valueData;
                  }
                });
                financialData = financialData + "</i>";

                financialData = financialData + "\n\n<b>Indexes</b><i>\n";
                const indexes = res.indexes;
                indexes.map((i) => {
                  financialData = financialData + i + ", ";
                });

                financialData = financialData + "</i>";
              }
            }

            let message = companyProfile + orderBookData + financialData;

            if (message.length >= 4000) {
              message =
                companyProfile + "break here" + orderBookData + financialData;
              // saveToRedisCache(redisInfoKey(symbol), message);
              sendHTMLMessage(ctx, companyProfile);
              sendHTMLMessage(ctx, orderBookData + financialData);
            } else {
              sendHTMLMessage(ctx, message);
            }
          });
        });
      }
    });
  });
});

bot.command("ows", (ctx) => {
  const message = formatMessageInput(ctx);
  if (message.length == 1 && !message[0]) {
    let textMessage;
    textMessage = "<b>Summary Kepemilikan Data Saham</b>\n";
    textMessage = textMessage + "<code>";
    textMessage = textMessage + "Command: /ow [kode_saham] [periode]\n";
    textMessage = textMessage + "Format periode: MMYY (0321)\n";
    textMessage =
      textMessage +
      "Jika periode kosong, maka akan mengambil data 1 bulan terakhir\n";
    textMessage = textMessage + "Contoh: /ow TLKM 0121\n";
    textMessage =
      textMessage + "Data yang tersedia hingga 1 tahun terakhir</code>";
    return ctx.replyWithHTML(textMessage);
  }
  const sym = message[0].toUpperCase();
  let period =
    message[1] == undefined
      ? moment().subtract(1, "month").format("MMMYYYY").toLowerCase()
      : moment(message[1].toUpperCase(), "MMYY")
        .format("MMMYYYY")
        .toLowerCase();

  const path = Path.resolve(
    "C://Users//Administrator//Documents//OW",
    "ows_" + sym + "_" + period + ".png"
  );

  checkRedisCache(redisOWSKey(sym + period)).then((cache) => {
    if (cache != null) {
      return setTimeout(() => {
        ctx.telegram
          .sendPhoto(
            ctx.message.chat.id,
            { source: fs.ReadStream(path) },
            Extra.caption(
              "<b>Summary Kepemilikan Saham kurang dari 5% (Masyarakat) " +
              sym +
              " Per " +
              moment(period, "MMMYYYY").format("MMM YYYY") +
              "</b>"
            )
              .HTML()
              .inReplyTo(ctx.message.message_id)
          )
          .catch((err) => {
            console.error(err);
          });
      }, 150);
    }

    return MongoClient.connect(url, (er, client) => {
      const db = client.db(dbName);
      db.collection("ownership").findOne({ ticker: sym }, (err, res) => {
        if (!res) {
          return;
        }

        if (
          !res.data.hasOwnProperty(period) &&
          moment().diff(moment(period, "MMMYYYY"), "month") == 1
        ) {
          period = moment(period, "MMMYYYY")
            .subtract(1, "month")
            .format("MMMYYYY")
            .toLowerCase();
        }
        let final = [];
        const data = res.data[period];
        _.forEach(data, (val, key) => {
          final.push(
            parseFloat(
              calculateOwnership(val, data.local_total, data.foreign_total)
            )
          );
        });

        const local = final.slice(0, 9).reduce((a, b) => a + b, 0);
        const foreign = final.slice(10, 19).reduce((a, b) => a + b, 0);

        const chartData = {
          labels: ["Domestik", "Asing"],
          datasets: [
            {
              label: "Summary Kepemilikan",
              data: [local, foreign],
              backgroundColor: ["rgb(0, 200, 195)", "rgb(255, 105, 180)"],
              borderColor: "rgb(255, 255, 255)",
            },
          ],
        };

        const configuration = {
          type: "pie",
          data: chartData,
          options: {
            plugins: {
              datalabels: {
                formatter: function (value, context) {
                  return numeral(value).format("0.00") + "%";
                },
                align: "center",
                anchor: "center",
                clamp: true,
                offset: 15,
                font: {
                  size: 48,
                },
              },
            },
            layouts: {
              padding: {
                bottom: 50,
              },
            },
            title: {
              display: true,
              padding: 50,
              text:
                "Summary Kepemilikan Saham di bawah 5% " +
                sym +
                " Per " +
                moment(period, "MMMYYYY").format("MMM YYYY"),
            },
            legend: {
              padding: 25,
            },
          },
        };

        chartJSNodeCanvas
          .renderToDataURL(configuration, "image/png")
          .then((res) => {
            const imageFile = res.replace(/^data:image\/png;base64,/, "");
            fs.writeFile(path, imageFile, "base64", (err) => {
              if (err) console.error(err);

              jimp.read(path, (er, file) => {
                jimp.read("t4c.png", (err, logo) => {
                  const finalPath = Path.resolve(
                    "C://Users//Administrator//Documents//OW",
                    "ows_" + sym + "_" + period + ".png"
                  );
                  file
                    .composite(logo.scaleToFit(1920, jimp.AUTO), 0, -480, {
                      opacitySource: 0.1,
                    })
                    .quality(100)
                    .writeAsync(path)
                    .then((join) => {
                      jimp.read(join, (err, final) => {
                        if (err) console.error(err);
                        ctx.telegram.sendChatAction(
                          ctx.message.chat.id,
                          "upload_photo"
                        );

                        // saveToRedisCacheOW(redisOWSKey(sym + period), "ows");
                        setTimeout(() => {
                          return ctx.telegram
                            .sendPhoto(
                              ctx.message.chat.id,
                              { source: fs.ReadStream(finalPath) },
                              Extra.caption(
                                "<b>Summary Kepemilikan Saham kurang dari 5% (Masyarakat) " +
                                sym +
                                " Per " +
                                moment(period, "MMMYYYY").format("MMM YYYY") +
                                "</b>"
                              )
                                .HTML()
                                .inReplyTo(ctx.message.message_id)
                            )
                            .catch((err) => {
                              console.error(err);
                            });
                        }, 150);
                      });
                    });
                });
              });
            });
          });
      });
    });
  });
});

bot.command("tdm", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = formatTimeframeInput(message[1]);
  const command = ctx.state.command;

  if (!checkTimeFrame(tf)) {
    return;
  }

  const { imgUrl, interval, script } = processor({ tf, sym, command });

  checkRedisCache(redisChartKey("TDM", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "TDM",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "TDM",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("main", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = formatTimeframeInput(message[1]);
  const command = ctx.state.command;

  if (!checkTimeFrame(tf)) {
    return;
  }

  const { imgUrl, interval, script } = processor({ tf, sym, command });

  return sendPhoto(ctx, {
    ticker: sym,
    photo: imgUrl,
    type: "Main",
    interval,
    script,
  }).catch((err) => {
    console.error(err);
  });

  // checkRedisCache(redisChartKey("Main", sym, interval)).then((cache) => {
  //   if (cache != null && fs.existsSync(imgUrl)) {
  //     return sendPhoto(ctx, {
  //       ticker: sym,
  //       photo: imgUrl,
  //       type: "Main",
  //       interval,
  //       taInfo: cache,
  //     }).catch((err) => {
  //       console.error(err);
  //     });
  //   }

  //   return sendPhoto(ctx, {
  //     ticker: sym,
  //     photo: imgUrl,
  //     type: "Main",
  //     interval,
  //     script,
  //   }).catch((err) => {
  //     console.error(err);
  //   });
  // });
});

bot.command("ss", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = formatTimeframeInput(message[1]);
  const command = ctx.state.command;

  if (!checkTimeFrame(tf)) {
    return;
  }

  const { imgUrl, interval, script } = processor({ tf, sym, command });

  checkRedisCache(redisChartKey("Ss", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "SS",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "SS",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("ccg", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];

  const script = scriptPathCommand + "cacing\\cacing.js " + sym;
  const imgUrl = exportPath(sym) + "_cacing.PNG";
  const interval = "Daily";

  checkRedisCache(redisChartKey("Ccg", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "CACING",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "CACING",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("spike", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = formatTimeframeInput(message[1], true);
  const command = ctx.state.command;

  if (!checkTimeFrame(tf)) {
    return;
  }

  const { imgUrl, interval, script } = processor({ tf, sym, command });

  checkRedisCache(redisChartKey("Spike", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "Spike",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "Spike",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("ez", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = formatTimeframeInput(message[1]);
  const command = ctx.state.command;

  if (!checkTimeFrame(tf)) {
    return;
  }

  const { imgUrl, interval, script } = processor({ tf, sym, command });

  checkRedisCache(redisChartKey("Simple", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "Simple",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "Simple",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("nbs", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = formatTimeframeInput(message[1]);
  const command = ctx.state.command;

  if (!checkTimeFrame(tf)) {
    return;
  }

  const { imgUrl, interval, script } = processor({ tf, sym, command });

  checkRedisCache(redisChartKey("NBSA", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "Net Buy Sell Asing",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "Net Buy Sell Asing",
      redisKey: "NBSA",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

// bot.command("adv", (ctx) => {
//   const message = formatMessageInput(ctx);
//   const sym = message[0];
//   const tf = formatTimeframeInput(message[1]);
//   const command = ctx.state.command;

//   if (!checkTimeFrame(tf)) {
//     return;
//   }

//   const { imgUrl, interval, script } = processor({ tf, sym, command });

//   checkRedisCache(redisChartKey("Adv", sym, interval)).then((cache) => {
//     if (cache != null && fs.existsSync(imgUrl)) {
//       return sendPhoto(ctx, {
//         ticker: sym,
//         photo: imgUrl,
//         type: "Advanced",
//         interval,
//         taInfo: cache,
//       }).catch((err) => {
//         console.error(err);
//       });
//     }

//     return sendPhoto(ctx, {
//       ticker: sym,
//       photo: imgUrl,
//       type: "Advanced",
//       redisKey: "Adv",
//       interval,
//       script,
//     }).catch((err) => {
//       console.error(err);
//     });
//   });
// });

bot.command("trend", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = formatTimeframeInput(message[1]);
  const command = ctx.state.command;

  if (!checkTimeFrame(tf)) {
    return;
  }

  const { imgUrl, interval, script } = processor({ tf, sym, command });

  checkRedisCache(redisChartKey("Trendline", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "Trendline",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "Trendline",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("pix", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = formatTimeframeInput(message[1]);
  const command = ctx.state.command;

  if (!checkTimeFrame(tf)) {
    return;
  }

  const { imgUrl, interval, script } = processor({ tf, sym, command });

  checkRedisCache(redisChartKey("Pixel", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "Pixel",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "Pixel",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("darvas", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = formatTimeframeInput(message[1]);

  const script = scriptPathCommand + "\\darvas.js " + sym;
  const imgUrl = exportPath(sym) + "_darvas.PNG";
  const interval = "Daily";

  checkRedisCache(redisChartKey("Darvas", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "Darvas",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "Darvas",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("sr", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = formatTimeframeInput(message[1]);

  if (!checkSpecificTimeFrame(tf)) {
    return;
  }

  if (tf == "D") {
    script = scriptPathCommand + "\\pivot\\pivot.js " + sym;
    imgUrl = exportPath(sym) + "_pivot_d.PNG";
    interval = "Daily";
  } else if (tf == "W") {
    script = scriptPathCommand + "\\pivot\\pivot_w.js " + sym;
    imgUrl = exportPath(sym) + "_pivot_w.PNG";
    interval = "Weekly";
  } else if (tf == "M") {
    script = scriptPathCommand + "\\pivot\\pivot_m.js " + sym;
    imgUrl = exportPath(sym) + "_pivot_m.PNG";
    interval = "Monthly";
  }

  checkRedisCache(redisChartKey("SR", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "SR",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "SR",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("ichi", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = formatTimeframeInput(message[1]);
  const command = ctx.state.command;

  if (!checkTimeFrame(tf)) {
    return;
  }

  const { imgUrl, interval, script } = processor({ tf, sym, command });

  checkRedisCache(redisChartKey("Ichimoku", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "Ichimoku",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "Ichimoku",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("action", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = formatTimeframeInput(message[1]);
  const command = ctx.state.command;

  if (!checkTimeFrame(tf)) {
    return;
  }

  const { imgUrl, interval, script } = processor({ tf, sym, command });

  checkRedisCache(redisChartKey("PA", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "Price Action",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "Price Action",
      redisKey: "PA",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("fibo", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = formatTimeframeInput(message[1]);
  const command = ctx.state.command;

  if (!checkTimeFrame(tf)) {
    return;
  }

  const { imgUrl, interval, script } = processor({ tf, sym, command });

  checkRedisCache(redisChartKey("Fibonacci", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "Fibonacci",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "Fibonacci",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("swing", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = formatTimeframeInput(message[1]);
  const command = ctx.state.command;

  if (!checkTimeFrame(tf)) {
    return;
  }

  const { imgUrl, interval, script } = processor({ tf, sym, command });

  checkRedisCache(redisChartKey("Swing", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "Swing",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "Swing",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("st", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];

  const script = scriptPathCommand + "\\st.js " + sym;
  const imgUrl = exportPath(sym) + "_st.PNG";

  checkRedisCache(redisChartKey("Seasonality", sym)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "Seasonality",
        taInfo: "",
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "Seasonality",
      taInfo: "",
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("gm", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = formatTimeframeInput(message[1]);
  const command = ctx.state.command;

  if (!checkTimeFrame(tf)) {
    return;
  }

  const { imgUrl, interval, script } = processor({ tf, sym, command });

  checkRedisCache(redisChartKey("GM", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "Alligator",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "Alligator",
      redisKey: "GM",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("eq", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const script = scriptPathCommand + "\\eq.js " + sym;

  imgUrl = exportPath(sym) + "_eq.PNG";
  interval = "Daily";

  checkRedisCache(redisChartKey("EQ", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "EQ",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "EQ",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("ma", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = formatTimeframeInput(message[1]);

  if (!checkSpecificTimeFrame(tf)) {
    return;
  }

  if (tf == "D") {
    script = scriptPathCommand + "\\ma\\ma.js " + sym;
    imgUrl = exportPath(sym) + "_ma.PNG";
    interval = "Daily";
  } else if (tf == "W") {
    script = scriptPathCommand + "\\ma\\ma_w.js " + sym;
    imgUrl = exportPath(sym) + "_ma_w.PNG";
    interval = "Weekly";
  } else if (tf == "M") {
    script = scriptPathCommand + "\\ma\\ma_m.js " + sym;
    imgUrl = exportPath(sym) + "_ma_m.PNG";
    interval = "Monthly";
  }

  checkRedisCache(redisChartKey("MA", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "MA",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "Moving Average",
      redisKey: "MA",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("ema", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = formatTimeframeInput(message[1]);

  if (!checkSpecificTimeFrame(tf)) {
    return;
  }

  if (tf == "D") {
    script = scriptPathCommand + "\\ma\\ema.js " + sym;
    imgUrl = exportPath(sym) + "_ema.PNG";
    interval = "Daily";
  } else if (tf == "W") {
    script = scriptPathCommand + "\\ma\\ema_w.js " + sym;
    imgUrl = exportPath(sym) + "_ema_w.PNG";
    interval = "Weekly";
  } else if (tf == "M") {
    script = scriptPathCommand + "\\ma\\ema_m.js " + sym;
    imgUrl = exportPath(sym) + "_ema_m.PNG";
    interval = "Monthly";
  }

  checkRedisCache(redisChartKey("EMA", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "EMA",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "Exponential Moving Average",
      redisKey: "EMA",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("gap", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  script = scriptPathCommand + "\\gap.js " + sym;
  imgUrl = exportPath(sym) + "_gap.PNG";
  interval = "Daily";

  checkRedisCache(redisChartKey("Gap", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "Gap",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "Gap",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

bot.command("vwap", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = message[1] == undefined ? "5M" : message[1].toUpperCase();

  if (tf == "5M") {
    script = scriptPathCommand + "\\vwap\\vwap.js " + sym;
    interval = "5m";
    imgUrl = exportPath(sym) + "_vwap.PNG";
  } else if (tf == "15M") {
    script = scriptPathCommand + "\\vwap\\vwap_15m.js " + sym;
    interval = "15m";
    imgUrl = exportPath(sym) + "_vwap_15m.PNG";
  } else if (tf == "H") {
    script = scriptPathCommand + "\\vwap\\vwap_h.js " + sym;
    imgUrl = exportPath(sym) + "_vwap_h.PNG";
    interval = "H";
  }

  checkRedisCache(redisChartKey("VWAP", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "VWAP",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "VWAP",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
});

// bot.command("cp", (ctx) => {
//   sendCp(ctx);
// });

// bot.command("sd", (ctx) => {
//   sendCp(ctx);
// });

// bot.command("ks", (ctx) => {
//   const message = formatMessageInput(ctx);
//   const sym = message[0];

//   if (checkFAAccess(ctx)) {
//     script = scriptPathCommand + "fa\\ks.js " + sym;
//     imgUrl = exportPath(sym) + "_ks.PNG";

//     checkRedisCache(redisChartKey("KS", sym)).then((cache) => {
//       if (cache != null && fs.existsSync(imgUrl)) {
//         return sendPhoto(ctx, {
//           ticker: sym,
//           photo: imgUrl,
//           type: "Key Stats",
//           taInfo: "",
//         }).catch((err) => {
//           console.error(err);
//         });
//       }

//       return sendPhoto(ctx, {
//         ticker: sym,
//         photo: imgUrl,
//         redisKey: "KS",
//         type: "Key Stats",
//         taInfo: "",
//         script,
//       }).catch((err) => {
//         console.error(err);
//       });
//     });
//   }
// });

// bot.command("pp", (ctx) => {
//   const message = formatMessageInput(ctx);
//   const sym = message[0];

//   if (checkFAAccess(ctx)) {
//     script = scriptPathCommand + "fa\\perpbv.js " + sym;
//     imgUrl = exportPath(sym) + "_perpbv.PNG";

//     checkRedisCache(redisChartKey("PP", sym)).then((cache) => {
//       if (cache != null && fs.existsSync(imgUrl)) {
//         return sendPhoto(ctx, {
//           ticker: sym,
//           photo: imgUrl,
//           type: "PER/PBV Band",
//           taInfo: "",
//         }).catch((err) => {
//           console.error(err);
//         });
//       }

//       return sendPhoto(ctx, {
//         ticker: sym,
//         photo: imgUrl,
//         redisKey: "PP",
//         type: "PER/PBV Band",
//         taInfo: "",
//         script,
//       }).catch((err) => {
//         console.error(err);
//       });
//     });
//   }
// });

// bot.command("ag", (ctx) => {
//   const message = formatMessageInput(ctx);
//   const sym = message[0];

//   if (checkFAAccess(ctx)) {
//     script = scriptPathCommand + "fa\\ag.js " + sym;
//     imgUrl = exportPath(sym) + "_ag.PNG";

//     checkRedisCache(redisChartKey("AG", sym)).then((cache) => {
//       if (cache != null && fs.existsSync(imgUrl)) {
//         return sendPhoto(ctx, {
//           ticker: sym,
//           photo: imgUrl,
//           type: "Annual Growth",
//           taInfo: "",
//         }).catch((err) => {
//           console.error(err);
//         });
//       }

//       return sendPhoto(ctx, {
//         ticker: sym,
//         photo: imgUrl,
//         redisKey: "AG",
//         type: "Annual Growth",
//         taInfo: "",
//         script,
//       }).catch((err) => {
//         console.error(err);
//       });
//     });
//   }
// });

// bot.command("qg", (ctx) => {
//   const message = formatMessageInput(ctx);
//   const sym = message[0];

//   if (checkFAAccess(ctx)) {
//     script = scriptPathCommand + "fa\\qg.js " + sym;
//     imgUrl = exportPath(sym) + "_qg.PNG";

//     checkRedisCache(redisChartKey("QG", sym)).then((cache) => {
//       if (cache != null && fs.existsSync(imgUrl)) {
//         return sendPhoto(ctx, {
//           ticker: sym,
//           photo: imgUrl,
//           type: "Quarterly Growth",
//           taInfo: "",
//         }).catch((err) => {
//           console.error(err);
//         });
//       }

//       return sendPhoto(ctx, {
//         ticker: sym,
//         photo: imgUrl,
//         redisKey: "QG",
//         type: "Quarterly Growth",
//         taInfo: "",
//         script,
//       }).catch((err) => {
//         console.error(err);
//       });
//     });
//   }
// });

bot.command("code", (ctx) => {
  const message = formatMessageInput(ctx);
  const code = message[0].toUpperCase();

  ctx.telegram.sendChatAction(ctx.message.chat.id, "typing");
  getBrokerCode(code).then((res) => {
    if (!res) {
      return;
    }
    return ctx.reply(res.code + " - " + res.name);
  });
});

bot.command("fallback", (ctx) => {
  const message = formatMessageInput(ctx);
  if (message[0].toUpperCase() == "ON") {
    setFallback();
    return ctx.reply("Fallback turned on!");
  } else {
    unsetFallback();
    return ctx.reply("Fallback turned off!");
  }
});

bot.command("stopm", (ctx) => {
  getChatMember(ctx).then((res) => {
    if (isOwner(res)) {
      let receiver = [];
      unsetMaintenance();
      MongoClient.connect(url, (er, client) => {
        const db = client.db(dbName);
        db.collection("allowed_group")
          .find()
          .toArray((err, res) => {
            res.forEach((data) => {
              receiver.push({ id: data.group_id });
            });
          });

        db.collection("allowed_private_users")
          .find()
          .toArray((err, res) => {
            res.forEach((data) => {
              if (data.paid || data.trial_end_at > now) {
                receiver.push({ id: data.user_id });
              }
            });
            receiver.forEach((data) => {
              ctx.telegram
                .sendMessage(
                  data.id,
                  "Maintenance telah selesai. Bot dapat digunakan kembali.\nSalam cuan cilok!\nSilahkan join group T4C di https://t.me/tradeforcuan"
                )
                .catch((err) => {
                  console.error(err);
                });
            });
          });
      });
    }
  });
});

bot.command("getid", (ctx) => {
  // getChatMember(ctx).then((res) => {
  //   if (isOwner(res)) {
  console.log("Chat ID : " + ctx.message.chat.id);
  //   }
  // });
});

bot.command("leave", (ctx) => {
  const groupId = ctx.message.text.substr(
    ctx.message.entities[0].length + 1,
    ctx.message.text.length
  );
  getChatMember(ctx).then((res) => {
    if (isOwner(res)) {
      MongoClient.connect(url, (er, client) => {
        const db = client.db(dbName);
        ctx.telegram
          .leaveChat(groupId)
          .then((res) => {
            const doc = { group_id: groupId };
            db.collection("allowed_group").deleteOne(doc, (err, res) => { });
          })
          .catch((err) => {
            console.error(err);
          });
      });
    }
  });
});

bot.command("msg", (ctx) => {
  getChatMember(ctx).then((res) => {
    if (isOwner(res)) {
      const message = ctx.message.text.substr(
        ctx.message.entities[0].length + 1,
        ctx.message.text.length
      );

      let receiver = [];
      setMaintenance();
      MongoClient.connect(url, (er, client) => {
        const db = client.db(dbName);
        db.collection("allowed_group")
          .find()
          .toArray((err, res) => {
            res.forEach((data) => {
              receiver.push({ id: data.group_id });
            });
          });

        db.collection("allowed_private_users")
          .find()
          .toArray((err, res) => {
            res.forEach((data) => {
              if (data.paid || data.trial_end_at > now) {
                receiver.push({ id: data.user_id });
              }
            });
            receiver.forEach((data) => {
              ctx.telegram.sendMessage(data.id, message).catch((err) => {
                console.error(err);
              });
            });
          });
      });
    }
  });
});

bot.command("msgg", (ctx) => {
  getChatMember(ctx).then((res) => {
    if (isOwner(res)) {
      const message = ctx.message.text.substr(
        ctx.message.entities[0].length + 1,
        ctx.message.text.length
      );

      MongoClient.connect(url, (er, client) => {
        const db = client.db(dbName);
        let receiver = [];
        db.collection("allowed_group")
          .find()
          .toArray((err, res) => {
            res.forEach((data) => {
              receiver.push({ id: data.group_id });
            });

            receiver.forEach((data) => {
              ctx.telegram.sendMessage(data.id, message).catch((err) => {
                console.error(err, data.id);
              });
            });
          });
      });
    }
  });
});

bot.command("msgp", (ctx) => {
  getChatMember(ctx).then((res) => {
    if (isOwner(res)) {
      const message = ctx.message.text.substr(
        ctx.message.entities[0].length + 1,
        ctx.message.text.length
      );

      MongoClient.connect(url, (er, client) => {
        const db = client.db(dbName);

        db.collection("allowed_private_users")
          .find()
          .toArray((err, res) => {
            res.forEach((data) => {
              if (data.paid) {
                ctx.telegram.sendMessage(data.user_id, message);
              }
            });
          });
      });
    }
  });
});

bot.command("bds", (ctx) => {
  const message = formatMessageInput(ctx);
  if (message.length == 1 && !message[0]) {
    return sendHTMLMessage(
      ctx,
      `
      <b>Top 10 Stocks by Broker Acccumulation / Distribution</b>
      Command: <code>/bds [BROKER_CODE] [ACC|DIST] [TF]</code>
      <i>
      TF / TIMEFRAME = D, W, M, EW, EM
      D = Daily
      W = Weekly (1 minggu lalu dari hari ini)
      M = Monthly (1 bulan lalu dari hari ini)
      EW = Awal Minggu
      EM = Awal Bulan
      </i>

      Contoh:<code>
      /bds BK ACC D (Top 10 stocks accum by BK daily)
      /bds MG DIST EW (Top 10 stocks distri by MG early week)
      </code>

      Data di update setelah jam 20.30
      `
    );
  }
  const brokerCode = message[0].toUpperCase();
  const messageId = ctx.message.message_id;
  const type = message[1] !== undefined ? message[1].toUpperCase() : "ACC";
  let tf;
  if (message[2] && checkBDTimeFrame(message[2])) {
    tf = message[2].toUpperCase();
  } else {
    return ctx.reply("Invalid timeframe", Extra.inReplyTo(messageId));
  }

  let textMessage;

  getBrokerCode(brokerCode).then((res) => {
    if (!res) {
      return ctx.reply("Invalid broker code", Extra.inReplyTo(messageId));
    }

    checkRedisCache(redisBDSKey(brokerCode, type, tf)).then((cache) => {
      if (cache != null) {
        return sendHTMLMessage(ctx, cache);
      }

      let broker = [];
      let netval, netlot, avg;

      const filter =
        type == "ACC"
          ? {
            "data.broker_summary.brokers_buy.netbs_broker_code": brokerCode,
          }
          : {
            "data.broker_summary.brokers_sell.netbs_broker_code": brokerCode,
          };

      getBrokSumDataFromDBByTF(tf, filter).then((res) => {
        res.map((row) => {
          let valid = false;
          const bs = row.data.broker_summary;
          for (i = 0; i < 5; i++) {
            const data = type == "ACC" ? bs.brokers_buy[i] : bs.brokers_buy[i];

            if (data == undefined) {
              break;
            }
            const exist = data.netbs_broker_code == brokerCode;
            if (exist) {
              netlot = type == "ACC" ? data.blot : data.slot;
              netval = type == "ACC" ? data.bval : data.sval;
              avg =
                type == "ACC"
                  ? data.netbs_buy_avg_price
                  : data.netbs_sell_avg_price;
              valid = true;
              break;
            }
            valid = false;
          }

          if (valid) {
            const doc = {
              ticker: row.ticker,
              vol: netlot,
              val: netval,
              avg,
            };
            broker.push(doc);
          }
        });

        if (type == "ACC") {
          textMessage =
            "<b>Top 10 Stocks by Broker Accum" +
            `\n${formatTF(tf)}</b>` +
            "\n<b>Broker Code: " +
            brokerCode +
            "</b>\n\n";
        } else {
          textMessage =
            "<b>Top 10 Stocks by Broker Distri</b>" +
            "\n<b>Broker Code: " +
            brokerCode +
            "</b>\n\n";
        }

        broker
          .sort((a, b) => {
            return b.val - a.val;
          })
          .slice(0, 10)
          .map((b) => {
            textMessage =
              textMessage +
              "<b>" +
              b.ticker +
              "</b>\n" +
              "Value: " +
              convertVal(b.val) +
              "\n" +
              "Volume: " +
              numeral(b.vol).format(0, 0) +
              "\n" +
              "Average: " +
              numeral(b.avg).format(0, 0) +
              "\n\n";
          });

        saveToRedisCache(redisBDSKey(brokerCode, type, tf), textMessage);
        return sendHTMLMessage(ctx, textMessage);
      });
    });
  });
});

bot.command("bd", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0].toUpperCase();
  const { fromDate, toDate } = formatBroksumDate(message);
  console.log(`FromDate: ${fromDate}, toDate: ${toDate}`)
  checkRedisCache(redisBDKey(sym, fromDate, toDate)).then((cache) => {
    if (cache != null) {
      return sendHTMLMessage(ctx, cache);
    }
    getBD(sym, fromDate, toDate, ctx.state.fallback)
      .then((res) => {
        // saveToRedisCache(redisBDKey(sym, fromDate, toDate), res);
        return sendHTMLMessage(ctx, res);
      })
      .catch((err) => console.error(err));
  });
});

bot.command("tv", (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0].toUpperCase();
  const chatId = ctx.message.chat.id;
  return axios
    .post(
      `http://tv-tele-bot.roderick_samuel.repl.co/webhook?ticker=${sym}&loginRequired=true&chart=S1WPW00T&chatId=${chatId}`
    )
    .then((res) => {
      console.log("Requested TV");
    })
    .catch((err) => {
      console.error(err);
    });
});

bot.command("sbd", (ctx) => {
  const message = formatMessageInput(ctx);
  const messageId = ctx.message.message_id;
  let type = "";

  if (message.length == 1 && !checkBDTimeFrame(message[0])) {
    const helpMessage = `<b>==== Screening Bandar Accum ====
    Kriteria:
    - Acc/Dist >= 20%
    - Liquid (Avg Trx 20D >= 500M)</b>

    Command: <code>/sbd [TF] [TYPE]</code>
    <i>
    TF / TIMEFRAME = D, 3D, W, M, EW, EM
    D = Daily
    3D = 3-Days
    W = Weekly (1 minggu lalu dari hari ini)
    M = Monthly (1 bulan lalu dari hari ini)
    EW = Awal Minggu
    EM = Awal Bulan

    TYPE = [acc|dist].[1|3|5]
    Acc = Akumulasi
    Dist = Distribusi
    1|3|5 = Top Broker 1 / 3 / 5
    (Bisa digabung, misalnya: 35 - Top Broker 3&5)
    </i>

    Contoh: <code>
    /sbd D acc.3 (Daily Accum Top 3 Broker)
    /sbd EW acc.13 (Early Week Accum Top 1&3 Broker)
    /sbd EM dist.5 (Early Month Distri Top 5 Broker)
    </code>

    Data di update setelah 20.30
    `;

    return sendHTMLMessage(ctx, helpMessage);
  }

  let tf;
  if (checkBDTimeFrame(message[0])) {
    tf = message[0].toUpperCase();
  } else {
    return ctx.reply("Invalid timeframe", Extra.inReplyTo(messageId));
  }
  if (message[1]) {
    if (checkValidSBDType(message[1])) {
      type = message[1];
    } else {
      return ctx.reply("Invalid type", Extra.inReplyTo(messageId));
    }
  } else {
    type = "acc.3";
  }

  const ad = type.split(".")[0].toUpperCase();
  const number = type.split(".")[1];

  // Generate a unique job ID
  const jobId = uuid.v4();

  // Check if the result already exists in Redis
  checkRedisCache(`${tf}:${ad}:${number}`).then(result => {
    if (result) {
      // If the result exists, send it to the user
      sendHTMLMessage(ctx, result);
    } else {

      sendHTMLMessage(ctx, "Mohon ditunggu selama 1 menit. Screener sedang diproses")

      const dataToStore = {
        chatId: ctx.message.chat.id,
        messageId: ctx.message.message_id
      };

      setRedisWithTTL(jobId, JSON.stringify(dataToStore));

      // If the result doesn't exist, publish a message to start the computation
      publish('start_computation', JSON.stringify({
        jobId,
        tf,
        ad,
        number,
      }));
    }
  });
});

// Subscribe to the channel that the worker will publish to when the computation is done
subscribe('computation_done');

onMessage((channel, message) => {
  if (channel === 'computation_done') {
    const { jobId, result } = JSON.parse(message);

    // Get the data from Redis and convert it back to an object
    checkRedisCache(jobId).then(data => {
      if (data) {
        data = JSON.parse(data);

        // Construct a new ctx-like object
        const newCtx = {
          chat: { id: data.chatId },
          message: { message_id: data.messageId }
        };

        // Send the result to the user
        // Send the result to the user
        bot.telegram.sendMessage(newCtx.chat.id, result, {
          reply_to_message_id: newCtx.message.message_id,
          parse_mode: 'HTML'
        });

        // Remove the data from Redis
        deleteRedis(jobId);
      }
    });
  }
});


bot.command("ow", (ctx) => {
  const message = formatMessageInput(ctx);
  if (message.length == 1 && !message[0]) {
    let textMessage;
    textMessage = "<b>Kepemilikan Data Saham</b>\n";
    textMessage = textMessage + "<code>";
    textMessage = textMessage + "Command: /ow [kode_saham] [periode]\n";
    textMessage = textMessage + "Format periode: MMYY (0321)\n";
    textMessage =
      textMessage +
      "Jika periode kosong, maka akan mengambil data 1 bulan terakhir\n";
    textMessage = textMessage + "Contoh: /ow TLKM 0121\n";
    textMessage =
      textMessage + "Data yang tersedia hingga 1 tahun terakhir</code>";
    return ctx.replyWithHTML(textMessage);
  }
  const sym = message[0].toUpperCase();
  let period =
    message[1] == undefined
      ? moment().subtract(1, "month").format("MMMYYYY").toLowerCase()
      : moment(message[1].toUpperCase(), "MMYY")
        .format("MMMYYYY")
        .toLowerCase();


  const path = Path.resolve(
    "C://Users//Administrator//Documents//OW",
    "ow_" + sym + "_" + period + ".png"
  );

  checkRedisCache(redisOWKey(sym + period)).then((cache) => {
    if (cache != null) {
      return setTimeout(() => {
        ctx.telegram
          .sendPhoto(
            ctx.message.chat.id,
            { source: fs.ReadStream(path) },
            Extra.caption(
              "<b>Kepemilikan Saham kurang dari 5% (Masyarakat) " +
              sym +
              " Per " +
              moment(period, "MMMYYYY").format("MMM YYYY") +
              "</b>"
            )
              .HTML()
              .inReplyTo(ctx.message.message_id)
          )
          .catch((err) => {
            console.error(err);
          });
      }, 150);
    }

    return MongoClient.connect(url, (er, client) => {
      const db = client.db(dbName);
      db.collection("ownership").findOne({ ticker: sym }, (err, res) => {
        if (!res) {
          return;
        }

        if (
          !res.data.hasOwnProperty(period) &&
          moment().diff(moment(period, "MMMYYYY"), "month") == 1
        ) {
          period = moment(period, "MMMYYYY")
            .subtract(1, "month")
            .format("MMMYYYY")
            .toLowerCase();
        }
        let final = [];

        const data = res.data[period];
        _.forEach(data, (val, key) => {
          final.push(
            calculateOwnership(val, data.local_total, data.foreign_total)
          );
        });

        const chartData = {
          labels: [
            "Asuransi",
            "Perusahaan",
            "Dana Pensiun",
            "Perbankan",
            "Individu",
            "Reksadana",
            "Sekuritas",
            "Yayasan",
            "Lainnya",
          ],
          datasets: [
            {
              label: "Lokal",
              minBarLength: 10,
              data: final.slice(0, 9),
              backgroundColor: "rgb(0, 200, 195)",
              borderColor: "rgb(255, 255, 255)",
            },
            {
              label: "Asing",
              minBarLength: 10,
              data: final.slice(10, 19),
              backgroundColor: "rgb(255, 105, 180)",
              borderColor: "rgb(255, 255, 255)",
            },
          ],
        };

        const configuration = {
          type: "bar",
          data: chartData,
          options: {
            plugins: {
              datalabels: {
                formatter: function (value, context) {
                  return value + "%";
                },
                align: "top",
                anchor: "end",
                clapm: true,
                offset: 15,
              },
            },
            layouts: {
              padding: {
                bottom: 50,
              },
            },
            title: {
              display: true,
              padding: 50,
              text:
                "Kepemilikan Saham di bawah 5% " +
                sym +
                " Per " +
                moment(period, "MMMYYYY").format("MMM YYYY"),
            },
            legend: {
              padding: 25,
            },
            scales: {
              yAxes: [
                {
                  ticks: {
                    beginAtZero: true,
                    callback: (value) => value + "%",
                  },
                  gridLines: {
                    display: true,
                    color: "rgba(255, 255, 255, 0.3)",
                    zeroLineColor: "rgba(255, 255, 255, 0.8)",
                    zeroLineWidth: 4,
                  },
                  scaleLabel: {
                    display: true,
                    labelString: "% Kepemilikan",
                    fontSize: 30,
                    fontColor: "yellow",
                    padding: 25,
                  },
                },
              ],
              xAxes: [
                {
                  gridLines: {
                    display: true,
                    zeroLineColor: "rgba(255, 255, 255, 0.8)",
                    zeroLineWidth: 4,
                  },
                  scaleLabel: {
                    display: true,
                    labelString: "Jenis Kepemilikan",
                    fontSize: 30,
                    fontColor: "yellow",
                    padding: 25,
                  },
                },
              ],
            },
          },
        };

        chartJSNodeCanvas
          .renderToDataURL(configuration, "image/png")
          .then((res) => {
            const imageFile = res.replace(/^data:image\/png;base64,/, "");
            fs.writeFile(path, imageFile, "base64", (err) => {
              if (err) console.error(err);

              jimp.read(path, (er, file) => {
                jimp.read("t4c.png", (err, logo) => {
                  const finalPath = Path.resolve(
                    "C://Users//Administrator//Documents//OW",
                    "ow_" + sym + "_" + period + ".png"
                  );
                  file
                    .composite(logo.scaleToFit(1920, jimp.AUTO), 0, -480, {
                      opacitySource: 0.2,
                    })
                    .quality(100)
                    .writeAsync(path)
                    .then((join) => {
                      jimp.read(join, (err, final) => {
                        if (err) console.error(err);
                        ctx.telegram.sendChatAction(
                          ctx.message.chat.id,
                          "upload_photo"
                        );

                        // saveToRedisCacheOW(redisOWKey(sym + period), "ow");
                        setTimeout(() => {
                          return ctx.telegram
                            .sendPhoto(
                              ctx.message.chat.id,
                              { source: fs.ReadStream(finalPath) },
                              Extra.caption(
                                "<b>Kepemilikan Saham kurang dari 5% (Masyarakat) " +
                                sym +
                                " Per " +
                                moment(period, "MMMYYYY").format("MMM YYYY") +
                                "</b>"
                              )
                                .HTML()
                                .inReplyTo(ctx.message.message_id)
                            )
                            .catch((err) => {
                              console.error(err);
                            });
                        }, 150);
                      });
                    });
                });
              });
            });
          });
      });
    });
  });
});

bot.command("scrow", (ctx) => {
  MongoClient.connect(url, (er, client) => {
    const db = client.db(dbName);
    const period = moment()
      .subtract(1, "month")
      .format("MMMYYYY")
      .toLowerCase();
    const prevPeriod = moment()
      .subtract(2, "month")
      .format("MMMYYYY")
      .toLowerCase();
    db.collection("ownership")
      .find()
      .toArray((err, res) => {
        if (res.length > 0) {
          let textMessage = "";

          _.forEach(res, (val, key) => {
            const latestOwdata = val.data[period];
            const prevOwdata = val.data[prevPeriod];
            if (latestOwdata != undefined && prevOwdata != undefined) {
              const localIdOwnership = calculateOwnership(
                latestOwdata.local_id,
                latestOwdata.local_total,
                latestOwdata.foreign_total
              );

              const localIdPrevOwnership = calculateOwnership(
                prevOwdata.local_id,
                prevOwdata.local_total,
                prevOwdata.foreign_total
              );

              if (localIdOwnership <= localIdPrevOwnership) {
                textMessage = `${textMessage}${val.ticker} (${localIdOwnership}%)\n`;
              }
            }
          });

          const title1 =
            "<b>Kepemilikan Saham oleh Individu Domestik yang Berkurang (1/2)</b>\n\n";
          const title2 =
            "<b>Kepemilikan Saham oleh Individu Domestik yang Berkurang (2/2)</b>\n\n";
          const message1 = `${title1}${textMessage.substring(0, 1999)}`;
          const message2 = `${title2}${textMessage.substring(1999, 5000)}`;

          ctx
            .replyWithHTML(message1, Extra.inReplyTo(ctx.message.message_id))
            .then(() => {
              ctx.replyWithHTML(
                message2,
                Extra.inReplyTo(ctx.message.message_id)
              );
            });
        }
      });
  });
});

bot.command("insider", (ctx) => {
  const message = formatMessageInput(ctx);
  const ticker = message[0].toUpperCase();

  if (message[0] == undefined) {
    return;
  }

  Promise.resolve(getInsiderData(ticker)).then((res) => {
    return sendHTMLMessage(ctx, res);
  });
});

bot.command("agenda", (ctx) => {
  getCalendarData().then((result) => {
    let textMessage = `<b>------ Today Agenda || ${moment().format(
      "MMM Do, YYYY (dddd)"
    )} ------</b>\n`;
    if (result.dividend.length > 0) {
      textMessage = textMessage + "\n<b>Dividend</b>\n";
      textMessage = textMessage + "<i>";
      result.dividend.map((rd) => {
        textMessage =
          textMessage +
          "\n" +
          rd.company_symbol +
          " (Rp " +
          rd.dividend_value +
          "/saham)";
        textMessage = textMessage + " - " + checkDividendStatus(rd);
      });
      textMessage = textMessage + "</i>\n";
    }

    if (result.economic.length > 0) {
      textMessage = textMessage + "\n<b>Economic</b>\n";
      textMessage = textMessage + "<i>";
      result.economic.map((re) => {
        textMessage =
          textMessage + `\n${re.econcal_item} (${re.econcal_month})`;
        textMessage =
          textMessage +
          `\n${moment(re.econcal_time, "H:mm:ss")
            .add(7, "hours")
            .format("H:mm")}`;
        textMessage =
          textMessage +
          `\nPrevious: ${re.econcal_previous}   |  Forecast: ${re.econcal_forecast}\n`;
      });
      textMessage = textMessage + "</i>\n";
    }

    if (result.stocksplit.length > 0) {
      textMessage = textMessage + "\n<b>Stock Split</b>";
      textMessage = textMessage + "<i>";
      result.stocksplit.map((rs) => {
        textMessage =
          textMessage +
          `\n\n${rs.company_symbol}\nRatio (Old:New): ${rs.stocksplit_old}:${rs.stocksplit_new}`;
        textMessage = textMessage =
          textMessage + `\nStatus: ${checkStockSplitStatus(rs)}`;
      });
      textMessage = textMessage + "</i>\n";
    }

    if (result.stock_reverse.length > 0) {
    }

    if (result.rightissue.length > 0) {
      textMessage = textMessage + "\n<b>Right Issue</b>";
      textMessage = textMessage + "<i>";
      result.rightissue.map((ri) => {
        textMessage =
          textMessage +
          `\n\n${ri.company_symbol}\nRatio (Old:New): ${ri.rightissue_old}:${ri.rightissue_new}`;
        textMessage = textMessage + `\nExercise Price: ${ri.rightissue_price}`;
        textMessage =
          textMessage +
          `\nTrading Period: ${formatDateWithShortMonth(
            ri.rightissue_trading_start
          )} - ${formatDateWithShortMonth(ri.rightissue_trading_end)}`;
        textMessage = textMessage + `\nStatus: ${checkRightIssueStatus(ri)}`;
      });
      textMessage = textMessage + "</i>\n";
    }

    if (result.warrant.length > 0) {
      textMessage = textMessage + "\n<b>Warrant</b>\n";
      textMessage = textMessage + "<i>";
      result.warrant.map((rw) => {
        textMessage =
          textMessage +
          `\n${rw.company_symbol}\nExercise Price: ${rw.wrant_exc_price
          }\nStatus: ${checkWarrantStatus(rw)}`;
      });
      textMessage = textMessage + "</i>";
    }

    if (result.bonus.length > 0) {
    }

    if (result.tender.length > 0) {
    }

    if (result.rups.length > 0) {
      textMessage = textMessage + "\n<b>RUPS</b>\n";
      textMessage = textMessage + "<i>";
      result.rups.map((rr) => {
        textMessage = textMessage + "\n" + rr.company_symbol;
        textMessage =
          textMessage + "\nTime: " + moment(rr.rups_date).format("HH:mm");
        textMessage = textMessage + "\nVenue: " + rr.rups_venue + "\n";
      });
      textMessage = textMessage + "</i>";
    }

    if (result.pubex.length > 0) {
      textMessage = textMessage + "\n<b>Pubex</b>\n";
      textMessage = textMessage + "<i>";
      result.pubex.map((rp) => {
        textMessage = textMessage + "\n" + rp.company_symbol;
        textMessage =
          textMessage +
          "\nTime: " +
          moment(rp.puexp_time, "HH:mm:ss").format("HH:mm") +
          "";
        textMessage = textMessage + "\nVenue: " + rp.puexp_venue + "\n";
      });
      textMessage = textMessage + "</i>";
    }

    if (result.ipo.length > 0) {
      textMessage = textMessage + "\n<b>IPO</b>\n";
      textMessage = textMessage + "<i>";
      result.ipo.map((ro) => {
        const detail = ro.ipo_data_detail;
        textMessage =
          textMessage +
          `\n${ro.company_name}\nPrice: ${detail.price}\nShares: ${detail.shares}`;
      });
      textMessage = textMessage + "</i>";
    }

    sendHTMLMessage(ctx, textMessage.toString());
  });

  const dividend = dividendData().then((res) => {
    let textMessage = "\n<b>Dividend</b>\n";
    textMessage = textMessage + "<i>";
    res.map((r) => {
      if (r != undefined) {
        textMessage =
          textMessage + `\n${r.ticker} (Rp ${r.value}/saham) - ${r.status}`;
      }
    });
    return textMessage + "</i>";
  });

  const stocksplit = stockSplitData().then((res) => {
    let textMessage = "\n\n<b>Stock Split</b>\n";
    textMessage = textMessage + "<i>";
    res.map((r) => {
      if (r != undefined) {
        textMessage =
          textMessage + `\n${r.ticker}\nRatio (Old:New): ${r.ratio}`;
        textMessage = textMessage + `\nStatus: ${r.status}`;
      }
    });
    return textMessage + "</i>";
  });

  const rightIssue = rightIssueData().then((res) => {
    let textMessage = "\n\n<b>Right Issue</b>\n";
    textMessage = textMessage + "<i>";
    res.map((r) => {
      if (r != undefined) {
        textMessage =
          textMessage + `\n${r.ticker}\nRatio (Old:New): ${r.ratio}`;
        textMessage = textMessage + `\nExercise Price: ${r.ex_price}`;
        textMessage = textMessage + `\nCum Date: ${r.cumdate}`;
        textMessage = textMessage + `\nEx Date: ${r.exdate}`;
        textMessage = textMessage + `\nTrading Period: ${r.trading_period}`;
        textMessage = textMessage + `\nStatus: ${r.status}\n`;
      }
    });
    return textMessage + "</i>";
  });

  const ipo = ipoData().then((res) => {
    let textMessage = "\n<b>IPO</b>\n";
    textMessage = textMessage + "<i>";
    res.map((r) => {
      textMessage =
        textMessage +
        `\n${r.ticker}\nStatus: ${r.status}\nListing Date: ${r.listing_date}\n`;
    });
    return textMessage + "</i>";
  });

  const rups = rupsData().then((res) => {
    let textMessage = "\n<b>RUPS</b>\n";
    textMessage = textMessage + "<i>";
    res.map((r) => {
      textMessage =
        textMessage +
        `\n${r.ticker}\nDate & Time: ${r.date_time}\nVenue: ${r.venue}\n`;
    });
    return textMessage + "</i>";
  });

  const promises = [dividend, stocksplit, rightIssue, ipo, rups];

  Promise.all(promises).then((res) => {
    const message =
      `\n\n<b>------ Upcoming Agenda ------</b>\n` +
      res[0] +
      res[1] +
      res[2] +
      res[3] +
      res[4];
    sendHTMLMessage(ctx, message.toString());
  });
});

// bot.command("md", (ctx) => {
//   const { marketdata } = require("./marketdata/index");
//   getChatMember(ctx).then((res) => {
//     if (isOwner(res)) {
//       let today;

//       if (moment().day() == 6) {
//         today = moment().add(2, "days").format("MMM Do, YYYY (dddd)");
//       } else if (moment().day() == 0) {
//         today = moment().add(1, "days").format("MMM Do, YYYY (dddd)");
//       } else {
//         today = moment().format("MMM Do, YYYY (dddd)");
//       }

//       checkRedisCache(redisMDKey(moment().format("YYYYMMDD"))).then((cache) => {
//         if (cache) {
//           return sendHTMLMessage(ctx, cache);
//         }

//         marketdata.then((res) => {
//           const title = `<b>${today}</b>\n\nDear investor, below are worldwide market data\n\n`;
//           const footer = `<b>By Trade4Cuan (https://t.me/tradeforcuan)</b>\n<i>Source: Investing, Bloomberg, Tradingview, SunSirs, WorldGovernmentBonds</i>`;
//           let textMessage = "";

//           for (i = 0; i < res.length; i++) {
//             textMessage = textMessage + res[i];
//           }

//           const message = title + textMessage + footer;

//           saveToRedisCacheMD(redisMDKey(moment().format("YYYYMMDD")), message);
//           return sendHTMLMessage(ctx, message);
//         });
//       });
//     }

//     return;
//   });
// });

// bot.command("index", (ctx) => {
//   const { indices } = require("./marketdata/indices");

//   const message = formatMessageInput(ctx);
//   if (message[0] == "") {
//     const textMessage = `<b>Pergerakan Indeks per Regional</b>\n\n<i>Regional yang tersedia: ASIA, US, EU</i>
//       Contoh request: <code>/index ASIA</code>`;

//     return ctx.replyWithHTML(textMessage);
//   }

//   const allowedRegions = ["ASIA", "US", "EU"];
//   const region = message[0].toUpperCase();
//   if (!allowedRegions.includes(region)) {
//     return ctx.replyWithHTML(`<b>Regional yang tersedia: ASIA, US, EU</b>`);
//   }

//   const path = Path.resolve(
//     "C://Users//Administrator//Documents//MarketData",
//     "indices_" + region + ".png"
//   );
//   const today = moment().format("MMM Do, YYYY");

//   checkRedisCache(redisIndexKey(region)).then((cache) => {
//     if (cache) {
//       ctx.telegram.sendChatAction(ctx.message.chat.id, "upload_photo");
//       return ctx.replyWithPhoto(
//         { source: fs.ReadStream(path) },
//         Extra.caption(`${region} INDEXES - ${today}`)
//       );
//     }

//     indices(region).then(() => {
//       saveToRedisCacheIndex(redisIndexKey(region));
//       ctx.telegram.sendChatAction(ctx.message.chat.id, "upload_photo");
//       return setTimeout(() => {
//         return ctx.replyWithPhoto(
//           { source: fs.ReadStream(path) },
//           Extra.caption(`${region} INDEXES - ${today}`)
//         );
//       }, 150);
//     });
//   });
// });

// bot.command("comm", (ctx) => {
//   const { commodities } = require("./marketdata/commodities");
//   const path = Path.resolve(
//     "C://Users//Administrator//Documents//MarketData",
//     "comm_" + moment().format("YYYYMMDD") + ".png"
//   );
//   const today = moment().format("MMM Do, YYYY");

//   checkRedisCache(redisCommKey()).then((cache) => {
//     if (cache) {
//       ctx.telegram.sendChatAction(ctx.message.chat.id, "upload_photo");
//       return ctx.replyWithPhoto(
//         { source: fs.ReadStream(path) },
//         Extra.caption(`COMMODITIES - ${today}`)
//       );
//     }

//     commodities.then(() => {
//       saveToRedisCacheComm(redisCommKey());
//       ctx.telegram.sendChatAction(ctx.message.chat.id, "upload_photo");
//       return setTimeout(() => {
//         return ctx.replyWithPhoto(
//           { source: fs.ReadStream(path) },
//           Extra.caption(`COMMODITIES - ${today}`)
//         );
//       }, 150);
//     });
//   });
// });

// bot.command("comm@t4c_bot", (ctx) => {
//   const { commodities } = require("./marketdata/commodities");
//   const path = Path.resolve(
//     "C://Users//Administrator//Documents//MarketData",
//     "comm_" + moment().format("YYYYMMDD") + ".png"
//   );
//   const today = moment().format("MMM Do, YYYY");

//   checkRedisCache(redisCommKey()).then((cache) => {
//     if (cache) {
//       ctx.telegram.sendChatAction(ctx.message.chat.id, "upload_photo");
//       return ctx.replyWithPhoto(
//         { source: fs.ReadStream(path) },
//         Extra.caption(`COMMODITIES - ${today}`)
//       );
//     }

//     commodities.then(() => {
//       saveToRedisCacheComm(redisCommKey());
//       ctx.telegram.sendChatAction(ctx.message.chat.id, "upload_photo");
//       return setTimeout(() => {
//         return ctx.replyWithPhoto(
//           { source: fs.ReadStream(path) },
//           Extra.caption(`COMMODITIES - ${today}`)
//         );
//       }, 150);
//     });
//   });
// });

bot.command("scr", (ctx) => {
  const msg = ctx.message.text
    .substr(ctx.message.entities[0].length + 1, ctx.message.text.length)
    .split(" ")[0];
  const type = msg.toUpperCase();

  const fileDate = moment().format("DD/MM/YYYY");
  let exportResult = "";
  const regex = /[^\\]*$/;
  let outputPath;
  let caption;
  let fileType = "html";
  if (type == "SS") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\StochScreener.html";
    caption = `(${fileDate}) - Stochastic (5,3,3) Status`;
  } else if (type == "GATOR") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\GatorMFI.html";
    caption = `(${fileDate}) - AlligatorWM3`;
  } else if (type == "GATOR_H4") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\GatorMFI_H4.html";
    caption = `(${fileDate}) - Alligator WM3 - H4`;
  } else if (type == "GATOR_H1") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\GatorMFI_H1.html";
    caption = `(${fileDate}) - Alligator WM3 - H1`;
  } else if (type == "JJS") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\JajanSore.html";
    caption = `(${fileDate}) - Jajan Sore`;
  } else if (type == "MAT") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\MATrade.html";
    caption = `(${fileDate}) - MA Trade`;
  } else if (type == "BMA") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\MAAligned.html";
    caption = `(${fileDate}) - Bullish MA Formation`;
  } else if (type == "BRR") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\BullishReversalRSI.html";
    caption = `(${fileDate}) - Bullish Reversal RSI`;
  } else if (type == "ADF") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\AccDistForeign.html";
    caption = `(${fileDate}) - Accumulation / Distribution Foreign`;
  } else if (type == "RMA") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\ReboundMA.html";
    caption = `(${fileDate}) - Rebound MA`;
  } else if (type == "VS1") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\Vol_Spike_Up.html";
    caption = `(${fileDate}) - Volume Spike Up`;
  } else if (type == "BOW" && ctx.message.chat.id.toString() === "-520085542") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\BuyOnWaterfall.html";
    caption = `(${fileDate}) - Buy On Waterfall`;
  } else if (type == "VOL4") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\Vol_4_Times.html";
    caption = `(${fileDate}) - VOL 4 Times`;
  } else if (type == "HMA7") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\HMA7.html";
    caption = `(${fileDate}) - HMA7`;
  } else if (type == "ONS") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\ONS_KOKO.html";
    caption = `(${fileDate}) - ONS KOKOLATO`;
  } else if (type == "CH") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\CloseHigh_KOKO.html";
    caption = `(${fileDate}) - Close High KOKOLATO`;
  } else if (type == "MACD") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\MACD.html";
    caption = `(${fileDate}) - MACD`;
  } else if (type == "PVU") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\PriceVolUp.html";
    caption = `(${fileDate}) - Price & Volume Up`;
  } else if (type == "PVD") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\PriceVolDown.html";
    caption = `(${fileDate}) - Price & Volume Down`;
  } else if (type == "tickers") {
    exportResult = "C:\\Users\\Administrator\\Documents\\AmiExport\\tickers.csv";
    caption = `Tickers`
    fileType = 'csv';
  }

  outputPath = exportResult.match(regex)[0].split(".")[0];
  // return sendScreener(exportResult, caption, outputPath, ctx);
  return ctx.telegram.sendDocument(
    ctx.message.chat.id,
    {
      source: fs.ReadStream(exportResult),
      filename: `${caption}.${fileType}`,
    },
    Extra.inReplyTo(ctx.message.message_id)
  );
});


bot.command("cabe", (ctx) => {
  doc.loadInfo().then(() => {
    const sheet = doc.sheetsByIndex[0];
    sheet.loadCells("A:K");
    sheet.loadHeaderRow(1);
    sheet.getRows().then((rows) => {
      const result = rows
        .filter((r) => checkPeriode(r["Periode"]))
        .map((r) => ({
          code: r["Program/Kode"],
          periode: r["Periode"],
          payment_method: r["Payment Method"],
          merchant: r["Merchant"],
          optimal: r["Bayar Optimal"],
          nominal: r["Nominal"],
          format: r["Format"],
          gross_yield: r["Gross Yield"],
          quota: r["Kuota"],
          notes: r["Notes"],
        }));
      htmlTable(result);
      outputPath = "cabe";
      exportResult = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\build.html";
      caption = "Daftar Garapan Cabe";
      return ctx.telegram.sendDocument(
        ctx.message.chat.id,
        {
          source: fs.ReadStream(exportResult),
          filename: `${caption}.html`,
        },
        Extra.inReplyTo(ctx.message.message_id)
      );
    });
  });
});

bot.command("tcabe", (ctx) => {
  doc.loadInfo().then(() => {
    const sheet = doc.sheetsByIndex[0];
    sheet.loadCells("A:K");
    sheet.loadHeaderRow(1);
    sheet.getRows().then((rows) => {
      const result = rows
        .filter((r) => checkPeriode(r["Periode"]) && checkValidCabe(r["Notes"]))
        .map((r) => ({
          code: r["Program/Kode"],
          periode: r["Periode"],
          payment_method: r["Payment Method"],
          merchant: r["Merchant"],
          optimal: r["Bayar Optimal"],
          nominal: r["Nominal"],
          format: r["Format"],
          gross_yield: r["Gross Yield"],
          quota: r["Kuota"],
          notes: r["Notes"],
        }));
      htmlTable(result);
      outputPath = "cabe";
      exportResult = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\build.html";
      caption = "Daftar Garapan Cabe per Hari Ini";
      return ctx.telegram.sendDocument(
        ctx.message.chat.id,
        {
          source: fs.ReadStream(exportResult),
          filename: `${caption}.html`,
        },
        Extra.inReplyTo(ctx.message.message_id)
      );
    });
  });
});

bot.command("feekr", (ctx) => {
  const textMessage = `
  <b>Rate & Rules Lapak KangRitel</b>
<b><i>
Lapak Biru: https://www.blibli.com/merchant/trade4cuan/TRN-70025
Lapak Ijo: https://www.tokopedia.com/kangritel
</i></b>
<i>Fee Ijo: 3.25%
Fee Biru: 4.5%
</i>
Selesai checkout, mohon PM @kangritel
Lapak Ijo, bisa juga dengan chat di toko
Lapak Biru, screenshot saja BARCODE dari apps nya untuk ordernya
Atau opsi lain silahkan kirimkan pesan dengan format
<code>[KODE SETTLEMENT] <spasi> [NAMA PEMESAN] <spasi> [NOMINAL (TIDAK PERLU TITIK / KOMA)]</code>

Silahkan haka dengan <b>yield minimal 5% utk Ijo dan 6% untuk Biru</b>

Lapak Biru ikut jadwal settlement untuk menghindari kasus dana sangkut <b>(3 HK)</b>
Lapak Ijo lgsg cair di <b>hari kerja</b>
Weekend biasa tergantung admin lapak ijo
Paling lama biasa 3HK

Pilihan bank usahakan antar <b>BCA / BMRI / Niaga / DBS / Seabank / Neo</b>

Jika sudah selesai belanja, jangan lupa drop FR nya
Tengs dan salam cabe 🙏
  `;
  return sendHTMLMessage(ctx, textMessage);
});

bot.command("feecfas", (ctx) => {
  const textMessage = `
  <b>Rules Belanja Lapak Ijo
Jastip Addiction
https://tokopedia.link/jastipaddiction</b>

<i>
1. Nominal kembali = Nominal barang belanja - Fee 3%
(dihitung per order dan tidak akumulatif)
PM ya setelah order utk konfirmasi

2. Ongkir & Asuransi tidak termasuk dalam nominal belanja 

3. 1 akun, 1 HP, 1 simcard kuota/ 1 sumber wifi, 1 alamat, 1 metode bayar agar tidak ATW

4. Kl ada alamat di Surabaya (supaya ongkir lebih murah)

5. Disarankan pengiriman reguler via JNT / AnterAja 

7. Pesanan bs diselesaikan 6 jam setelah pesanan sampai

8. Trf balik dilakukan setelah pesanan selesai

9. Bisa digunakan untuk coin/point

10. Untuk CB resiko ditanggung pembeli (ada kemungkinan CB bs dibatalkan oleh tokped)
</i>

<b>Rules Belanja Lapak Biru
Jastip Addiction
https://blibli.app.link/Mg41WI7Rmpb</b>

<i>
1. Nominal kembali = Nominal barang belanja - Fee 3.5%

(dihitung per order dan tidak akumulatif)

2. Ongkir, asuransi tidak termasuk dalam nominal belanja

3. Setelah order, mohon kirimkan nama pemesan, nominal dan 16 digit kode settlement 

4. Trf balik akan dilakukan setelah dana masuk ke akun seller (kurang lebih 3HK)

5. Untuk cabe resiko ditanggung pembeli
</i>

Thank you 😁🙏
`;
  return sendHTMLMessage(ctx, textMessage);
});

const sendQrGarapan = (ctx, name, caption) => {
  let qrSrc = "";
  if (name === "KR") {
    qrSrc = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\garapan\\kr.jpg";
  } else if (name === "DIKA") {
    qrSrc = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\garapan\\dika.jpg";
  } else if (name === "SANDY") {
    qrSrc = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\garapan\\sandy.png";
  } else if (name === "WILBERT") {
    qrSrc = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\garapan\\wilbert.png";
  } else if (name === "HERRY") {
    qrSrc = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\garapan\\herry.png";
  } else if (name === "VIVI") {
    qrSrc = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\garapan\\vivi.png";
  } else if (name === "RAHMAD") {
    qrSrc = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\garapan\\rahmad.png";
  } else if (name === "JUL") {
    qrSrc = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\garapan\\jul.jpg";
  } else if (name == "FRIDA") {
    qrSrc = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\garapan\\frida.jpg";
  } else if (name == "TRISMAN") {
    qrSrc = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\garapan\\trisman.jpg";
  }

  return ctx.replyWithPhoto(
    {
      source: fs.ReadStream(qrSrc),
    },
    Extra.caption(caption)
  );
};

bot.command("qr", (ctx) => {
  const message = formatMessageInput(ctx);
  const name = message[0].toUpperCase();

  return sendQrGarapan(ctx, name, `QR BW - ${name}`);
});

bot.command("qrsched", (ctx) => {
  const message = formatMessageInput(ctx);
  const name = message[0].toUpperCase();
  const weekDayName = moment().format("dddd");

  MongoClient.connect(url, (er, client) => {
    const db = client.db(dbName);
    db.collection("garapan_qr_sched")
      .find({})
      .toArray((err, res) => {
        res.forEach((r) => {
          const toko = r.toko.toUpperCase();
          const schedules = r.schedule;
          schedules.forEach((s) => {
            const regex = new RegExp(s.user.join("|"), "i");
            if (s.day === weekDayName && regex.test(name)) {
              return sendQrGarapan(
                ctx,
                toko,
                `Jadwal anda hari ini scan QR toko ${toko}`
              );
            }
          });
        });
      });
  });
});

// bot.command("cs", (ctx) => {
//   const msg = ctx.message.text
//     .substr(ctx.message.entities[0].length + 1, ctx.message.text.length)
//     .split(" ")[0];
//   const type = msg.toUpperCase();

//   if (type == "ALL") {
//     exportResult = "C:\\Users\\Administrator\\Documents\\AmiExportCSALL.html";
// ctx.telegram.sendDocument(
//   ctx.message.chat.id,
//   {
//     source: fs.ReadStream(exportResult),
//     filename: "All Stocks.html",
//   },
//   Extra.inReplyTo(ctx.message.message_id)
// );
//   } else if (type == "BSORE") {
//     exportResult = "C:\\Users\\Administrator\\Documents\\AmiExportCSBSORE.html";
//     ctx.telegram.sendDocument(
//       ctx.message.chat.id,
//       {
//         source: fs.ReadStream(exportResult),
//         filename: "Belanja Sore.html",
//       },
//       Extra.inReplyTo(ctx.message.message_id)
//     );
//   } else if (type == "BULL") {
//     exportResult = "C:\\Users\\Administrator\\Documents\\AmiExportCSBULL.html";
//     ctx.telegram.sendDocument(
//       ctx.message.chat.id,
//       {
//         source: fs.ReadStream(exportResult),
//         filename: "Bull Engulfing Harami.html",
//       },
//       Extra.inReplyTo(ctx.message.message_id)
//     );
//   } else if (type == "CROSS") {
//     exportResult = "C:\\Users\\Administrator\\Documents\\AmiExportCSCROSS.html";
//     ctx.telegram.sendDocument(
//       ctx.message.chat.id,
//       {
//         source: fs.ReadStream(exportResult),
//         filename: "Golden Cross.html",
//       },
//       Extra.inReplyTo(ctx.message.message_id)
//     );
//   } else if (type == "STOCHEMA") {
//     exportResult = "C:\\Users\\Administrator\\Documents\\AmiExportCSSTOCHEMA.html";
//     ctx.telegram.sendDocument(
//       ctx.message.chat.id,
//       {
//         source: fs.ReadStream(exportResult),
//         filename: "Stoch EMA 20/60.html",
//       },
//       Extra.inReplyTo(ctx.message.message_id)
//     );
//   } else if (type == "TRENDING") {
//     exportResult = "C:\\Users\\Administrator\\Documents\\AmiExportCSTRENDING.html";
//     ctx.telegram.sendDocument(
//       ctx.message.chat.id,
//       {
//         source: fs.ReadStream(exportResult),
//         filename: "Trending Stocks.html",
//       },
//       Extra.inReplyTo(ctx.message.message_id)
//     );
//   }
// });

// bot.command("cshelp", (ctx) => {
//   const helpMessage = `<b>==== Bot Command for Celoteh Saham ====</b>
//     <code>
//     /cschart [kode_saham] [timeframe] - Untuk Charting
//     Timeframe tersedia 5M, 15M, 30M, H, D, W, N
//     Jika tidak menyertakan timeframe, default adalah daily
//     Contoh:
//     - /cschart TLKM 30M
//     - /cschart TLKM
//     </code>
//     <i>Screening Command</i>
//     <code>
//     /cs [tipe_screener]

//     Tipe Screener:
//     1. all - All Stocks
//     2. bsore - Belanja Sore
//     3. bull - Bull Engulfing Harami
//     4. cross - Golden Cross
//     5. stochema - Stoch EMA 20/60
//     6. trending - Trending Stocks

//     Contoh: /cs all
//     </code>

//     <i>Jika menemukan masalah terkait chart / command, bisa hubungi @kangritel</i>
//     `;
//   return sendHTMLMessage(ctx, helpMessage);
// });

cron.schedule("1 0 * * *", () => {
  flushRedis();
});

// cron.schedule("55 23,07,09,11,18,20 1-9 5 *", () => {
//   return axios({
//     method: "POST",
//     url: `https://api.telegram.org/bot${token}/sendMessage`,
//     data: {
//       chat_id: "229886930",
//       text: "Garap Cashback",
//     },
//   });
// });

// bot.telegram.deleteWebhook();
bot.startPolling();
// bot.launch({
//     webhook: {
//         domain: 'http://6ea84746cbf9.ngrok.io',
//         port: 3000
//     }
// })
