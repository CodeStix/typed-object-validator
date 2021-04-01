export function test() {
    console.log("test");
}

interface Person {
    firstName: number | boolean | "yikes";
    lastName: string;
    email: "test" | number | boolean;
}

type IsUnion<T, U, V> = string | number extends T
    ? U
    : string | object extends T
    ? U
    : string | boolean extends T
    ? U
    : string | true extends T
    ? U
    : string | false extends T
    ? U
    : boolean | number extends T
    ? U
    : boolean | object extends T
    ? U
    : boolean | true extends T
    ? U
    : boolean | false extends T
    ? U
    : object | number extends T
    ? U
    : V;

type Ex<T, U> = T extends U ? null : T;

type NullableSchema<T> = undefined extends T
    ? { undefined: true } & NullableSchema<Exclude<T, undefined>>
    : null extends T
    ? { null: true } & NullableSchema<Exclude<T, null>>
    : ValueSchema<T> extends [any, any, ...any]
    ? { or: ValueSchema<T> }
    : ValueSchema<T>[any];

type ValueSchema<T> = number extends T
    ? [{ type: "number" }, ...ValueSchema<T extends number ? never : T>]
    : boolean extends T
    ? [{ type: "boolean" }, ...ValueSchema<T extends boolean ? never : T>]
    : T extends string
    ? string extends T
        ? [{ type: "string" }]
        : [{ type: "stringlit"; value: T }]
    : [];

type ObjectSchema<T extends {}> = {
    [Key in keyof T]-?: NullableSchema<T[Key]>;
};

const PersonSchema = createSchema<Person>({
    firstName: { or: [{ type: "number" }, { type: "boolean" }, { type: "stringlit", value: "yikes" }] },
    lastName: { type: "string" },
    email: { or: [{ type: "number" }, { type: "boolean" }, { type: "stringlit", value: "test" }] },
});

function createSchema<T>(schema: ObjectSchema<T>) {}
