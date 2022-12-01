const express = require("express");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

let temp = 0;
let humidity = 0;
let portPath = "";

const app = express();

app.set(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.get("/", function (req, res) {
  res.render("home", { temp: temp, humidity: humidity });
});

const ports = SerialPort.list().then(function (ports) {
  console.log(ports);
  ports.forEach(function (option) {
    if (option.productId === "805A") {
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
        temp = data.temperature + "";
        humidity = data.humidity + "%";
      });
    }
  });
});

app.listen(4000, function () {
  console.log("server running on 3000");
});
