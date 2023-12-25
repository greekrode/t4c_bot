const Promise = require("bluebird");
const fs = require("fs");
const { Extra } = require("telegraf");
const exec = require("child_process").exec;
const moment = require("moment");
const htmlToImage = require("node-html-to-image");

const { basicTAInfo } = require("../tradingview/index");
const { watchFileExist, fsReadFileHtml } = require("./function");
const {
  redisChartKey,
  saveToRedisCache,
  getUserData,
  checkRedisCache,
} = require("../helper/redis");
const { checkFAAccess, checkTimeFrame } = require("../helper/validator");
const {
  formatMessageInput,
  formatTimeframeInput,
} = require("../helper/formatter");
const { processor } = require("../helper/function");
const { jpegVersion } = require("canvas");

let queueHTML = [];
let inUseQueueHTML = [];
let queueMG = [];
let inUseQueueMG = [];

const _sendHTMLMessages = () => {
  // if we are already sending messages from the queue, or
  // the queue is empty, stop
  if (inUseQueueHTML.length || !queueHTML.length) return;

  inUseQueueHTML = queueHTML;
  queueHTML = [];
  Promise.mapSeries(inUseQueueHTML, function (request) {
    var resolve = request.resolve;
    var reject = request.reject;
    var ctx = request.ctx;

    return ctx.telegram
      .sendMessage(
        request.chatId,
        request.message,
        Extra.HTML().inReplyTo(request.messageId)
      )
      .then(resolve)
      .catch(reject);
  }).then(function () {
    inUseQueueHTML = [];
    _sendHTMLMessages();
  });
};

const sendHTMLMessage = (ctx, message) => {
  var resolve, reject;
  var promise = new Promise(function (promiseResolve, promiseReject) {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  const chatId = ctx.message
    ? ctx.message.chat.id
    : ctx.update.callback_query.message.chat.id;
  const messageId = ctx.message
    ? ctx.message.message_id
    : ctx.update.callback_query.message.message_id;
  ctx.telegram.sendChatAction(chatId, "typing");
  queueHTML.push({ ctx, chatId, messageId, message, resolve, reject });
  process.nextTick(_sendHTMLMessages);
  return promise;
};

const sendPhoto = (ctx, message) => {
  var resolve, reject;
  var promise = new Promise(function (promiseResolve, promiseReject) {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  queueMG.push({ ctx, message, resolve, reject });
  process.nextTick(_sendPhoto);
  return promise;
};

function _sendPhoto() {
  // if we are already sending messages from the queue, or
  // the queue is empty, stop
  if (inUseQueueMG.length || !queueMG.length) return;

  inUseQueueMG = queueMG;
  queueMG = [];
  Promise.mapSeries(inUseQueueMG, function (request) {
    var resolve = request.resolve;
    var ctx = request.ctx;

    const msg = request.message;
    const taInfo = msg.taInfo;
    const script = msg.script;
    const redisKey = msg.redisKey ? msg.redisKey : msg.type;

    if (script != undefined) {
      exec(script);
    }

    if (!taInfo) {
      Promise.resolve(basicTAInfo(msg.ticker)).then((res) => {
        saveToRedisCache(
          redisChartKey(redisKey, msg.ticker, msg.interval),
          res
        );

        ctx.telegram.sendChatAction(ctx.message.chat.id, "upload_photo");
        const caption =
          msg.interval == null
            ? `${msg.type} || $${msg.ticker.toUpperCase()}`
            : `${msg.type} || $${msg.ticker.toUpperCase()} - ${msg.interval}`;
        const finalCaption = caption + res;
        return setTimeout(() => {
          watchFileExist(msg.photo, "").then((result) => {
            if (result.exist) {
              return ctx
                .replyWithPhoto(
                  { source: fs.ReadStream(msg.photo) },
                  Extra.caption(finalCaption)
                    .HTML()
                    .inReplyTo(ctx.message.message_id)
                )
                .then(resolve)
                .catch((err) => {
                  return ctx.reply(
                    "Silahkan mencoba kembali",
                    Extra.inReplyTo(ctx.message.message_id)
                  );
                });
            }
          });
        }, 350);
      });
    } else {
      const redisKey = msg.redisKey ? msg.redisKey : msg.type;

      if (msg.saveToRedis) {
        // saveToRedisCache(redisChartKey(redisKey, msg.ticker, msg.interval), "");
      }

      ctx.telegram.sendChatAction(ctx.message.chat.id, "upload_photo");

      const caption =
        msg.interval == null
          ? `${msg.type} || $${msg.ticker.toUpperCase()}`
          : `${msg.type} || $${msg.ticker.toUpperCase()} - ${msg.interval}`;
      const finalCaption = msg.taInfo == undefined ? caption : caption + taInfo;
      watchFileExist(msg.photo, "").then((result) => {
        if (result.exist) {
          return ctx
            .replyWithPhoto(
              { source: fs.ReadStream(msg.photo) },
              Extra.caption(finalCaption)
                .HTML()
                .inReplyTo(ctx.message.message_id)
            )
            .then(resolve)
            .catch((err) => {
              console.error(err);
            });
        }
      });
    }
  }).then(function () {
    inUseQueueMG = [];
    _sendPhoto();
  });
}

const sendHelp = (ctx) => {
  const imgUrlSpecial = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\help.jpg";
  const imgUrlPrivate =
    "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\help_private.jpg";

  ctx.telegram.sendChatAction(ctx.message.chat.id, "upload_photo");

  if (checkFAAccess(ctx)) {
    return ctx.replyWithPhoto(
      { source: fs.ReadStream(imgUrlPrivate) },
      Extra.caption("Bot commands").inReplyTo(ctx.message.message_id)
    );
  } else {
    return ctx.replyWithPhoto(
      { source: fs.ReadStream(imgUrlSpecial) },
      Extra.caption("Bot commands").inReplyTo(ctx.message.message_id)
    );
  }
};

const sendStats = (ctx) => {
  const type = ctx.message.chat.type;
  if (type !== "private") {
    const senderId = ctx.from.id;
    const username = ctx.message.from.username
      ? ctx.message.from.username
      : ctx.message.from.first_name;
    const access = ctx.state.access ? "Unlimited" : "Limited - 15 saham";
    getUserData(senderId).then((res) => {
      title = `<b>${username} Status</b>`;
      let textMessage = `\nAccess: ${access}`;
      textMessage = textMessage + `\n=========================`;
      textMessage =
        textMessage + `\nDate: ${moment().format("DD MMM YYYY (dddd)")}`;
      textMessage = textMessage + `\n\n<i>Requested Stocks:</i>`;
      let index = 1;
      let stocks = "<code>";
      res.ticker.map((r) => {
        stocks = `${stocks}\n${index}.${r}`;
        index++;
      });
      stocks = `${stocks}</code>`;

      return ctx.replyWithHTML(title + textMessage + stocks);
    });
  }
};

const sendCp = (ctx) => {
  const message = formatMessageInput(ctx);
  const sym = message[0];
  const tf = formatTimeframeInput(message[1]);
  const command = "cp";

  if (!checkTimeFrame(tf)) {
    return;
  }

  const { imgUrl, interval, script } = processor({ tf, sym, command });

  checkRedisCache(redisChartKey("CP", sym, interval)).then((cache) => {
    if (cache != null && fs.existsSync(imgUrl)) {
      return sendPhoto(ctx, {
        ticker: sym,
        photo: imgUrl,
        type: "Chart Pattern",
        interval,
        taInfo: cache,
      }).catch((err) => {
        console.error(err);
      });
    }

    return sendPhoto(ctx, {
      ticker: sym,
      photo: imgUrl,
      type: "Chart Pattern",
      redisKey: "CP",
      interval,
      script,
    }).catch((err) => {
      console.error(err);
    });
  });
};

const sendScreener = (fileName, caption, outputPath, ctx) => {
  const path = `./scr/${outputPath}.png`;
  fsReadFileHtml(fileName).then((data) => {
    htmlToImage({
      html: data,
      output: path,
      type: "jpeg",
      quality: 100,
    }).then(() => {
      ctx.replyWithPhoto(
        { source: fs.ReadStream(path) },
        Extra.caption(caption).inReplyTo(ctx.message.message_id)
      );
    });
  });
};

module.exports = {
  sendPhoto,
  sendHTMLMessage,
  sendHelp,
  sendStats,
  sendCp,
  sendScreener,
};
