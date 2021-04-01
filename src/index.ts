export function test() {
    console.log("test");
}

interface Person {
    firstName?: "nice" | number | boolean;
    lastName: string | null;
    email?: "0" | null;
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

type ValueSchema<T> = undefined extends T
    ? [{ undefined: true }, ...ValueSchema<T extends undefined ? never : T>]
    : null extends T
    ? [{ null: true }, ...ValueSchema<T extends null ? never : T>]
    : number extends T
    ? [{ type: "number" }, ...ValueSchema<T extends number ? never : T>]
    : string extends T
    ? [{ type: "string" }, ...ValueSchema<T extends string ? never : T>]
    : boolean extends T
    ? [{ type: "boolean" }, ...ValueSchema<T extends boolean ? never : T>]
    : [];

type ObjectSchema<T extends {}> = {
    [Key in keyof T]-?: ValueSchema<T[Key]>;
};

type A = string | number extends string ? true : false;

let a: IsUnion<boolean | number, true, false>;

const PersonSchema = createSchema<Person>({
    firstName: [{ undefined: true }, { type: "number" }, { type: "boolean" }],
    lastName: [{ null: true }, { type: "string" }],
    email: [{ undefined: true }, { null: true }],
});

function createSchema<T>(schema: ObjectSchema<T>) {}
