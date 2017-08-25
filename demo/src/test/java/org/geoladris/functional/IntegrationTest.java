package org.geoladris.functional;

import static junit.framework.Assert.assertTrue;
import static org.mockito.Mockito.mock;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Properties;
import java.util.regex.Pattern;

import org.apache.catalina.Context;
import org.apache.catalina.Globals;
import org.apache.catalina.webresources.StandardRoot;
import org.apache.commons.io.IOUtils;
import org.apache.http.NameValuePair;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.message.BasicNameValuePair;
import org.eclipse.jetty.plus.jndi.Resource;
import org.eclipse.jetty.plus.webapp.EnvConfiguration;
import org.eclipse.jetty.plus.webapp.PlusConfiguration;
import org.eclipse.jetty.server.Connector;
import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.bio.SocketConnector;
import org.eclipse.jetty.server.handler.DefaultHandler;
import org.eclipse.jetty.server.handler.HandlerCollection;
import org.eclipse.jetty.webapp.WebAppContext;
import org.geoladris.Environment;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.postgresql.Driver;
import org.postgresql.ds.PGSimpleDataSource;

public class IntegrationTest {
  public static final String PROPERTIES = "/integration-tests.properties";
  public static final String CONFIG_DIR = "/config-dir";

  public static final String PORTAL_PROPERTIES = "portal.properties";
  public static final String PORTAL_PROPERTIES_TEMPLATE = "portal.properties.template";

  public static final String ENV_EMAIL_PASSWORD = "GEOLADRIS_EMAIL_PASSWORD";

  public static final String PROP_DB_URL = "db-url";
  public static final String PROP_DB_USER = "db-user";
  public static final String PROP_DB_PASS = "db-pass";
  public static final String PROP_DB_SCHEMA = "db-schema";

  private static final String CONTEXT_PATH = "demo";
  private static String dbUrl;
  private static String dbUser;
  private static String dbPass;
  protected static String dbSchema;

  @BeforeClass
  public static void setupTests() throws IOException, ClassNotFoundException {
    Properties props = new Properties();
    InputStream stream = IntegrationTest.class.getResourceAsStream(PROPERTIES);
    props.load(stream);
    stream.close();

    dbUrl = props.getProperty(PROP_DB_URL);
    dbUser = props.getProperty(PROP_DB_USER);
    dbPass = props.getProperty(PROP_DB_PASS);
    dbSchema = props.getProperty(PROP_DB_SCHEMA);

    Class.forName(Driver.class.getCanonicalName());
  }

  private Server server;
  private PGSimpleDataSource dataSource;

  @Before
  public void setup() throws Exception {
    File configDir = new File(getClass().getResource(CONFIG_DIR).getFile());
    File appConfigDir = new File(configDir, CONTEXT_PATH);
    File template = new File(appConfigDir, PORTAL_PROPERTIES_TEMPLATE);
    File portalProperties = new File(appConfigDir, PORTAL_PROPERTIES);
    System.setProperty(Environment.CONFIG_DIR, configDir.getAbsolutePath());

    // Replace password with environment variable
    String contents = IOUtils.toString(new FileInputStream(template));
    contents = contents.replaceAll(Pattern.quote("$password"), Environment.getInstance().get(ENV_EMAIL_PASSWORD));
    OutputStream output = new FileOutputStream(portalProperties);
    IOUtils.write(contents, output);
    output.close();

    // Clean the database
    Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPass);
    Statement st = conn.createStatement();
    st.execute("DROP SCHEMA IF EXISTS " + dbSchema + " CASCADE");
    st.execute("CREATE SCHEMA " + dbSchema);
    conn.close();

    // Start the server
    server = new Server();

    WebAppContext handler = new WebAppContext();
    handler.setContextPath("/" + CONTEXT_PATH);
    handler.setWar("target/demo.war");
    StandardRoot root = new StandardRoot();
    root.setContext(mock(Context.class));
    handler.getServletContext().setAttribute(Globals.RESOURCES_ATTR, root);

    List<String> config = new ArrayList<String>();
    Collections.addAll(config, handler.getConfigurationClasses());
    config.add(EnvConfiguration.class.getCanonicalName());
    config.add(PlusConfiguration.class.getCanonicalName());
    handler.setConfigurationClasses(config.toArray(new String[config.size()]));

    HandlerCollection handlers = new HandlerCollection();
    handlers.setHandlers(new Handler[] {handler, new DefaultHandler()});
    server.setHandler(handlers);

    SocketConnector connector = new SocketConnector();
    connector.setPort(8880);
    server.setConnectors(new Connector[] {connector});

    dataSource = new PGSimpleDataSource();
    dataSource.setUser(dbUser);
    dataSource.setPassword(dbPass);
    dataSource.setUrl(dbUrl);
    new Resource(handler, "jdbc/geoladris", dataSource);

    server.start();

    // Install data tables in integration_tests
    execute(getScript("redd_feedback.sql").replaceAll("redd_feedback",
        "integration_tests.redd_feedback"));
    execute(getScript("redd_stats_metadata.sql").replaceAll("CREATE TABLE ",
        "CREATE TABLE integration_tests."));
    // Install functions in public
    executeDelimitedScript("redd_stats_calculator.sql");
    execute(getScript("redd_stats_fajas.sql").replaceAll("redd_stats_fajas",
        "integration_tests.redd_stats_fajas"));

    // Install test data
    executeLines("/sql/data.sql", "schemaName", dbSchema);
  }

  @After
  public void stop() throws Exception {
    server.stop();
  }

  protected Object query(String sql) throws SQLException {
    Connection conn = dataSource.getConnection();
    Statement st = conn.createStatement();
    ResultSet resultSet = st.executeQuery(sql);
    assertTrue(resultSet.next());
    Object ret = resultSet.getObject(1);
    resultSet.close();
    st.close();
    conn.close();
    return ret;
  }

  protected void execute(String sql) throws SQLException {
    Connection conn = this.dataSource.getConnection();
    Statement st = conn.createStatement();
    st.execute(sql);
    st.close();
    conn.close();
  }

  /**
   * Executes statements delimited by --- in the specified resource.
   */
  private void executeDelimitedScript(String resourceName) throws IOException, SQLException {
    String script = getScript(resourceName);
    String[] lines = script.split(Pattern.quote("---"));
    for (String line : lines) {
      executeSQLStatement(line);
    }
  }

  protected String getScript(String resourceName) throws IOException {
    InputStream stream = IntegrationTest.class.getResourceAsStream("/sql/" + resourceName);
    String script = IOUtils.toString(stream);
    stream.close();
    return script;
  }

  private void executeSQLStatement(String script, String... params) throws SQLException {
    for (int i = 0; i < params.length; i += 2) {
      script = script.replaceAll(Pattern.quote("$" + params[i]), params[i + 1]);
    }
    execute(script);
  }

  protected void executeLines(String resourceName, String... params)
      throws IOException, SQLException {
    InputStream stream = IntegrationTest.class.getResourceAsStream(resourceName);
    BufferedReader reader = new BufferedReader(new InputStreamReader(stream));
    String line = null;
    while ((line = reader.readLine()) != null) {
      executeSQLStatement(line, params);
    }

    stream.close();
  }

  protected CloseableHttpResponse GET(String path, String... parameters)
      throws ClientProtocolException, IOException {
    String url = "http://localhost:8880/" + CONTEXT_PATH + "/" + path + "?";
    for (int i = 0; i < parameters.length; i = i + 2) {
      url += parameters[i] + "=" + URLEncoder.encode(parameters[i + 1], "UTF-8") + "&";
    }
    CloseableHttpClient httpClient = HttpClients.createDefault();
    HttpGet get = new HttpGet(url);
    return httpClient.execute(get);
  }

  protected CloseableHttpResponse POST(String path, String... parameters)
      throws ClientProtocolException, IOException {
    String url = "http://localhost:8880/" + CONTEXT_PATH + "/" + path;
    ArrayList<NameValuePair> parameterList = new ArrayList<NameValuePair>();
    for (int i = 0; i < parameters.length; i = i + 2) {
      parameterList.add(new BasicNameValuePair(parameters[i], parameters[i + 1]));
    }
    CloseableHttpClient httpClient = HttpClients.createDefault();
    HttpPost put = new HttpPost(url);
    put.setEntity(new UrlEncodedFormEntity(parameterList));
    return httpClient.execute(put);
  }
}
