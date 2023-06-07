const express = require('express');
const sql = require('mssql');
const Chart = require('chart.js');

// SQL Server connection configuration
const config = {
  user: '<username>',
  password: '<password>',
  server: '<server>',
  database: '<database>',
  options: {
    encrypt: true, // Set to true if using Azure
  },
};

// Fetch the page load times from the SQL Server database
async function getPageLoadTimes() {
  try {
    // Connect to the SQL Server
    await sql.connect(config);

    // Query the database to get the page load times
    const result = await sql.query('SELECT * FROM <table>');

    return result.recordset;
  } finally {
    // Close the connection
    await sql.close();
  }
}

// Create an Express app
const app = express();
const port = 3000;

// Serve static files
app.use(express.static('public'));

// Define the route for generating the graph
app.get('/', (req, res) => {
  getPageLoadTimes()
    .then(pageLoadTimes => {
      // Group page load times by date and page name
      const groupedData = {};
      pageLoadTimes.forEach(entry => {
        const { date, pageName, loadTime } = entry;
        if (!groupedData[date]) {
          groupedData[date] = {};
        }
        groupedData[date][pageName] = loadTime;
      });

      // Prepare data for Chart.js
      const dates = Object.keys(groupedData).sort();
      const pageNames = Array.from(new Set(pageLoadTimes.map(entry => entry.pageName)));
      const datasets = pageNames.map((pageName, index) => {
        const data = dates.map(date => groupedData[date][pageName] || null);
        const color = getRandomColor();
        return {
          label: pageName,
          data: data,
          backgroundColor: color,
          borderColor: color,
          fill: false,
        };
      });

      // Create a line chart using Chart.js
      const chartData = {
        labels: dates,
        datasets: datasets,
      };
      const chartOptions = {
        responsive: true,
        title: {
          display: true,
          text: 'Page Load Times',
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Date',
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Load Time',
            },
          },
        },
      };
      const chartConfig = {
        type: 'line',
        data: chartData,
        options: chartOptions,
      };
      const chartMarkup = `<canvas id="pageLoadChart" width="800" height="400"></canvas>
                          <script>
                            const ctx = document.getElementById('pageLoadChart').getContext('2d');
                            new Chart(ctx, ${JSON.stringify(chartConfig)});
                          </script>`;

      // Send the rendered HTML with the graph to the client
      res.send(chartMarkup);
    })
    .catch(err => {
      console.error('Error retrieving page load times:', err);
      res.status(500).send('Internal Server Error');
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Helper function to generate random colors
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
