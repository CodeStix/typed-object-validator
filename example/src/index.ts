import express from "express";
import * as tv from "typed-validator";

const app = express();

app.get("/", (req, res, next) => {
    res.end("hellow");
});

app.listen(80);
console.log("Listening");
