const moment = require("moment");

const Holidays = require("date-holidays");
const hd = new Holidays();

hd.init("ID");

const today = moment();
moment.locale("id");

const isWeekend = () => {
  return moment().day() === 6 || moment().day() === 0;
};

const marketHours = () => {
  return moment().isBetween(
    moment("08:30:00", "HH:mm:ss"),
    moment("15:30:00", "HH:mm:ss")
  );
};

const getChatMember = (ctx) => {
  const senderId = ctx.update.message.from.id;
  return ctx.getChatMember(senderId);
};

const isOwner = (data, ctx) => {
  if (data.user.username && data.user.id) {
    const username = data.user.username.toLowerCase();
    const userId = data.user.id;
    const userIdlist = [229886930];
    const usernameList = ["kangritel39", "kaicilef", "linglingg99"];
    return usernameList.includes(username) || userIdlist.includes(userId);
  } else {
    ctx.replyWithHTML(
      "<b>Silahkan buat username Telegram sebelum anda bisa akses bot!</b>"
    );
    return false;
  }
};

const isAdmin = (role) => {
  return role === "administrator" || role === "creator";
};

const adminOnlyGroup = (groupId) => {
  const allowedGroupList = [
    "-1001525790748",
    "-1001640435916",
    "-1001287411917",
    "-700929432",
  ];
  return allowedGroupList.includes(groupId);
};

const nonTickerCommand = (command) => {
  const nonTickerCommand = [
    "start",
    "trial",
    "index",
    "comm",
    "comm@t4c_bot",
    "profile",
    "help",
    "help@t4c_bot",
    "scrhelp",
    "scrhelp@t4c_bot",
    "scr",
    "donate",
    "donate@t4c_bot",
    "guide",
    "guide@t4c_bot",
    "getid",
    "reggroup",
    "maintenance",
    "stopm",
    "msg",
    "msgg",
    "msgp",
    "stats",
    "stats@t4c_bot",
    "bds",
    "bdtopacc",
    "bdtopaccw",
    "bdtopaccew",
    "bdtopaccm",
    "bdtopaccem",
    "bdtop35acc",
    "bdtop35accw",
    "bdtop35accew",
    "bdtop35accm",
    "bdtop35accem",
    "bdtop3acc",
    "bdtop3accw",
    "bdtop5acc",
    "sbd",
    "code",
    "agenda",
    "md",
    "fallback",
    "extend",
    "register",
    "spike",
    "extendg",
    "scrow",
    "cs",
    "cshelp",
    "cabe",
    "tcabe",
    "feekr",
    "feecfas",
    "ccg",
    "qr",
    "qrsched",
  ];

  return nonTickerCommand.includes(command);
};

const isValidCommand = (command) => {
  const validCommand = [
    "start",
    "trial",
    "index",
    "comm",
    "comm@t4c_bot",
    "profile",
    "help",
    "help@t4c_bot",
    "scrhelp",
    "scrhelp@t4c_bot",
    "scr",
    "donate",
    "donate@t4c_bot",
    "guide",
    "guide@t4c_bot",
    "getid",
    "reggroup",
    "maintenance",
    "stopm",
    "msg",
    "msgg",
    "msgp",
    "stats",
    "stats@t4c_bot",
    "bds",
    "bdtopacc",
    "bdtopaccw",
    "bdtopaccew",
    "bdtopaccm",
    "bdtopaccem",
    "bdtop35acc",
    "bdtop35accw",
    "bdtop35accew",
    "bdtop35accm",
    "bdtop35accem",
    "bdtop3acc",
    "bdtop3accw",
    "bdtop5acc",
    "sbd",
    "code",
    "main",
    "adv",
    "ez",
    "bd",
    "bds",
    "darvas",
    "gap",
    "vwap",
    "ichi",
    "trend",
    "eq",
    "pix",
    "action",
    "cp",
    "sd",
    "nbs",
    "ma",
    "ema",
    // "fibo",
    // "cp",
    "gm",
    "st",
    "ks",
    "ag",
    "qg",
    "pp",
    "info",
    "agenda",
    "md",
    "ow",
    "ows",
    "sr",
    "swing",
    "insider",
    "fallback",
    "extend",
    "register",
    "spike",
    "extendg",
    "scrow",
    "cschart",
    "cs",
    "cshelp",
    "tv",
    "ss",
    "cabe",
    "tcabe",
    "feekr",
    "feecfas",
    "ccg",
    "qr",
    "qrsched",
    "tdm",
  ];

  return validCommand.includes(command);
};

const isNonValidatedCommand = (command) => {
  const nonValidatedCommand = ["trial", "profile", "donate", "start"];

  return nonValidatedCommand.includes(command);
};

const checkTimeFrame = (tf) => {
  const validTF = ["D", "H", "W", "M", "5M", "15M", "30M", "6M", "4H"];

  return validTF.includes(tf);
};

const checkSpecificTimeFrame = (tf, access) => {
  const validTF = ["D", "W", "M"];

  return validTF.includes(tf);
};

const checkBDTimeFrame = (tf) => {
  const validTF = ["D", "3D", "W", "M", "EW", "EM"];

  return validTF.includes(tf.toUpperCase());
};

const checkFAAccess = (ctx) => {
  const chatId = ctx.message.chat.id;
  const type = ctx.message.chat.type;
  const allowedGroupId = ["-1001214043290", "-478829003"];

  if (type != "private") {
    if (allowedGroupId.includes(chatId.toString())) {
      return true;
    }
  } else if (getChatMember(ctx)) {
    return true;
  }

  return false;
};

const checkHoliday = (date) => {
  const isHoliday = hd.isHoliday(date.startOf("day"))[0];

  if (isHoliday) {
    const holidayStart = moment(isHoliday.start);
    const holidayEnd = moment(isHoliday.end);
    const holidayLength = holidayEnd.diff(holidayStart, "days");
    return date.subtract(holidayLength, "days")
  } else {
    return date;
  }
}

const checkValidSBDType = (input) => {
  const validSBDType = [
    "acc.1",
    "acc.13",
    "acc.135",
    "acc.3",
    "acc.35",
    "acc.15",
    "acc.5",
    "dist.1",
    "dist.13",
    "dist.135",
    "dist.3",
    "dist.35",
    "dist.15",
    "dist.5",
  ];

  return validSBDType.includes(input);
};

const checkLiquidity = (trxVal) => {
  return trxVal >= 500000000;
};

const validateSpecialCase = (groupId, command) => {
  const disabledCommand = ["bd", "info"];
  return groupId == "-1001180515812" && disabledCommand.includes(command);
};

const checkPeriode = (date) => {
  if (!date) {
    return false;
  }

  const upToDate = date.includes("up");
  if (upToDate) {
    return today < moment(date.replace("up", ""), "D MMM YY");
  } else {
    const splittedDate = date.split("-");
    const toDate = moment(splittedDate[1], "D MMM YY");
    const fromDate = moment(
      `${splittedDate[0]} ${toDate.month() + 1} ${toDate.year()}`,
      "D M YYYY"
    );
    return today >= fromDate && today <= toDate;
  }
};

const checkValidCabe = (text) => {
  if (text && text.includes("setiap")) {
    if (text.includes("tanggal")) {
      const period = text.replace("setiap tanggal ", "");
      return today.date() == period;
    } else {
      const period = text.split(";")[0].replace("setiap ", "");
      const splittedPeriod = period.split(" ");
      let periodArray = [];
      splittedPeriod.map((sp) => {
        periodArray.push(moment().day(sp).day());
      });
      return periodArray.includes(today.day());
    }
  }
  return true;
};

module.exports = {
  isWeekend,
  marketHours,
  getChatMember,
  nonTickerCommand,
  checkTimeFrame,
  checkSpecificTimeFrame,
  checkFAAccess,
  isValidCommand,
  checkHoliday,
  checkValidSBDType,
  checkLiquidity,
  checkBDTimeFrame,
  isNonValidatedCommand,
  validateSpecialCase,
  isOwner,
  isAdmin,
  adminOnlyGroup,
  checkPeriode,
  checkValidCabe,
};
