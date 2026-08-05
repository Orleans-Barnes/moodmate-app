FROM maven:3.9.9-eclipse-temurin-17

WORKDIR /app

COPY . .

RUN chmod +x ./render-start.sh \
  && mvn -DskipTests package spring-boot:repackage

CMD ["bash", "./render-start.sh"]
