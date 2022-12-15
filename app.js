import express, { response } from "express";
import { SerialPort } from "serialport";
import { ReadlineParser } from "serialport";
import * as dotenv from "dotenv";
dotenv.config();

let temp = 0;
let humidity = 0;

const app = express();

app.set(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", function (req, res) {
  res.render("home", { temp: temp, humidity: humidity });
});

SerialPort.list().then(function (ports) {
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
      });
    }
  });
});

app.get("/api", function (req, res) {
  res.send({
    temp: temp,
    humidity: humidity,
  });
});

app.listen(4000, function () {
  console.log("server running on 4000");
});
