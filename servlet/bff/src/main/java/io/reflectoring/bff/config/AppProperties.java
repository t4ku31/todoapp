package io.reflectoring.bff.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app")
public class AppProperties {

    private String baseUrl;
    private String resourceServerUrl;
    private String frontServerUrl;

    public String getBaseUrl() {
        return this.baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getResourceServerUrl() {
        return this.resourceServerUrl;
    }

    public void setResourceServerUrl(String resourceServerUrl) {
        this.resourceServerUrl = resourceServerUrl;
    }

    public String getFrontServerUrl() {
        return this.frontServerUrl;
    }

    public void setFrontServerUrl(String frontServerUrl) {
        this.frontServerUrl = frontServerUrl;
    }

}
