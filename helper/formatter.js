const numeral = require("numeral");
const moment = require("moment");

const now = moment();
moment.locale("id");

const eod =
  now.isAfter(moment("15:30", "HH:mm")) ||
  now.isBefore(moment("08.45", "HH:mm"));
const weekend = now.day() == 6 || now.day() == 0;

const { checkHoliday } = require("./validator");

const convertVal = (val) => {
  return numeral(val).format("0.0a").toUpperCase();
};

const convertToThousand = (val) => {
  return numeral(val).format(0, 0);
};

const calculateTotal = (local, foreign) => {
  return parseInt(local) + parseInt(foreign);
};

const calculateOwnership = (val, local, foreign) => {
  return numeral((val / calculateTotal(local, foreign)) * 100).format("0.00");
};

const ucFirst = (string) => {
  return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
};

const formatMessageInput = (ctx) => {
  return ctx.message.text
    .substr(ctx.message.entities[0].length + 1, ctx.message.text.length)
    .split(" ");
};

const formatTimeframeInput = (input, spike = false) => {
  if (!input) {
    if (spike) {
      return "6M";
    } else {
      return "D";
    }
  }

  return input.toUpperCase();
};

const convertToMoment = (date) => {
  return moment(date, "YYYY-MM-DD");
};

const formatDateWithDay = (date) => {
  return date.format("MMM Do, YYYY (dddd)");
};

const formatDateWithShortMonth = (date) => {
  return moment(date).format("DD MMM YYYY");
};

const dateCalculations = {
  "w": () => [moment().subtract(1, "week"), moment()],
  "ew": () => [moment().day() == 0 ? moment().subtract(1, "week").startOf("week") : moment().startOf("week"), moment()],
  "m": () => [moment().subtract(1, "month"), moment()],
  "em": () => [moment().startOf("month"), moment()],
  "3d": () => [moment().day() == 0 ? moment().subtract(3, "days") : moment().subtract(2, "days"), moment()],
  "2d": () => [moment().day() == 0 ? moment().subtract(2, "days") : moment().subtract(1, "days"), moment()],
  "lw": () => [moment().subtract(1, "week").startOf("week"), moment().subtract(1, "week").endOf("week")],
  "l2w": () => [moment().subtract(2, "week").startOf("week"), moment().subtract(2, "week").endOf("week")],
  "lm": () => [moment().subtract(1, "month").startOf("month"), moment().subtract(1, "month").endOf("month")]
};

const formatBroksumDate = (message) => {
  let fromDate, toDate;

  const checkHolidayAndFormat = (m) => checkHoliday(m).format("YYYY-MM-DD");
  const formatOrCheckHoliday = (msg, days) =>
    msg === undefined || msg === ""
      ? checkHolidayAndFormat(moment().subtract(days, "days"))
      : moment(msg, "DDMMYYYY").format("YYYY-MM-DD");

  if (dateCalculations[message[1]]) {
    [fromDate, toDate] = dateCalculations[message[1]]().map((m) =>
      m.format("YYYY-MM-DD")
    );
  } else {
    const days = now.day() === 1 ? 3 : now.day() === 0 ? 2 : 1;
    fromDate = formatOrCheckHoliday(message[1], days);
    toDate = formatOrCheckHoliday(message[2], days);
  }

  return { fromDate, toDate };
};

const checkDividendStatus = (data, tomorrow = false) => {
  const date = tomorrow ? moment().add(1, "day") : moment();
  const cumDate = moment(data.dividend_cumdate, "YYYY-MM-DD");
  const exDate = moment(data.dividend_exdate, "YYYY-MM-DD");
  const recDate = moment(data.dividend_recdate, "YYYY-MM-DD");
  const payDate = moment(data.dividend_paydate, "YYYY-MM-DD");

  if (date.isSame(cumDate, "day")) {
    return "Cum Date";
  } else if (date.isSame(exDate, "day")) {
    return "Ex Date";
  } else if (date.isSame(recDate, "day")) {
    return "Rec Date";
  } else if (date.isSame(payDate, "day")) {
    return "Payment Date";
  } else if (date.isBefore(cumDate, "day")) {
    return `Cum Date at ${formatDateWithDay(cumDate)}`;
  } else if (date.isBefore(exDate, "day")) {
    return `Ex Date at at ${formatDateWithDay(exDate)}`;
  }
};

const checkStockSplitStatus = (data, tomorrow = false) => {
  const date = tomorrow ? moment().add(1, "day") : moment();
  const cumDate = moment(data.stocksplit_cumdate, "YYYY-MM-DD");
  const exDate = moment(data.stocksplit_exdate, "YYYY-MM-DD");
  const recDate = moment(data.stocksplit_recdate, "YYYY-MM-DD");

  if (date.isSame(cumDate, "day")) {
    return "Cum Date";
  } else if (date.isSame(exDate, "day")) {
    return "Ex Date";
  } else if (date.isSame(recDate, "day")) {
    return "Rec Date";
  } else if (date.isBefore(cumDate, "day")) {
    return `Cum Date at ${formatDateWithDay(cumDate)}`;
  } else if (date.isBefore(exDate, "day")) {
    return `Ex Date at ${formatDateWithDay(exDate)}`;
  }
};

const checkWarrantStatus = (data) => {
  const today = moment();
  const tradeStart = moment(data.wrant_trading_from, "YYYY-MM-DD");
  const tradeEnd = moment(data.wrant_trading_end, "YYYY-MM-DD");
  const excStart = moment(data.wrant_exc_from, "YYYY-MM-DD");
  const excEnd = moment(data.wrant_exc_end, "YYYY-MM-DD");

  if (today.isSame(tradeStart, "day")) {
    return "Trading Start";
  } else if (today.isSame(tradeEnd, "day")) {
    return "Trading End";
  } else if (today.isSame(excStart, "day")) {
    return "Exercise Start";
  } else if (today.isSame(excEnd, "day")) {
    return "Exercise End";
  } else if (today.isBefore(tradeStart, "day")) {
    return `Trading Start at ${formatDateWithDay(tradeStart)}`;
  } else if (today.isBefore(tradeEnd, "day")) {
    return `Trading End at ${formatDateWithDay(tradeEnd)}`;
  } else if (today.isBefore(excStart, "day")) {
    return `Exercise Start at ${formatDateWithDay(excStart)}`;
  } else if (today.isBefore(excEnd, "day")) {
    return `Exercise End at ${formatDateWithDay(excEnd)}`;
  }
};

const checkRightIssueStatus = (data, tomorrow = false) => {
  const date = tomorrow ? moment().add(1, "day") : moment();
  const cumDate = moment(data.rightissue_cumdate, "YYYY-MM-DD");
  const exDate = moment(data.rightissue_exdate, "YYYY-MM-DD");
  const recDate = moment(data.rightissue_recdate, "YYYY-MM-DD");
  const tradeStart = moment(data.rightissue_trading_start, "YYYY-MM-DD");
  const tradeEnd = moment(data.rightissue_trading_end, "YYYY-MM-DD");

  if (date.isSame(tradeStart, "day")) {
    return "Trading Start";
  } else if (date.isSame(tradeEnd, "day")) {
    return "Trading End";
  } else if (date.isSame(cumDate, "day")) {
    return "Cum Date";
  } else if (date.isSame(exDate, "day")) {
    return "Ex Date";
  } else if (date.isSame(recDate, "day")) {
    return "Rec Date";
  } else if (date.isBefore(tradeStart, "day")) {
    return `Trading Start at ${formatDateWithDay(tradeStart)}`;
  } else if (date.isBefore(tradeEnd, "day")) {
    return `Trading End at ${formatDateWithDay(tradeEnd)}`;
  } else if (date.isBefore(cumDate, "day")) {
    return `Cum Date at ${formatDateWithDay(cumDate)}`;
  } else if (date.isBefore(exDate, "day")) {
    return `Ex Date at ${formatDateWithDay(exDate)}`;
  }
};

const checkIPOStatus = (data) => {
  const offerStart = moment(data.offering_start, "YYYY-MM-DD H:mm:ss");
  const offerEnd = moment(data.offering_end, "YYYY-MM-DD H:mm:ss");

  if (moment().isSame(offerStart)) {
    return `Offering Start until ${offerEnd.format("MMM Do, YYYY (dddd)")}`;
  } else if (moment().isSame(offerEnd)) {
    return "Offering End";
  } else if (moment().isBefore(offerEnd)) {
    return `Offering will start at ${offerStart.format("MMM Do, YYYY (dddd)")}`;
  }
};

const calendarDateMatchTomorrowOrAfter = (data) => {
  const tomorrow = moment().add(1, "days");
  return (
    convertToMoment(data.cum_date).isSameOrAfter(tomorrow, "day") ||
    convertToMoment(data.ex_date).isSameOrAfter(tomorrow, "day") ||
    convertToMoment(data.rec_date).isSameOrAfter(tomorrow, "day") ||
    convertToMoment(data.pay_date).isSame(tomorrow, "day") ||
    convertToMoment(data.trading_start).isSameOrAfter(tomorrow, "day") ||
    convertToMoment(data.trading_end).isSameOrAfter(tomorrow, "day") ||
    convertToMoment(data.offering_start).isSameOrAfter(moment(), "day") ||
    convertToMoment(data.offering_end).isSameOrAfter(moment(), "day") ||
    convertToMoment(data.rups_date).isBetween(
      tomorrow,
      tomorrow.clone().add(1, "week")
    )
  );
};

const exportPath = (sym) => {
  return `C:\\Users\\Administrator\\Documents\\AmiExport\\${sym}`;
};

const scriptPath = (command, tf, sym) => {
  return `start /b wscript C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\${command}\\${command}${tf}.js ${sym}`;
};

const interval = (tf) => {
  if (tf === "d") {
    return "Daily";
  } else if (tf === "w") {
    return "Weekly";
  } else if (tf === "m") {
    return "Monthly";
  } else if (tf === "h") {
    return "Hourly";
  } else if (tf === "4h") {
    return "4-Hours";
  } else if (tf === "5m") {
    return "5-minutes";
  } else if (tf === "15m") {
    return "15-minutes";
  } else if (tf === "30m") {
    return "30-minutes";
  } else if (tf === "6m") {
    return "6-minutes";
  }
};

const formatTechnicalValue = (value) => {
  if (value < 0.1 && value > -0.1) {
    return "Neutral";
  } else if (value < 0.5 && value > 0.1) {
    return "Buy";
  } else if (value > 0.5) {
    return "Strong Buy";
  } else if (value < -0.1 && value > -0.5) {
    return "Sell";
  } else if (value < -0.5) {
    return "Strong Sell";
  }
};

const formatStockbitDate = (value) => {
  return value.format("YYYY-MM-DD");
};

const formatAccDistStatus = (vol, totalVol) => {
  const accdist = (vol / totalVol) * 100;

  if (accdist > 35) {
    return "Massive Acc";
  } else if (accdist > 20 && accdist <= 35) {
    return "Big Acc";
  } else if (accdist > 12.5 && accdist <= 20) {
    return "Normal Acc";
  } else if (accdist > 6 && accdist <= 12.5) {
    return "Small Acc";
  } else if (accdist > -6 && accdist <= 6) {
    return "Neutral";
  } else if (accdist >= -12.5 && accdist < -6) {
    return "Small Dist";
  } else if (accdist >= -20 && accdist < -12.5) {
    return "Normal Dist";
  } else if (accdist >= -35 && accdist < -20) {
    return "Big Dist";
  } else if (accdist < -35) {
    return "Massive Dist";
  }
};

const formatLiquidity = (value) => {
  if (value >= 100000000000) {
    return "Super Liquidity";
  } else if (value < 100000000000 && value >= 20000000000) {
    return "High Liquidity";
  } else if (value < 20000000000 && value >= 2000000000) {
    return "Medium Liquidity";
  } else {
    return "Low Liquidity";
  }
};

const formatBdAccTitle = (accLevel, type) => {
  let title = "";
  if (accLevel.toUpperCase() == "TOP") {
    title = "<b>TOP 1, 3 & 5 Broker";
  }

  return (title = `${title} ${type} Accum</b>\n`);
};

const formatTF = (tf) => {
  return tf == "D"
    ? moment().format("D MMM YYYY")
    : tf == "W"
    ? `Since ${moment().subtract(1, "week").format("D MMM YYYY")}`
    : tf == "M"
    ? `Since ${moment().subtract(1, "month").format("D MMM YYYY")}`
    : (tf = "EW"
        ? `Since ${moment().startOf("week").format("D MMM YYYY")}`
        : (tf = "EM"
            ? `Since ${moment().startOf("month").format("D MMM YYYY")}`
            : moment().format("D MMM YYYY")));
};

const formatForeignStatus = (foreign, trxVal) => {
  const accdist = (foreign / trxVal) * 100;

  if (accdist > 35) {
    return "Massive Acc";
  } else if (accdist > 20 && accdist <= 35) {
    return "Big Acc";
  } else if (accdist > 12.5 && accdist <= 20) {
    return "Normal Acc";
  } else if (accdist > 6 && accdist <= 12.5) {
    return "Small Acc";
  } else if (accdist > -6 && accdist <= 6) {
    return "Neutral";
  } else if (accdist >= -12.5 && accdist < -6) {
    return "Small Dist";
  } else if (accdist >= -20 && accdist < -12.5) {
    return "Normal Dist";
  } else if (accdist >= -35 && accdist < -20) {
    return "Big Dist";
  } else if (accdist < -35) {
    return "Massive Dist";
  }
};

const formatAccType = (ad, number) => {
  const accdist = ad.toUpperCase() == "ACC" ? "Accumulation" : "Distribution";
  const topbroker =
    number == "1"
      ? "TOP 1"
      : number == "3"
      ? "TOP 3"
      : number == "5"
      ? "TOP 5"
      : number == "13"
      ? "TOP 1 & 3"
      : number == "35"
      ? "TOP 3 & 5"
      : number == "135"
      ? "TOP 1,3 & 5"
      : number == "15"
      ? "TOP 1 & 5"
      : "";

  return `${topbroker} ${accdist}`;
};

const calculateLiquidity = (cd, length) => {
  let trx = 0;
  if (cd) {
    if (cd.length < length) {
      for (i = 0; i < cd.length; i++) {
        trx = trx + cd[i].value;
      }
    } else {
      for (i = 0; i < length; i++) {
        trx = trx + cd[i].value;
      }
    }
    return trx;
  }
  return false;
};

const calculateForeign = (cd, length) => {
  let foreign = 0;
  if (cd) {
    if (cd.length < length) {
      for (i = 0; i < cd.length; i++) {
        foreign = foreign + (cd[i].foreignbuy - cd[i].foreignsell);
      }
    } else {
      for (i = 0; i < length; i++) {
        foreign = foreign + (cd[i].foreignbuy - cd[i].foreignsell);
      }
    }
    return foreign;
  }
  return false;
};

const calculateCDData = (cd, startDate, endDate) => {
  let trx = 0,
    foreign = 0;
  if (cd) {
    for (i = 0; i < cd.length; i++) {
      if (moment(cd[i].date).isBetween(startDate, endDate, "days", "[]")) {
        trx = trx + cd[i].value;
        foreign = foreign + (cd[i].foreignbuy - cd[i].foreignsell);
      }
    }
    return { trx, foreign };
  }
  return false;
};

module.exports = {
  convertVal,
  convertToThousand,
  calculateOwnership,
  ucFirst,
  formatMessageInput,
  formatTimeframeInput,
  formatBroksumDate,
  checkDividendStatus,
  checkWarrantStatus,
  checkRightIssueStatus,
  checkStockSplitStatus,
  calendarDateMatchTomorrowOrAfter,
  checkIPOStatus,
  formatDateWithShortMonth,
  exportPath,
  scriptPath,
  interval,
  formatTechnicalValue,
  formatStockbitDate,
  formatAccDistStatus,
  formatLiquidity,
  formatBdAccTitle,
  formatTF,
  formatAccType,
  calculateLiquidity,
  calculateForeign,
  formatForeignStatus,
  calculateCDData,
};
