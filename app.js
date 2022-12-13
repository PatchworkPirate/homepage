import express, { response } from "express";
import { SerialPort } from "serialport";
import { ReadlineParser } from "serialport";
import * as dotenv from "dotenv";
dotenv.config();
import pg from "pg";
const { Client } = pg;
import http from 'http';

const pgClient = new Client();
await main();
async function main() {
  await pgClient.connect();
}

let temp = 0;
let humidity = 0;
let portPath = "";

const app = express();

app.set(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", function (req, res) {
  res.render("home", { temp: temp, humidity: humidity });
});

const ports = SerialPort.list().then(function (ports) {
  ports.forEach(function (option) {
    if (option.productId === "805a") {
      const port = new SerialPort({
        path: option.path,
        baudRate: 9600,
      }).setEncoding("utf8");
      const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

      port.on("open", function () {
        console.log("Serial Port Opened");
      });

      parser.on("data", function (data) {
        data = JSON.parse(data);
        temp = data.temperature;
        humidity = data.humidity;
        pgClient.query(
          "INSERT INTO readings (temp, humidity) VALUES ($1, $2);",
          [temp, humidity],
          function (err) {
            err ? console.log(err) : null;
          }
        );
      });
    }
  });
});

app.get("/api", function (req, res) {
  pgClient.query(
    `SELECT * FROM readings ORDER BY timestamp DESC LIMIT 1;`,
    function (err, dbres) {
      err && res.send(err);
      res.send(dbres.rows[0]);
    }
  );
});

app.listen(4000, function () {
  console.log("server running on 4000");
});
