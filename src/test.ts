function string(): StringSchema {
    return new StringSchema();
}

export type ErrorMap<T> = {
    [Key in keyof T]?: NonNullable<T[Key]> extends {} ? ErrorMap<NonNullable<T[Key]>> : string;
};

export abstract class Schema<T> {
    protected isNullable = false;
    protected isOptional = false;

    optional(): Schema<T | undefined> {
        this.isOptional = true;
        return this;
    }

    nullable(): Schema<T | null> {
        this.isNullable = true;
        return this;
    }

    or<D>(other: Schema<D>): Schema<SchemaType<Schema<T> | Schema<D>>> {
        return new OrSchema([this, other]);
    }

    public abstract validate(value: T): ErrorMap<T>;
    public abstract clean(value: T): T;
}

abstract class LengthySchema<T> extends Schema<T> {
    protected minLength?: number;
    protected minLengthMessage?: string;
    protected maxLength?: number;
    protected maxLengthMessage?: string;

    public min(min: number, message?: string) {
        this.minLength = min;
        this.minLengthMessage = message;
        return this;
    }

    public max(max: number, message?: string) {
        this.maxLength = max;
        this.maxLengthMessage = message;
        return this;
    }
}

class StringSchema extends LengthySchema<string> {
    public validate(value: string): string {
        if (typeof value !== "string") return;
    }
    public clean(value: string): string {
        throw new Error("Method not implemented.");
    }
}

type ObjectFieldSchemas<T> = {
    [Key in keyof T]: Schema<T[Key]>;
};

class ObjectSchema<T> extends Schema<T> {
    constructor(private fields: ObjectFieldSchemas<T>) {
        super();
    }
}

function object<T>(fields: ObjectFieldSchemas<T>) {
    return new ObjectSchema(fields);
}

type SchemaType<T extends Schema<any>> = T extends Schema<infer D> ? D : never;

class OrSchema<T extends [Schema<any>, ...Schema<any>[]]> extends Schema<SchemaType<T[number]>> {
    constructor(private schemas: T) {
        super();
    }
}

function or<T extends [Schema<any>, ...Schema<any>[]]>(schemas: T): Schema<SchemaType<T[number]>> {
    return new OrSchema(schemas);
}

class ArraySchema<T> extends LengthySchema<T[]> {
    constructor(private schema: Schema<T>) {
        super();
    }
}

function array<T>(schema: Schema<T>) {
    return new ArraySchema(schema);
}

// class TupleSchema<T extends [Schema<T>, ...Schema<T>[]]> extends Schema<SchemaType<T[number]>> {

//     constructor(schemas: T) {
//         super()
//     }

// }

// function tuple<T extends [Schema<T>, ...Schema<T>[]]>(schemas: T): Schema<Ex<T>> {
//     return new TupleSchema(schemas);
// }

let a = string().min(100).max(21);
let d = string().optional();

let b = object({
    nice: string().min(100).nullable(),
    oof: object({ ok: string() }),
});

let c = string().or(object({ yikes: string() }));

let f = array(string()).or(array(string()));
let g = array(string()).min(100).or(string());

// let g = tuple([string(), string()])
