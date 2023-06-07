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
