const { tv, tvPrice } = require("../tradingview/index");

const numeral = require("numeral");
const fs = require("fs");
const jimp = require("jimp");
const moment = require("moment");

const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

const Path = require("path");
const { investing } = require("../investing");

const width = 1920; //px
const height = 1080; //px
const chartCallback = (ChartJS) => {
  // Global config example: https://www.chartjs.org/docs/latest/configuration/
  ChartJS.defaults.global.elements.rectangle.borderWidth = 2;
  ChartJS.defaults.global.defaultFontColor = "#fff";
  ChartJS.defaults.global.defaultFontSize = 30;
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

const dow = tv("indices/us-30");
const dowFut = investing("indices-futures/us-30");
const nasdaq = tv("indices/nq-100-ixic");
const sp500 = tv("indices/us-spx-500");

// Europe Indices
const uk100 = tvPrice("indices/uk-100");
const dax = tvPrice("indices/germany-30");
const cac = tvPrice("indices/france-40");

const nikkei = tvPrice("indices/japan-ni225");
const hsi = tvPrice("indices/hongkong-hk50");
const sec = tvPrice("indices/shanghai-sec");
const szse = tvPrice("indices/shenzen-sec");
const kospi = tvPrice("indices/korea-ks11");
const nifty = tvPrice("indices/india-nifty50");
const sti = tv("indices/sti");
const fbmklci = tvPrice("indices/malaysia-fbmklci");
const jkse = tvPrice("indices/indonesia-jkse");
const lq45 = tvPrice("indices/indonesia-lq45");

const promises = [
  dow,
  dowFut,
  nasdaq,
  sp500,
  uk100,
  dax,
  cac,
  nikkei,
  hsi,
  sec,
  szse,
  kospi,
  nifty,
  sti,
  fbmklci,
  jkse,
  lq45,
];

const indicesText = new Promise((resolve, reject) => {
  Promise.all(promises).then((res) => {
    let textMessage = "";

    for (i = 0; i < res.length; i++) {
      if (i == 4) textMessage = textMessage + "\n";
      if (i == 7) textMessage = textMessage + "\n";

      textMessage =
        textMessage +
        `${res[i].name}     ${res[i].lastValue} (${res[i].change} | ${res[i].changePct})\n`;
    }

    resolve(textMessage + "\n");
  });
});

const indices = (region) =>
  new Promise((resolve, reject) => {
    Promise.all(promises).then((res) => {
      const filtered = res.filter((r) => r.region == region);
      const chartLabels = filtered.map((r) => r.symbol);
      const values = filtered.map((r) =>
        numeral(r.changePct.replace("%", "")).value()
      );
      const colours = values.map((value) => (value < 0 ? "red" : "green"));

      const path = Path.resolve(
        "C://Users//Administrator//Documents//MarketData",
        "indices_" + region + ".png"
      );
      const today = moment().format("MMM Do, YYYY");

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
          legend: {
            display: false,
          },
          title: {
            display: true,
            padding: 50,
            text: `${region} INDEXES - ${today}`,
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
                  labelString: "Indexes",
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
                    .composite(logo.scaleToFit(1920, jimp.AUTO), 0, -480, {
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

module.exports = { indicesText, indices };
