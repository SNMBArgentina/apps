package org.geoladris.functional.stats;

import static junit.framework.Assert.assertEquals;
import static junit.framework.Assert.assertTrue;

import java.io.IOException;

import org.apache.commons.io.IOUtils;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.geoladris.functional.IntegrationTest;
import org.junit.Ignore;
import org.junit.Test;

import net.sf.json.JSONArray;
import net.sf.json.JSONNull;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

public class StatsIT extends IntegrationTest {

  @Test
  public void testStatsService() throws Exception {
    String layerName = "bosques:provincias";
    execute(getScript("stats-service-test.sql"));
    JSONArray indicators = getIndicators(layerName);

    CloseableHttpResponse ret =
        GET("indicator", "indicatorId", indicators.getJSONObject(0).getString("id"), "layerId",
            layerName, "objectId", "1", "objectName", "Buenos Aires");
    assertEquals(200, ret.getStatusLine().getStatusCode());
    JSONObject root =
        (JSONObject) JSONSerializer.toJSON(IOUtils.toString(ret.getEntity().getContent()));
    checkStatsServiceTest(root);

  }

  @Test
  public void testStatsServiceNulls() throws Exception {
    String layerName = "bosques:provincias";
    execute(getScript("stats-service-test.sql"));
    JSONArray indicators = getIndicators(layerName);

    CloseableHttpResponse ret =
        GET("indicator", "indicatorId", indicators.getJSONObject(0).getString("id"), "layerId",
            layerName, "objectId", "2", "objectName", "Buenos Aires");
    assertEquals(200, ret.getStatusLine().getStatusCode());
    JSONObject root =
        (JSONObject) JSONSerializer.toJSON(IOUtils.toString(ret.getEntity().getContent()));
    System.out.println(root.toString(4));
    JSONArray series = root.getJSONArray("series");
    assertEquals(2, series.size());
    JSONObject cultivado = series.getJSONObject(0);
    assertEquals("Bosque cultivado", cultivado.getString("name"));
    JSONArray dataCultivado = cultivado.getJSONArray("data");
    assertEquals(0, dataCultivado.getInt(0));
    assertEquals(0, dataCultivado.getInt(1));
    assertEquals(50, dataCultivado.getInt(2));
    JSONObject nativo = series.getJSONObject(1);
    assertEquals("Bosque nativo", nativo.getString("name"));
    JSONArray dataNativo = nativo.getJSONArray("data");
    assertEquals(590, dataNativo.getInt(0));
    assertTrue(dataNativo.get(1) instanceof JSONNull);
    assertEquals(208, dataNativo.getInt(2));

  }

  @Test
  public void testStatsServiceAxisPriority() throws Exception {
    String layerName = "bosques:provincias";
    execute(getScript("stats-service-test-axis-priority.sql"));
    JSONArray indicators = getIndicators(layerName);

    CloseableHttpResponse ret = GET("indicator", "indicatorId",
        indicators.getJSONObject(0).getString("id"), "layerId", layerName, "objectId", "1");
    assertEquals(200, ret.getStatusLine().getStatusCode());
    JSONObject root =
        (JSONObject) JSONSerializer.toJSON(IOUtils.toString(ret.getEntity().getContent()));
    // Values
    JSONArray series = root.getJSONArray("series");
    assertEquals(2, series.size());
    JSONObject nativo = series.getJSONObject(0);
    assertEquals("Bosque nativo", nativo.getString("name"));
    assertEquals(100, nativo.getJSONArray("data").getInt(0));
    JSONObject cultivado = series.getJSONObject(1);
    assertEquals("Bosque cultivado", cultivado.getString("name"));
    assertEquals(1000, cultivado.getJSONArray("data").getInt(0));
  }

  @Test
  public void testStatsServiceOutputDateFormat() throws Exception {
    String layerName = "bosques:provincias";
    execute(getScript("stats-service-test-output-date-format.sql"));
    JSONArray indicators = getIndicators(layerName);

    CloseableHttpResponse ret = GET("indicator", "indicatorId",
        indicators.getJSONObject(0).getString("id"), "layerId", layerName, "objectId", "1");
    assertEquals(200, ret.getStatusLine().getStatusCode());
    JSONObject root =
        (JSONObject) JSONSerializer.toJSON(IOUtils.toString(ret.getEntity().getContent()));
    String firstDate =
        root.getJSONArray("xAxis").getJSONObject(0).getJSONArray("categories").getString(0);
    assertEquals("01->01->1990", firstDate);
  }

  private void checkStatsServiceTest(JSONObject root) {
    System.out.println(root.toString(4));
    assertTrue(root.getJSONObject("title").getString("text").contains("Buenos Aires"));
    assertTrue(root.getJSONObject("title").getString("text").contains("Cobertura forestal"));
    assertEquals("Evolución de la cobertura forestal por provincia",
        root.getJSONObject("subtitle").getString("text"));

    // Check xAxis
    assertEquals(1, root.getJSONArray("xAxis").size());
    JSONArray xAxisCategories =
        root.getJSONArray("xAxis").getJSONObject(0).getJSONArray("categories");
    assertTrue(xAxisCategories.contains("01-01-1990"));
    assertTrue(xAxisCategories.contains("01-01-2000"));
    assertTrue(xAxisCategories.contains("01-01-2005"));

    // Check yAxis
    assertEquals(1, root.getJSONArray("yAxis").size());
    JSONObject yAxis = root.getJSONArray("yAxis").getJSONObject(0);
    assertTrue(yAxis.getJSONObject("title").getString("text").contains("Cobertura"));
    assertTrue(yAxis.getJSONObject("title").getString("text").contains("Hectáreas"));

    // Values
    JSONArray series = root.getJSONArray("series");
    assertEquals(2, series.size());
    JSONObject cultivado = series.getJSONObject(0);
    assertEquals("Bosque cultivado", cultivado.getString("name"));
    assertEquals(1000, cultivado.getJSONArray("data").getInt(0));
    JSONObject nativo = series.getJSONObject(1);
    assertEquals("Bosque nativo", nativo.getString("name"));
    assertEquals(100, nativo.getJSONArray("data").getInt(0));
  }

  @Test
  public void testStatsServiceTwoAxisWithTwoSeries() throws Exception {
    String layerName = "bosques:provincias";
    execute(getScript("stats-service-test-twoaxis-twoseries.sql"));
    JSONArray indicators = getIndicators(layerName);

    CloseableHttpResponse ret =
        GET("indicator", "indicatorId", indicators.getJSONObject(0).getString("id"), "layerId",
            layerName, "objectId", "1", "objectName", "Buenos Aires");
    assertEquals(200, ret.getStatusLine().getStatusCode());
    JSONObject root =
        (JSONObject) JSONSerializer.toJSON(IOUtils.toString(ret.getEntity().getContent()));

    // Check xAxis
    assertEquals(1, root.getJSONArray("xAxis").size());
    JSONArray xAxisCategories =
        root.getJSONArray("xAxis").getJSONObject(0).getJSONArray("categories");
    assertTrue(xAxisCategories.contains("01-01-1990"));
    assertTrue(xAxisCategories.contains("01-01-2000"));
    assertTrue(xAxisCategories.contains("01-01-2005"));

    // Check yAxis
    assertEquals(2, root.getJSONArray("yAxis").size());
    JSONObject axis0 = root.getJSONArray("yAxis").getJSONObject(0);
    assertTrue(axis0.getJSONObject("title").getString("text").contains("Número de incendios"));
    JSONObject axis1 = root.getJSONArray("yAxis").getJSONObject(1);
    assertTrue(axis1.getJSONObject("title").getString("text").contains("Superficie"));

    // Values
    assertEquals(3, root.getJSONArray("series").size());
    JSONObject serie0 = root.getJSONArray("series").getJSONObject(0);
    JSONObject serie1 = root.getJSONArray("series").getJSONObject(1);
    JSONObject serie2 = root.getJSONArray("series").getJSONObject(2);
    assertEquals("Número de incendios", serie0.getString("name"));
    assertEquals("Superficie incendiada", serie1.getString("name"));
    assertEquals("Cobertura forestal", serie2.getString("name"));
    assertEquals(0, serie0.getInt("yAxis"));
    assertEquals(1, serie1.getInt("yAxis"));
    assertEquals(1, serie2.getInt("yAxis"));
  }

  private JSONArray getIndicators(String layerName) throws ClientProtocolException, IOException {
    // Get indicators must return 1 entry
    CloseableHttpResponse ret = GET("indicators", "layerId", layerName);
    assertEquals(200, ret.getStatusLine().getStatusCode());
    JSONArray indicators =
        (JSONArray) JSONSerializer.toJSON(IOUtils.toString(ret.getEntity().getContent()));
    assertEquals(1, indicators.size());
    return indicators;
  }

  @Test
  public void testStatsServiceDataTypes() throws Exception {
    String layerName = "bosques:provincias";
    execute(getScript("stats-service-test-data-types.sql"));
    JSONArray indicators = getIndicators(layerName);

    CloseableHttpResponse ret =
        GET("indicator", "indicatorId", indicators.getJSONObject(0).getString("id"), "layerId",
            layerName, "objectId", "1", "objectName", "Buenos Aires");
    assertEquals(200, ret.getStatusLine().getStatusCode());
    JSONObject root =
        (JSONObject) JSONSerializer.toJSON(IOUtils.toString(ret.getEntity().getContent()));

    checkStatsServiceTest(root);
  }

  @Ignore
  @Test
  public void testCalculateStats() throws Exception {
    String layerName = "unredd:provinces";
    execute("INSERT INTO " + dbSchema + ".redd_stats_metadata (" + "title, "//
        + "subtitle, "//
        + "description, "//
        + "y_label, "//
        + "units, "//
        + "tooltipsdecimals, "//
        + "layer_name, "//
        + "table_name_division, " //
        + "division_field_id,"//
        + "class_table_name, " //
        + "class_field_name," //
        + "date_field_name," //
        + "table_name_data," //
        + "graphic_type" //
        + ")VALUES(" + "'Cobertura forestal',"//
        + "'Evolución de la cobertura forestal',"//
        + "'Muestra la evolución de la cobertura forestal a lo largo de los años',"//
        + "'Cobertura',"//
        + "'km²',"//
        + "2,"//
        + "'" + layerName + "',"//
        + "'" + dbSchema + ".stats_admin',"//
        + "'gid',"//
        + "'" + dbSchema + ".stats_cobertura',"//
        + "'clasificacion',"//
        + "'fecha',"//
        + "'" + dbSchema + ".stats_results',"//
        + "'2D'"//
        + ")");
    Integer indicatorId = (Integer) query("select id from " + dbSchema + ".redd_stats_metadata;");
    execute("SELECT redd_stats_run(" + indicatorId + ", '" + dbSchema + "');");

    // Check total coverage
    Float sum = (Float) query("SELECT sum(valor) from " + dbSchema + ".stats_results");
    assertTrue(Math.abs(sum - 0.0015) < 0.00001);

    // Get indicators must return 1 entry
    CloseableHttpResponse ret = GET("indicators", "layerId", layerName);
    assertEquals(200, ret.getStatusLine().getStatusCode());
    JSONArray indicators =
        (JSONArray) JSONSerializer.toJSON(IOUtils.toString(ret.getEntity().getContent()));
    assertEquals(indicators.size(), 1);

    ret = GET("indicator", "indicatorId", indicators.getJSONObject(0).getString("id"), "layerId",
        layerName, "objectId", "1");
    assertEquals(200, ret.getStatusLine().getStatusCode());
    assertTrue(ret.getEntity().getContentType().getValue().contains("text/html"));
  }
}
