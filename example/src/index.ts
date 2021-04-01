import express from "express";
import { test } from "typed-validator";

const app = express();

test();

app.get("/", (req, res, next) => {
    res.end("hellow");
});

app.listen(80);
console.log("Listening");
