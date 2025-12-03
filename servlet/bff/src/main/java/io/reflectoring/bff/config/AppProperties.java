package io.reflectoring.bff.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app")
public class AppProperties {

    private final ResourceServer resourceServer = new ResourceServer();

    public ResourceServer getResourceServer() {
        return this.resourceServer;
    }

    public static class ResourceServer {

        private String url;

        public String getUrl() {
            return this.url;
        }

        public void setUrl(String url) {
            this.url = url;
        }
    }

}
