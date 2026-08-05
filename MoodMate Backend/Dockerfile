FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY . .

RUN chmod +x ./mvnw ./render-start.sh \
  && ./mvnw -DskipTests package

CMD ["bash", "./render-start.sh"]
