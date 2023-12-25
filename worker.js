const {
    publish,
    subscribe,
    onMessage,
    setRedisWithTTL,
} = require("./helper/redis");

const {
    getLiquidBrokSumDataFromDB,
} = require("./helper/mongo");

const {
    formatTF,
    formatAccType,
} = require("./helper/formatter");

const fs = require('fs');
const parse = require('csv-parse');

subscribe('start_computation');

onMessage((channel, message) => {
    if (channel === 'start_computation') {
        const { jobId, tf, ad, number } = JSON.parse(message);

        let tickerData = [];
        let finalData = [];
        let itemsProcessed = 1;
        let textMessage = "";
        let index = 0;

        fs
            .ReadStream("ticker.csv")
            .pipe(parse({ headers: false }))
            .on("data", (row) => {
                if (row[0].length === 4) {
                    tickerData.push(row[0]);
                }
            })
            .on("end", () => {
                tickerData.forEach((ticker) => {
                    getLiquidBrokSumDataFromDB(ticker, tf, ad, number).then((res) => {
                        if (res) {
                            finalData.push(res);
                        }

                        if (itemsProcessed == tickerData.length) {
                            textMessage = `<b>Bandar Accum ${formatTF(tf)} ${formatAccType(
                                ad,
                                number
                            )}</b>`;
                            finalData
                                .sort((a, b) => {
                                    return b.pct - a.pct;
                                })
                                .map((fd) => {
                                    const newTextMessage = `\n\n<b>${fd.ticker}</b>\nAccum %: ${fd.pct}\nAcc Status: ${fd.accdist}`;
                                    textMessage = `${textMessage}${newTextMessage}`;
                                    if (index !== 0 && index % 10 == 0) {
                                        // Publish a message to indicate that the result is ready, including the job ID
                                        setRedisWithTTL(`${tf}:${ad}:${number}`, textMessage);

                                        publish('computation_done', JSON.stringify({
                                            jobId,
                                            result: textMessage
                                        }));
                                        textMessage = "";
                                    }
                                    index++;
                                });
                        }
                        itemsProcessed++;
                    });
                });
            });
    }
});