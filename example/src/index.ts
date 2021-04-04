import express from "express";
import * as tv from "typed-validator";

const UserSchema = tv.object({
    firstName: tv.string().min(0, "nice"),
    lastName: tv.string().max(100),
});

const app = express();

app.get("/", (req, res, next) => {
    res.end("hellow");
});

app.listen(80);
console.log("Listening");
