const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('mssql');
const Chart = require('chart.js');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const dbConfig = {
  server: '{hostname}\\MSSQLSERVER02',
  database: 'master',
  user: 'sa',
  password: 'password',
  options: {
    encrypt: true,
    enableArithAbort: true
  }
};

// Chart configuration
const chartConfig = {
  type: 'line',
  data: {
    labels: [], // Array of dates
    datasets: [] // Array of datasets for each page
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

// Route for generating the chart
app.get('/', async (req, res) => {
  try {
    const groupByDate = req.query.groupByDate === 'true'; // Check if "groupByDate" query parameter is set to true

    const pageLoadTimes = await getPageLoadTimes();

    // Prepare the chart data
    const dates = []; // Array of dates
    const datasets = []; // Array of datasets for each page

    // Iterate over the page load times and populate the dates and datasets arrays
    pageLoadTimes.forEach((entry) => {
      const date = entry.Date.toISOString().split('T')[0];
      const loadTime = entry.LoadTime;

      if (groupByDate) {
        // Group by date
        const dateIndex = dates.indexOf(date);
        if (dateIndex === -1) {
          dates.push(date);
          datasets.push({
            label: entry.PageName,
            data: [loadTime],
            backgroundColor: getRandomColor(),
            borderColor: getRandomColor(),
            fill: false
          });
        } else {
          datasets[dateIndex].data.push(loadTime);
        }
      } else {
        // Each record as a separate run
        dates.push(`${entry.PageName} - ${date}`);
        datasets.push({
          label: entry.PageName,
          data: [loadTime],
          backgroundColor: getRandomColor(),
          borderColor: getRandomColor(),
          fill: false
        });
      }
    });

    // Update the chart configuration with the prepared data
    chartConfig.data.labels = dates;
    chartConfig.data.datasets = datasets;

    // Generate the chart image
    const width = 800; // Width of the chart image
    const height = 400; // Height of the chart image
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
    const image = await chartJSNodeCanvas.renderToBuffer(chartConfig);

    // Prepare the HTML template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Page Load Time</title>
        <style>
          .container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .chart-container {
            flex-basis: 70%;
          }
          .list-container {
            flex-basis: 30%;
            padding-left: 20px;
          }
          .list-item {
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="chart-container">
            <canvas id="chart"></canvas>
          </div>
          <div class="list-container">
            <h3>Page List</h3>
            <ul>
              ${pageLoadTimes.map((entry) => `<li class="list-item">${entry.PageName}</li>`).join('')}
            </ul>
          </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>
          var chartData = ${JSON.stringify(chartConfig.data)};
          var chartOptions = ${JSON.stringify(chartConfig.options)};
          var ctx = document.getElementById('chart').getContext('2d');
          new Chart(ctx, {
            type: chartConfig.type,
            data: chartData,
            options: chartOptions
          });
        </script>
      </body>
      </html>
    `;

    // Send the HTML template as the response
    res.send(htmlTemplate);
  } catch (error) {
    console.error('Error generating chart:', error);
    res.status(500).send('Error generating chart');
  }
});

// Start the server
app.listen(3000, () => {
  console.log(`Server is listening on http://localhost:3000`);
});
