export function test() {
    console.log("test");
}

interface Person {
    firstName?: number | boolean;
    lastName?: string;
    email?: string;
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

type NullableSchema<T> = undefined extends T
    ? { undefined: true } & NullableSchema<T extends undefined ? never : T>
    : null extends T
    ? { null: true } & NullableSchema<T extends null ? never : T>
    : ValueSchema<T> extends [any, any, ...any]
    ? { or: ValueSchema<T> }
    : ValueSchema<T>[any];

type ValueSchema<T> = undefined extends T
    ? [{ undefined: true }, ...ValueSchema<T extends undefined ? never : T>]
    : null extends T
    ? [{ null: true }, ...ValueSchema<T extends null ? never : T>]
    : number extends T
    ? [{ type: "number" }, ...ValueSchema<T extends number ? never : T>]
    : boolean extends T
    ? [{ type: "boolean" }, ...ValueSchema<T extends boolean ? never : T>]
    : string extends T
    ? [{ type: "string" }, ...ValueSchema<T extends string ? never : T>]
    : // : T extends string
      // ? [{ type: "string"; value2: T }]
      [];

type ObjectSchema<T extends {}> = {
    [Key in keyof T]-?: NullableSchema<T[Key]>;
};

const PersonSchema = createSchema<Person>({
    firstName: { undefined: true, or: [{ type: "number" }, { type: "boolean" }] },
    lastName: { undefined: true, type: "string" },
    email: { type: "string", undefined: true },
});

function createSchema<T>(schema: ObjectSchema<T>) {}
