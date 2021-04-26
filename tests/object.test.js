const tv = require("../dist");

test("object", () => {
    expect(tv.object().validate({ field: "value" })).toBeUndefined();
    expect(tv.object("Must exist").validate(undefined)).toBe("Must exist");
});

test("mapped object", () => {
    expect(tv.object({ field: tv.string() }).validate({ field: "value" })).toBeUndefined();
    expect(tv.object({ field: tv.string() }).validate({ field2: "value" })).not.toBeUndefined();
    expect(tv.object({ field: tv.number("Must be number") }).validate({ field: "value" })).toStrictEqual({ field: "Must be number" });

    expect(tv.object({ field: tv.string() }).optional().validate(undefined)).toBeUndefined();
    expect(tv.object({}, "Specify value").validate(undefined)).toBe("Specify value");
});

test("tuple", () => {
    expect(tv.tuple([tv.string(), tv.number()]).validate(["nice", 0])).toBeUndefined();
    expect(tv.tuple([tv.string(), tv.number()]).validate(["nice", "nice"])).toStrictEqual({ 1: "Must be number" });
});

test("array", () => {
    expect(tv.array(tv.boolean()).validate([true, false, true])).toBeUndefined();
    expect(tv.array(tv.boolean()).validate([true, false, 0])).toStrictEqual({ 2: "Must be boolean" });
});

test("mapped", () => {
    let t = tv.mapped(tv.value("a").or(tv.value("b")), tv.string());
    expect(t.validate(undefined)).toBe("Enter a value");
    expect(t.validate(null)).toBe("Null is not acceptable");
    expect(t.validate({ a: "nice" })).toBeUndefined();
    expect(t.validate({ b: "" })).toBeUndefined();
    expect(t.validate({ c: "" })).toStrictEqual({ c: "Does not match possible values" });
    expect(t.validate({ a: 100 })).toStrictEqual({ a: "Must be string" });
    expect(t.validate({ b: false })).toStrictEqual({ b: "Must be string" });

    expect(tv.mapped(tv.number(), tv.array(tv.number())).validate([[100]])).toBeUndefined();
    expect(tv.mapped(tv.number(), tv.array(tv.number())).validate([[[100]]])).toStrictEqual({ 0: { 0: "Must be number" } });

    let tt = tv.mapped(tv.string().doCase("upper"), tv.boolean());
    expect(tt.validate({})).toBeUndefined();
    expect(tt.validate({ ok: true })).toBeUndefined();
    expect(tt.validate({ notOk: 0 })).toStrictEqual({ notOk: "Must be boolean" });
    expect(tt.transform({ ok: false })).toStrictEqual({ OK: false });
});
