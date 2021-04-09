const tv = require("../dist");

test("string schema", () => {
    expect(tv.string().validate("testing")).toBeUndefined();
    expect(tv.string().validate("")).toBeUndefined();
    expect(tv.string().validate(0)).not.toBeUndefined();
    expect(tv.string().validate(true)).not.toBeUndefined();
    expect(tv.string().validate({})).not.toBeUndefined();
    expect(tv.string().validate([])).not.toBeUndefined();

    expect(tv.string("Must exist").validate(undefined)).toBe("Must exist");
    expect(tv.string().nullable().optional().validate(undefined)).toBeUndefined();
    expect(tv.string().nullable().optional().validate(null)).toBeUndefined();
    expect(tv.string().nullable().optional().validate("asdfasdf")).toBeUndefined();
});

test("string regex schema", () => {
    let schema = tv.string().regex(/^[0-9a-f]+$/, "Invalid");
    expect(schema.validate("test")).toBe("Invalid");
    expect(schema.validate("02fff34234abc")).toBeUndefined();
});

test("string length schema", () => {
    let schema = tv.string().min(3, "Min").max(6, "Max");
    expect(schema.validate("toast")).toBeUndefined();
    expect(schema.validate("toasting")).toBe("Max");
    expect(schema.validate("t")).toBe("Min");
});

test("string transformation", () => {
    // Strings are trimmed by default
    expect(tv.string().doTrim(false).transform("  bread  ")).not.toBe("bread");
    expect(tv.string().transform("  bread  ")).toBe("bread");

    expect(tv.string().doCase("upper").transform("bread")).toBe("BREAD");
    expect(tv.string().doCase("lower").transform("BRead")).toBe("bread");
    expect(tv.string().doCase("capitalize").transform("bread")).toBe("Bread");
    expect(tv.string().doCase("kebab-case").transform("More Bread")).toBe("More-Bread");
    expect(tv.string().doCase("kebab-lower-case").transform("More Bread")).toBe("more-bread");
});

test("number schema", () => {
    expect(tv.number("Must be number").validate(0)).toBeUndefined();
    expect(tv.number("Must be number").validate("")).toBe("Must be number");
    expect(tv.number("Must be number").validate(true)).toBe("Must be number");
    expect(tv.number("Must be number").validate({})).toBe("Must be number");
    expect(tv.number("Must be number").validate([])).toBe("Must be number");
    expect(tv.number("Must be number").validate(100.123)).toBe("Must be integer");
});

test("number size schema", () => {
    let schema = tv.number().min(10, "Min").max(20, "Max");
    expect(schema.validate(15)).toBeUndefined();
    expect(schema.validate(10)).toBeUndefined();
    expect(schema.validate(20)).toBeUndefined();
    expect(schema.validate(21)).toBe("Max");
    expect(schema.validate(9)).toBe("Min");
    expect(tv.number().float().max(20, "Max").validate(20.0001)).toBe("Max");
});

test("number float schema", () => {
    expect(tv.number().float().validate(100.123)).toBeUndefined();
});

test("email schema", () => {
    expect(tv.email("Invalid").validate("test@gmail")).toBe("Invalid");
    expect(tv.email("Invalid").validate("test@gmail.com")).toBeUndefined();
});

test("boolean schema", () => {
    expect(tv.boolean().validate(false)).toBeUndefined();
    expect(tv.boolean().validate(true)).toBeUndefined();
    expect(tv.boolean().validate(null)).not.toBeUndefined();
    expect(tv.boolean().validate("")).not.toBeUndefined();
    expect(tv.boolean().validate(0)).not.toBeUndefined();

    expect(tv.boolean().optional().validate(undefined)).toBeUndefined();
    expect(tv.boolean().optional().validate(null)).not.toBeUndefined();
    expect(tv.boolean().optional().validate(true)).toBeUndefined();

    expect(tv.boolean().nullable().validate(undefined)).not.toBeUndefined();
    expect(tv.boolean().nullable().validate(null)).toBeUndefined();
    expect(tv.boolean().nullable().validate(true)).toBeUndefined();

    expect(tv.boolean().optional().nullable().validate(undefined)).toBeUndefined();
    expect(tv.boolean().optional().nullable().validate(null)).toBeUndefined();
    expect(tv.boolean().optional().nullable().validate(true)).toBeUndefined();
    expect(tv.boolean().optional().nullable().validate("test")).not.toBeUndefined();
});
