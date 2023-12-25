const { checkRedisCache, setUserData, getUserData } = require("./redis");
const {
  getChatMember,
  nonTickerCommand,
  isValidCommand,
  isNonValidatedCommand,
  validateSpecialCase,
  isOwner,
  isAdmin,
  adminOnlyGroup,
} = require("./validator");
const { Extra } = require("telegraf");

const moment = require("moment");
const fs = require("fs");

const MongoClient = require("mongodb").MongoClient;
const url =
  "mongodb://127.0.0.1:27017/?gssapiServiceName=mongodb&retryWrites=true";
const dbName = "kangritelbot";

const now = moment();

const isMasterGroup = (groupId, role) => {
  const masterGroups = ["-1001547566416", "-1001214043290"];
  return masterGroups.includes(groupId.toString()) && !isAdmin(role);
};

const checkTicker = (command, args) => {
  return new Promise((resolve, reject) => {
    MongoClient.connect(
      url,
      {
        useUnifiedTopology: true,
      },
      (err, client) => {
        const db = client.db(dbName);
        if (nonTickerCommand(command)) {
          resolve(db);
        } else {
          if (args[0] == undefined) {
            return reject(new Error("Ticker does not exist!"));
          }
          const ticker = args[0].toUpperCase();
          const query = { ticker: ticker.toUpperCase() };
          db.collection("ticker").findOne(query, (err, res) => {
            if (res) {
              resolve(db);
            } else {
              reject(new Error(`Ticker does not exist! ${ticker}`));
            }
          });
        }
      }
    );
  });
};

const validateGroup = (groupId, senderId, db, command, args, owner) => {
  const query = { group_id: groupId.toString() };
  return new Promise((resolve, reject) => {
    try {
      db.collection("allowed_group").findOne(query, (err, res) => {
        if (err) console.error(err);

        if (res === null || !res) {
          resolve({
            valid: false,
          });
        }

        try {
          if (adminOnlyGroup(groupId.toString())) {
            resolve({
              valid: owner,
            });
          } else {
            if (!res.special) {
              const query = { user_id: senderId };
              db.collection("allowed_private_users").findOne(
                query,
                (err, result) => {
                  if (result) {
                    setUserData(senderId, command, args);
                    return resolve({ valid: true, access: true });
                  } else if (!nonTickerCommand(command)) {
                    getUserData(senderId).then((res) => {
                      if (res && res.count >= 15) {
                        if (res.ticker.includes(args)) {
                          resolve({ valid: true, access: false });
                        }
                        resolve({ limit: true, access: false });
                      } else {
                        setUserData(senderId, command, args);
                        resolve({
                          valid: true,
                          access: false,
                        });
                      }
                    });
                  } else {
                    resolve({
                      valid: true,
                      access: false,
                    });
                  }
                }
              );
            } else {
              if (moment(res.expired_at).isAfter(moment())) {
                setUserData(senderId, command, args);
                resolve({
                  valid: true,
                  access: true,
                });
              } else {
                setUserData(senderId, command, args);
                resolve({
                  expired: true,
                });
              }
            }
          }
        } catch (err) {
          console.error(err.message, command, res);
        }
      });
    } catch (err) {
      console.error(err.message, command);
    }
  });
};

const validateUser = (senderId, db, owner) => {
  return new Promise((resolve, reject) => {
    if (owner) {
      resolve({
        valid: true,
      });
    } else {
      var query = { user_id: senderId };
      db.collection("allowed_private_users").findOne(query, (err, res) => {
        if (err) console.error(err);
        if (!res) {
          resolve({
            invalid: true,
          });
        } else if (res.paid) {
          if (moment(res.subscription_end_at).isAfter(moment())) {
            resolve({
              valid: true,
            });
          } else {
            resolve({
              expired: true,
            });
          }
        } else if (res.trial) {
          if (res.trial_end_at > now) {
            resolve({
              valid: true,
            });
          } else if (res.trial_end_at < now) {
            resolve({
              expired: true,
            });
          }
        }
      });
    }
  });
};

const authenticator = () => (ctx, next) => {
  if (ctx.updateType === "message" && ctx.updateSubTypes[0] === "text") {
    const senderId = ctx.from.id;
    const text = ctx.update.message.text.toLowerCase();
    const chatId = ctx.message.chat.id;
    const messageId = ctx.update.message.message_id;

    if (chatId === "-1001707046034") {
      return next();
    }

    if (text.startsWith("/")) {
      getChatMember(ctx)
        .then((chatM) => {
          const role = chatM.status;
          const owner = isOwner(chatM, ctx);
          ctx.state.fallback = false;

          const match = text.match(/^\/([^\s]+)\s?(.+)?/);
          let args = [];
          let command;
          if (match !== null) {
            if (match[1]) {
              command = match[1];
            }
            if (match[2]) {
              args = match[2].split(" ");
            }
            ctx.state.command = command;
          }

          if (!isValidCommand(command)) {
            return;
          }

          checkRedisCache("Maintenance").then((cache) => {
            if (!owner && cache) {
              return ctx.reply("Bot sedang dalam maintenance");
            }

            checkRedisCache("Fallback").then((fallback) => {
              if (fallback || fallback !== null) {
                ctx.state.fallback = true;
              }

              checkTicker(command, args).then((res) => {
                const type = ctx.message.chat.type;
                const db = res;

                if (owner) {
                  setUserData(senderId, command, args);
                  return next();
                } else if (type === "supergroup" || type === "group") {
                  validateGroup(
                    chatId,
                    senderId,
                    db,
                    command,
                    args,
                    owner
                  ).then((res) => {
                    if (res.valid) {
                      ctx.state.access = res.access;
                      return next();
                    } else if (res.timeoff) {
                      return ctx.replyWithHTML(
                        "Bot hanya tersedia di jam 8 - 9.30 WIB, 14.30 - 16 WIB, dan 20 - 22 WIB\nOutput bot <b>BUKAN REKOMENDASI</b> karena masih <b>BUTUH ANALISA</b> lanjutan."
                      );
                    } else {
                      if (res.limit) {
                        return ctx.replyWithHTML(
                          "<b>Limit harian 15 saham sudah tercapai. Untuk unlimited request, silahkan donasi</b>.\n\n<i>Untuk donasi, silahkan ketik /donate</i>"
                        );
                      }
                      if (res.expired) {
                        return ctx.reply(
                          "Masa langganan bot sudah habis. Silahkan contact @kangritel untuk perpanjangan"
                        );
                      } else {
                        return ctx.deleteMessage(chatId, messageId);
                      }
                    }
                  });
                } else if (type === "private") {
                  validateUser(senderId, db, owner).then((res) => {
                    if (res.valid || isNonValidatedCommand(command)) {
                      ctx.state.access = true;
                      return next();
                    } else {
                      if (res.expired) {
                        let imgUrl =
                          "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\bot_donate.png";
                        return ctx.replyWithPhoto(
                          { source: fs.ReadStream(imgUrl) },
                          Extra.caption(
                            "Masa berlaku bot sudah berakhir\nSilahkan donasi untuk menggunakan bot kembali\nTerima kasih :)"
                          )
                        );
                      } else {
                        return;
                      }
                    }
                  });
                }
              });
            });
          }).catch((err) => {
            console.error(err);
          });
        })
        .catch((err) => {
          console.error(err);
        });
    }
  } else if (ctx.updateType == "callback_query") {
    return next();
  } else if (ctx.updateType == "channel_post") {
    // console.log(ctx.update.channel_post.chat.id);
  }
};

module.exports = {
  authenticator,
};
