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
