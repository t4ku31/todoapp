# === build stage ===
FROM maven:3.9.8-eclipse-temurin-17 AS builder
WORKDIR /app
COPY . .
RUN mvn clean compile
RUN mvn clean package -DskipTests

# === run stage ===
FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY --from=builder /app/target/resource-server.jar /app/app.jar
CMD ["java", "-jar", "/app/app.jar"]