const axios = require("axios");
const { mapping } = require("./mapping");
const { mapResponse } = require("./function");

function callWGB(durata) {
  return axios({
    method: "GET",
    url: "http://www.worldgovernmentbonds.com/wp-admin/admin-ajax.php",
    params: {
      action: "jsonStoricoCds",
      area: 39,
      dateRif: "2099-12-31",
      durata,
    },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "en-US,en;q=0.5",
      Referer: "http://www.worldgovernmentbonds.com",
      "Content-Type": "application/json",
      Origin: "http://www.worldgovernmentbonds.com",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
}

async function wgb(input) {
  try {
    if (!input) {
      throw Error("Parameter input is required");
    }
    const endpoint = mapping[input];
    if (!endpoint) {
      throw Error(`No mapping found for ${input}, check mapping.js`);
    }
    const response = await callWGB(endpoint.durata, endpoint.name);

    if (response.data.num == 0) {
      throw Error("No response data", mapping[input]);
    }

    const results = mapResponse(response.data, endpoint.name);
    return results;
  } catch (err) {
    console.error(err.message);
  }
}

exports.wgb = wgb;
