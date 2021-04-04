import express from "express";
import * as tv from "typed-validator";
import { SchemaType } from "typed-validator";

const ConditionSchema = tv.object({
    type: tv.or([tv.value("min"), tv.value("max"), tv.value("contains")]),
    value: tv.string().or(tv.number()),
});

const QuestionSchema = tv.object({
    question: tv.string().min(1).max(200),
    parameter: tv.string().min(1).max(30),
    conditions: tv.array(ConditionSchema),
});

const QuestionnaireSchema = tv.object({
    name: tv.string().min(1).max(200),
    open: tv.boolean(),
    author: tv.string().optional(),
    questions: tv.array(QuestionSchema).min(1).max(300),
});

const RegisterSchema = tv.object({
    firstName: tv.string().doTrim().min(2, "First name must be longer").max(20).or(tv.value("#yikes")),
    lastName: tv.string().doTrim().min(2, "Last name must be longer").max(20),
    gender: tv.value("male").or(tv.value("female")),
    email: tv.email(),
    birthDate: tv.date(),
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
        console.log(data, RegisterSchema.transform(data));
        res.json({
            status: "ok",
            data: RegisterSchema.transform(data),
        });
    }
});

app.post("/questionnaire", (req, res, next) => {
    let data = req.body;
    let err = QuestionnaireSchema.validate(data, { abortEarly: false });
    if (err) {
        return res.json({
            status: "error",
            error: err,
        });
    } else {
        console.log(data, QuestionnaireSchema.transform(data));
        res.json({
            status: "ok",
            data: QuestionnaireSchema.transform(data),
        });
    }
});

app.listen(3000);
console.log("Listening");
