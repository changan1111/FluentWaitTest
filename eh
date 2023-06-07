keytool -import -trustcacerts -alias <alias_name> -file <path_to_certificate> -keystore <path_to_cacerts_file>


import pandas as pd
import matplotlib.pyplot as plt
from sqlalchemy import create_engine

# Connect to the SQL Server database using SQLAlchemy
engine = create_engine('mssql+pyodbc://your_username:your_password@your_server_name/your_database_name')

# Execute a SQL query to retrieve the load time data
query = "SELECT page_name, load_time FROM your_table_name"
df = pd.read_sql(query, engine)

# Close the database connection
engine.dispose()

# Group the data by page_name and calculate the average load time for each page
average_load_times = df.groupby('page_name')['load_time'].mean()

# Plotting the bar graph
plt.bar(average_load_times.index, average_load_times.values)
plt.xlabel('Page')
plt.ylabel('Average Load Time (ms)')
plt.title('Average Load Time for Each Page')
plt.xticks(rotation=45)
plt.show()















import java.sql.*;
import java.util.HashMap;
import java.util.Map;
import org.jfree.chart.ChartFactory;
import org.jfree.chart.ChartFrame;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.data.category.DefaultCategoryDataset;

public class Main {
    public static void main(String[] args) {
        String url = "jdbc:sqlserver://your_server_name:1433;databaseName=your_database_name;";
        String username = "your_username";
        String password = "your_password";

        try (Connection connection = DriverManager.getConnection(url, username, password)) {
            String query = "SELECT page_name, load_time FROM your_table_name";

            try (Statement statement = connection.createStatement();
                 ResultSet resultSet = statement.executeQuery(query)) {

                // Map to store total load times and count of pages
                Map<String, Integer> totalLoadTimes = new HashMap<>();
                Map<String, Integer> pageCount = new HashMap<>();

                while (resultSet.next()) {
                    String pageName = resultSet.getString("page_name");
                    int loadTime = resultSet.getInt("load_time");

                    // Update the total load time and page count for each page
                    totalLoadTimes.put(pageName, totalLoadTimes.getOrDefault(pageName, 0) + loadTime);
                    pageCount.put(pageName, pageCount.getOrDefault(pageName, 0) + 1);
                }

                // Calculate the average load time for each page
                Map<String, Integer> averageLoadTimes = new HashMap<>();
                for (String pageName : totalLoadTimes.keySet()) {
                    int total = totalLoadTimes.get(pageName);
                    int count = pageCount.get(pageName);
                    int average = total / count;
                    averageLoadTimes.put(pageName, average);
                }

                // Create a dataset for the chart
                DefaultCategoryDataset dataset = new DefaultCategoryDataset();
                for (String pageName : averageLoadTimes.keySet()) {
                    int average = averageLoadTimes.get(pageName);
                    dataset.addValue(average, "Average Load Time", pageName);
                }

                // Create a bar chart
                JFreeChart chart = ChartFactory.createBarChart(
                    "Average Load Time for Each Page",
                    "Page",
                    "Average Load Time (ms)",
                    dataset,
                    PlotOrientation.VERTICAL,
                    true,
                    true,
                    false
                );

                // Display the chart in a frame
                ChartFrame frame = new ChartFrame("Load Time Chart", chart);
                frame.pack();
                frame.setVisible(true);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
