const fs = require("fs");
// JSON data
// const data = require("./data.json");
// Build paths
const { buildPathHtml } = require("./buildPath");

/**
 * Take an object which has the following model
 * @param {Object} item
 * @model
 * {
 *   "invoiceId": `Number`,
 *   "createdDate": `String`,
 *   "dueDate": `String`,
 *   "address": `String`,
 *   "companyName": `String`,
 *   "invoiceName": `String`,
 *   "price": `Number`,
 * }
 *
 * @returns {String}
 */
const createRow = (item) => `
  <tr>
    <td>${item.code}</td>
    <td>${item.periode}</td>
    <td>${item.payment_method}</td>
    <td>${item.merchant}</td>
    <td>${item.optimal} / ${item.gross_yield} (${item.nominal})</td>
    <td>${item.quota ? item.quota : ""}</td>
    <td>${item.notes ? item.notes : ""}</td>
  </tr>
`;

/**
 * @description Generates an `html` table with all the table rows
 * @param {String} rows
 * @returns {String}
 */
const createTable = (rows) => `
  <table>
    <tr>
        <th>Program</td>
        <th>Periode</td>
        <th>Pay Method</td>
        <th>Merchant</td>
        <th>Program</td>
        <th>Quota</td>
        <th>Notes</td>
    </tr>
    ${rows}
  </table>
`;

/**
 * @description Generate an `html` page with a populated table
 * @param {String} table
 * @returns {String}
 */
const createHtml = (table) => `
  <html>
    <head>
      <style>
        table {
          width: 100%;
        }
        tr {
          text-align: left;
          border: 1px solid black;
        }
        th, td {
          padding: 15px;
        }
        tr:nth-child(odd) {
          background: #CCC
        }
        tr:nth-child(even) {
          background: #FFF
        }
        .no-content {
          background-color: red;
        }
      </style>
    </head>
    <body>
      ${table}
    </body>
  </html>
`;

/**
 * @description this method takes in a path as a string & returns true/false
 * as to if the specified file path exists in the system or not.
 * @param {String} filePath
 * @returns {Boolean}
 */
const doesFileExist = (filePath) => {
  try {
    fs.statSync(filePath); // get information of the specified file path.
    return true;
  } catch (error) {
    return false;
  }
};

const htmlTable = (data) => {
  try {
    /* Check if the file for `html` build exists in system or not */
    if (doesFileExist(buildPathHtml)) {
      console.log("Deleting old build file");
      /* If the file exists delete the file from system */
      fs.unlinkSync(buildPathHtml);
    }
    /* generate rows */
    const rows = data.map(createRow).join("");
    /* generate table */
    const table = createTable(rows);
    /* generate html */
    const html = createHtml(table);
    /* write the generated html to file */
    fs.writeFileSync(buildPathHtml, html);
    console.log("Succesfully created an HTML table");
  } catch (error) {
    console.log("Error generating table", error);
  }
};

module.exports = {
  htmlTable,
};
