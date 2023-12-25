const { investing } = require("../investing/index");
const { tvPrice } = require("../tradingview/index");

const cheerio = require("cheerio");
const axios = require("axios");
const numeral = require("numeral");
const fs = require("fs");
const jimp = require("jimp");
const moment = require("moment");

const calculateDifference = (last, prev) => {
  const diff = numeral(last - prev).format("0.00");
  return diff > 0 ? `+${diff}` : `${diff}`;
};

const calculateChangePct = (prev, change) => {
  const diff = numeral((change / prev) * 100).format("0.00") + "%";
  return diff > 0 ? `+${diff}` : `${diff}`;
};

const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

const Path = require("path");

const width = 2560; //px
const height = 1440; //px
const chartCallback = (ChartJS) => {
  // Global config example: https://www.chartjs.org/docs/latest/configuration/
  ChartJS.defaults.global.elements.rectangle.borderWidth = 2;
  ChartJS.defaults.global.defaultFontColor = "#fff";
  ChartJS.defaults.global.defaultFontSize = 25;
  ChartJS.defaults.global.title.fontSize = 50;
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

const sunsirs = () => {
  return axios({
    method: "GET",
    url: "http://www.sunsirs.com/uk/prodetail-958.html",
  });
};

async function woodPulp() {
  const response = await sunsirs();
  let finalPrice = [];

  const $ = cheerio.load(response.data);
  $("tr").each((i, elem) => {
    if (i == 1 || i == 2) {
      const price = $(elem)
        .contents()
        .toArray()
        .map((element) => cheerio.load(element.children).text().trim());
      finalPrice.push(price[2]);
    }
  });

  const change = calculateDifference(finalPrice[0], finalPrice[1]);

  return {
    name: "Wood Pulp",
    lastValue: parseInt(finalPrice[0]),
    change,
    changePct: calculateChangePct(finalPrice[1], change),
    symbol: "Wood\nPulp",
  };
}

const crudeOil = tvPrice("commodities/crude-oil");
const brentOil = tvPrice("commodities/brent-oil");
const nickel = investing("commodities/nickel");
const tin = investing("commodities/tin");
const gold = investing("commodities/gold");
const silver = investing("commodities/silver");
const copper = investing("commodities/copper");
const indonesianCoal = tvPrice("commodities/indonesian-coal");
const newcastleCoal1 = tvPrice("commodities/newcastle-coal-1");
const newcastleCoal2 = tvPrice("commodities/newcastle-coal-2");
const rotterdamCoal1 = tvPrice("commodities/rotterdam-coal-1");
const rotterdamCoal2 = tvPrice("commodities/rotterdam-coal-2");
const cpo = tvPrice("commodities/malaysia-cpo");
const corn = investing("commodities/us-corn");
const soybeanOil = investing("commodities/us-soybean-oil");
const wheat = investing("commodities/us-wheat");
const naturalGas = investing("commodities/natural-gas");

const promises = [
  crudeOil,
  brentOil,
  nickel,
  tin,
  gold,
  silver,
  copper,
  indonesianCoal,
  newcastleCoal1,
  newcastleCoal2,
  rotterdamCoal1,
  rotterdamCoal2,
  cpo,
  corn,
  soybeanOil,
  wheat,
  woodPulp(),
  naturalGas,
];

const commoditiesText = new Promise((resolve, reject) => {
  Promise.all(promises).then((res) => {
    let textMessage = "";

    for (i = 0; i < res.length; i++) {
      if (i == 2) textMessage = textMessage + "\n";
      if (i == 7) textMessage = textMessage + "\n";
      if (i == 12) textMessage = textMessage + "\n";

      textMessage =
        textMessage +
        `${res[i].name}     ${res[i].lastValue} (${res[i].change} | ${res[i].changePct})\n`;
    }

    resolve(textMessage + "\n");
  });
});

const commodities = new Promise((resolve, reject) => {
  Promise.all(promises).then((res) => {
    console.log(r);
    const chartLabels = res.map((r) => r.symbol);
    const values = res.map((r) =>
      numeral(r.changePct.replace("%", "")).value()
    );
    const colours = values.map((value) => (value < 0 ? "red" : "green"));
    const today = moment().format("MMM Do, YYYY");

    const path = Path.resolve(
      "C://Users//Administrator//Documents//MarketData",
      "comm_" + moment().format("YYYYMMDD") + ".png"
    );

    const chartData = {
      labels: chartLabels,
      datasets: [
        {
          label: "",
          data: values,
          backgroundColor: colours,
          borderColor: "rgb(255, 255, 255)",
          borderWidth: 4,
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
              const commData = res.find(
                (r) => numeral(r.changePct.replace("%", "")).value() == value
              );
              return commData.lastValue + "\n(" + value + "%)";
            },
            align: "top",
            anchor: "end",
            offset: 15,
          },
        },
        layouts: {
          padding: {
            bottom: 50,
          },
        },
        legend: {
          display: false,
        },
        title: {
          display: true,
          padding: 50,
          text: `COMMODITIES - ${today}`,
        },
        axes: {
          display: true,
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
                labelString: "% Change",
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
                labelString: "Commodities",
                fontSize: 30,
                fontColor: "yellow",
                padding: 55,
              },
            },
          ],
        },
      },
    };

    chartJSNodeCanvas
      .renderToDataURL(configuration, "images/png")
      .then((res) => {
        const imageFile = res.replace(/^data:image\/png;base64,/, "");
        fs.writeFile(path, imageFile, "base64", (err1) => {
          if (err1) console.error(err1);

          jimp.read(path, (err2, file) => {
            if (err2) console.error(err2);

            jimp.read(
              "C://Users//Administrator//Documents//Github//kangritel_bot/t4c.png",
              (err3, logo) => {
                if (err3) console.error(err3);

                file
                  .composite(logo.scaleToFit(2560, jimp.AUTO), 0, -620, {
                    opacitySource: 0.2,
                  })
                  .quality(100)
                  .writeAsync(path)
                  .then(() => {
                    resolve(true);
                  });
              }
            );
          });
        });
      });
  });
});

module.exports = { commoditiesText, commodities };
