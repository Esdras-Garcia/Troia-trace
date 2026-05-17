FROM gradle:jdk21 AS build

WORKDIR /app
COPY settings.gradle build.gradle ./
COPY src ./src
RUN gradle bootJar --no-daemon -x test

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
ENV PORT=8085
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8085
CMD ["java", "-jar", "app.jar"]
