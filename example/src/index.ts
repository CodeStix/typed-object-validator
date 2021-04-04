import express from "express";

const app = express();

app.get("/", (req, res, next) => {
    res.end("hellow");
});

app.listen(80);
console.log("Listening");
