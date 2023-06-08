const express = require('express');
const bodyparser = require('body-parser');
const cors = require('cors');
const sql = require('mssql');
const Chart = require('chart.js');

const app = express();
app.use(cors());
app.use(bodyparser.json());

var dbConfig = {
  server: '{hostname}\\MSSQLSERVER02',
  database: 'master',
  user: 'sa',
  password: 'password',
  options: {
    encrypt: true,
    enableArithAbort: true,
    trustServerCertificate: true
  }
};

// Fetch the page load times from the SQL Server database
async function getPageLoadTimes() {
  try {
    await sql.connect(dbConfig);

    const result = await sql.query('SELECT * FROM Performance');

    return result.recordset;
  } catch (error) {
    console.error('Error fetching page load times:', error);
    throw error;
  } finally {
    await sql.close();
  }
}

// Generate a random color
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Route for rendering the chart page
app.get('/', async (req, res) => {
  try {
    const pageLoadTimes = await getPageLoadTimes();

    // Prepare the chart data
    const dates = []; // Array of dates
    const datasets = []; // Array of datasets for each page

    // Iterate over the page load times and populate the dates and datasets arrays
    pageLoadTimes.forEach((entry) => {
      const date = entry.Date.toISOString().split('T')[0];
      const pageName = entry.PageName.toLowerCase();

      // Find the index of the date in the dates array
      const dateIndex = dates.indexOf(date);

      // Find the dataset for the current page name
      let dataset = datasets.find((data) => data.label.toLowerCase() === pageName);

      // If the date is not found, add it to the dates array
      if (dateIndex === -1) {
        dates.push(date);
      }

      // If the dataset for the page name doesn't exist, create a new one
      if (!dataset) {
        dataset = {
          label: entry.PageName,
          data: [],
          backgroundColor: getRandomColor(),
          borderColor: getRandomColor(),
          fill: false
        };
        datasets.push(dataset);
      }

      // Update the dataset with the load time for the current date
      dataset.data[dateIndex] = entry.LoadTime;
    });

    // Fill in missing load times with null values for each dataset
    datasets.forEach((dataset) => {
      for (let i = 0; i < dates.length; i++) {
        if (dataset.data[i] === undefined) {
          dataset.data[i] = null;
        }
      }
    });

    // Create the HTML page with the chart
    const chartHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Page Load Time Chart</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
      <canvas id="chartCanvas"></canvas>
      <script>
        const ctx = document.getElementById('chartCanvas').getContext('2d');
        const chartConfig = {
          type: 'line',
          data: {
            labels: ${JSON.stringify(dates)},
            datasets: ${JSON.stringify(datasets)}
          },
          options: {
            responsive: true,
            title: {
              display: true,
              text: 'Page Load Time'
            },
            scales: {
              x: {
                display: true,
                title: {
                  display: true,
                  text: 'Date'
                }
              },
              y: {
                display: true,
                title: {
                  display: true,
                  text: 'Load Time (ms)'
                }
              }
            }
          }
        };
        new Chart(ctx, chartConfig);
      </script>
    </body>
    </html>
    `;

    // Set the response headers
    res.setHeader('Content-Type', 'text/html');
    res.send(chartHtml);
  } catch (error) {
    console.error('Error generating chart:', error);
    res.status(500).send('Error generating chart');
  }
});

// Start the server
app.listen(3000, () => {
  console.log(`Server is listening on http://localhost:3000`);
});
