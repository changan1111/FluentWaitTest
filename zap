import org.openqa.selenium.Proxy;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.testng.annotations.AfterSuite;
import org.testng.annotations.BeforeSuite;
import org.testng.annotations.Test;
import org.zaproxy.clientapi.core.Alert;
import org.zaproxy.clientapi.core.ClientApi;

import java.util.List;

public class ZAPTestNGExample {
    private WebDriver driver;
    private ClientApi zapClient;
    private String zapProxyHost = "localhost";
    private int zapProxyPort = 8080;

    @BeforeSuite
    public void setUp() {
        // Set the path to the ChromeDriver executable
        System.setProperty("webdriver.chrome.driver", "/path/to/chromedriver");

        // Configure ChromeOptions to use the ZAP proxy
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--proxy-server=http://" + zapProxyHost + ":" + zapProxyPort);

        // Create a Proxy object with the ZAP proxy details
        Proxy proxy = new Proxy();
        proxy.setHttpProxy(zapProxyHost + ":" + zapProxyPort);
        proxy.setSslProxy(zapProxyHost + ":" + zapProxyPort);
        options.setProxy(proxy);

        // Create a new instance of ChromeDriver with the configured options
        driver = new ChromeDriver(options);

        // Create an instance of the ZAP API client
        zapClient = new ClientApi(zapProxyHost, zapProxyPort);
    }

    @Test
    public void sampleTest() {
        // Perform your test actions using the WebDriver
        driver.get("https://example.com");
        // ... Perform additional test steps
    }

    @AfterSuite
    public void tearDown() {
        // Quit the WebDriver instance
        driver.quit();

        // Retrieve all alerts from ZAP
        List<Alert> alerts = zapClient.core.alerts();

        // Filter alerts based on risk level (High, Medium, Low)
        List<Alert> highAlerts = filterAlertsByRisk(alerts, Alert.Risk.High);
        List<Alert> mediumAlerts = filterAlertsByRisk(alerts, Alert.Risk.Medium);
        List<Alert> lowAlerts = filterAlertsByRisk(alerts, Alert.Risk.Low);

        // Print the number of alerts for each risk level
        System.out.println("High Alerts: " + highAlerts.size());
        System.out.println("Medium Alerts: " + mediumAlerts.size());
        System.out.println("Low Alerts: " + lowAlerts.size());

        // Generate the HTML report
        byte[] htmlReport = zapClient.core.htmlreport();

        // Save the report to a file
        String reportFilePath = "/path/to/report.html";
        try (OutputStream outputStream = new FileOutputStream(reportFilePath)) {
            outputStream.write(htmlReport);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private List<Alert> filterAlertsByRisk(List<Alert> alerts, Alert.Risk risk) {
        return alerts.stream()
                .filter(alert -> alert.getRisk().equals(risk))
                .collect(Collectors.toList());
    }
}
