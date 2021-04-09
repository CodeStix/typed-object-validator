const tv = require("../dist");

test("string schema", () => {
    let stringSchema = tv.string();
    expect(stringSchema.validate("testing")).toBeUndefined();
    expect(stringSchema.validate("")).toBeUndefined();
    expect(stringSchema.validate(0)).not.toBeUndefined();
    expect(stringSchema.validate(true)).not.toBeUndefined();
    expect(stringSchema.validate({})).not.toBeUndefined();
    expect(stringSchema.validate([])).not.toBeUndefined();

    let regexSchema = tv.string().regex(/^[0-9a-f]+$/);
    expect(regexSchema.validate("test")).not.toBeUndefined();
    expect(regexSchema.validate("02fff34234abc")).toBeUndefined();

    let lengthSchema = tv.string().min(3, "Min").max(6, "Max");
    expect(lengthSchema.validate("toast")).toBeUndefined();
    expect(lengthSchema.validate("toasting")).toBe("Max");
    expect(lengthSchema.validate("t")).toBe("Min");
});

test("number schema", () => {
    let numberSchema = tv.number();
    expect(numberSchema.validate(0)).toBeUndefined();
    expect(numberSchema.validate("")).not.toBeUndefined();
    expect(numberSchema.validate(true)).not.toBeUndefined();
    expect(numberSchema.validate({})).not.toBeUndefined();
    expect(numberSchema.validate([])).not.toBeUndefined();
});
