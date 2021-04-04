import express from "express";
import * as tv from "typed-validator";
import { SchemaType } from "typed-validator";

const RegisterSchema = tv.object({
    firstName: tv.string().min(2, "First name must be longer").max(20).or(tv.value("#yikes")),
    lastName: tv.string().min(2, "Last name must be longer").max(20),
    gender: tv.value("male").or(tv.value("female")),
    email: tv.string().regex(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Invalid email"),
});

type RegisterRequest = SchemaType<typeof RegisterSchema>;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res, next) => {
    res.end("hellow");
});

app.post("/register", (req, res, next) => {
    let data = req.body;
    let err = RegisterSchema.validate(data);
    if (err) {
        return res.json({
            status: "error",
            error: err,
        });
    } else {
        res.json({
            status: "ok",
        });
    }
});

app.listen(3000);
console.log("Listening");
