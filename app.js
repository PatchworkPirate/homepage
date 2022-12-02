import express, { response } from "express";
import { SerialPort } from "serialport";
import { ReadlineParser } from "serialport";
import { createApi } from 'unsplash-js';
import * as dotenv from "dotenv";
dotenv.config()

const unsplash = createApi({
  accessKey: process.env.ACCESS_KEY,
  fetch: fetch,
});

console.log(process.env.ACCESS_KEY)

let temp = 0;
let humidity = 0;
let portPath = "";
let imgUrl

const app = express();

app.set(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", function (req, res) {
  res.render("home", { temp: temp, humidity: humidity, background: imgUrl});
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
      });
    }
  });
});

async function getBackground() {
    unsplash.photos.getRandom().then((response) => {
      imgUrl = response.response.urls.regular;
    })

    setTimeout(getBackground, (1000*60*60*24));
};

getBackground();

app.listen(4000, function () {
  console.log("server running on 4000");
});
