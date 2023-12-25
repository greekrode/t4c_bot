// const { announcementLink } = require("./index");
const { text } = require("cheerio/lib/api/manipulation");
const e = require("express");
const moment = require("moment");
const {
  calendarDateMatchTomorrowOrAfter,
  checkDividendStatus,
  checkStockSplitStatus,
  checkRightIssueStatus,
  checkIPOStatus,
  formatDateWithShortMonth,
} = require("../helper/formatter");

const mapResponseSbReports = (data) => {
  // return data.map((d) => {
  //   announcementLink(d.titleurl.split("/")[2]).then((res) => {
  //     return res;
  //   });
  //   // return {
  //   //   title: d.title,
  //   //   created_at: d.created,
  //   //   reports: d.reports[0].type,
  //   //   ticker: d.topics[0],
  //   // };
  // });
};

const mapAnnouncement = (data) => {
  return data.map((d) => d.attachment);
};

const mapDividend = (data) => {
  const filtered = data.filter((d) => {
    const param = {
      cum_date: d.dividend_cumdate,
      ex_date: d.dividend_exdate,
      rec_date: d.dividend_recdate,
      pay_date: d.dividend_paydate,
    };

    return calendarDateMatchTomorrowOrAfter(param);
  });

  return filtered.map((r) => {
    if (checkDividendStatus(r, true) != undefined) {
      return {
        ticker: r.company_symbol,
        status: checkDividendStatus(r, true),
        value: r.dividend_value,
      };
    }
  });
};

const mapStockSplit = (data) => {
  const filtered = data.filter((d) => {
    const param = {
      cum_date: d.stocksplit_cumdate,
      ex_date: d.stocksplit_exdate,
      rec_date: d.stocksplit_recdate,
      pay_date: d.stocksplit_paydate,
    };

    return calendarDateMatchTomorrowOrAfter(param);
  });

  return filtered.map((r) => {
    if (checkStockSplitStatus(r, true)) {
      return {
        ticker: r.company_symbol,
        status: checkStockSplitStatus(r, true),
        ratio: `${r.stocksplit_old}:${r.stocksplit_new}`,
      };
    }
  });
};

const mapRightIssue = (data) => {
  const filtered = data.filter((d) => {
    const param = {
      cum_date: d.rightissue_cumdate,
      ex_date: d.rightissue_exdate,
      rec_date: d.rightissue_recdate,
      pay_date: d.rightissue_paydate,
      trading_start: d.rightissue_trading_start,
      trading_end: d.rightissue_trading_end,
    };

    return calendarDateMatchTomorrowOrAfter(param);
  });

  return filtered.map((r) => {
    if (checkRightIssueStatus(r, true) != undefined) {
      return {
        ticker: r.company_symbol,
        status: checkRightIssueStatus(r, true),
        ratio: `${r.rightissue_old}:${r.rightissue_new}`,
        trading_period: `${formatDateWithShortMonth(
          r.rightissue_trading_start
        )} - ${formatDateWithShortMonth(r.rightissue_trading_end)}`,
        ex_price: r.rightissue_price,
      };
    }
  });
};

const mapIPO = (data) => {
  const filtered = data.filter((d) => {
    const detail = d.ipo_data_detail;
    const param = {
      offering_start: detail.offering_start,
      offering_end: detail.offering_end,
    };

    return calendarDateMatchTomorrowOrAfter(param);
  });

  return filtered.map((r) => {
    return {
      ticker: r.company_name,
      status: checkIPOStatus(r.ipo_data_detail),
      listing_date: formatDateWithShortMonth(r.ipo_listing_date),
    };
  });
};

const mapRUPS = (data) => {
  const filtered = data.filter((d) => {
    const param = {
      rups_date: d.rups_date,
    };
    return calendarDateMatchTomorrowOrAfter(param);
  });

  return filtered.map((r) => {
    return {
      ticker: r.company_symbol,
      date_time: moment(r.rups_date, "YYYY-MM-DD H:mm:ss").format(
        "MMM Do, YYYY H:mm"
      ),
      venue: r.rups_venue,
    };
  });
};

const mapChartData = (data) => {
  return data.map((r) => {
    return {
      open: r.open,
      close: r.close,
      high: r.high,
      low: r.low,
      vol: r.volume,
      fbuy: r.foreignbuy,
      fsell: r.foreignsell,
      fnet: r.foreignbuy - r.foreignsell,
      freq: r.frequency,
      val: r.value,
      shareout: r.shareoutstanding,
      freq_anal: r.freq_analyzer,
    };
  });
};

const mapBrokSumData = (res) => {
  if (res.data.data != undefined) {
    return res.data.data;
  }
  return false;
};

const mapInsiderData = (res, ticker) => {
  let textMessage =
    "\n<b>------ Insider Transaction (" + ticker + ")------</b>\n";
  textMessage = textMessage + "<code>";
  if (res.data.data.data.length > 0) {
    const data = res.data.data.data;
    const length = data.length < 10 ? data.length : 10;
    for (i = 0; i < length; i++) {
      textMessage = textMessage + "\n" + data[i].date;
      textMessage = textMessage + "\n" + data[i].insider_name;
      textMessage =
        textMessage +
        "\n" +
        "Changes: " +
        data[i].changes +
        "(" +
        data[i].changesPct +
        "%" +
        ")";
      textMessage =
        textMessage +
        "\n" +
        "Current: " +
        data[i].current +
        "(" +
        data[i].currentPct +
        "%" +
        ")";
      textMessage =
        textMessage +
        "\n" +
        "Previous: " +
        data[i].previous +
        "(" +
        data[i].previousPct +
        "%" +
        ")";
      if (data[i].marker !== "") {
        textMessage = textMessage + "\n" + "Status: " + data[i].marker + "\n";
      } else {
        textMessage = textMessage + "\n";
      }
    }

    textMessage = textMessage + "</code>";

    return textMessage;
  }
  return textMessage + "No insider transaction data" + "</code>";
};

module.exports = {
  mapResponseSbReports,
  mapAnnouncement,
  mapDividend,
  mapStockSplit,
  mapRightIssue,
  mapIPO,
  mapRUPS,
  mapChartData,
  mapBrokSumData,
  mapInsiderData,
};
