function string(): StringSchema {
    return new StringSchema();
}

export type ErrorType<T> = string | (NonNullable<T> extends {} ? ErrorMap<NonNullable<T>> : never);

export type ErrorMap<T> = {
    [Key in keyof T]?: ErrorType<T[Key]>;
};

export abstract class Schema<T> {
    protected isNullable = false;
    protected isNullableMessage?: string;
    protected isOptional = false;
    protected isOptionalMessage?: string;

    optional(message?: string): Schema<T | undefined> {
        this.isOptional = true;
        this.isOptionalMessage = message;
        return this;
    }

    nullable(message?: string): Schema<T | null> {
        this.isNullable = true;
        this.isNullableMessage = message;
        return this;
    }

    or<D>(other: Schema<D>): Schema<SchemaType<Schema<T> | Schema<D>>> {
        return new OrSchema([this, other]);
    }

    public validate(value: T): ErrorType<T> | undefined {
        if (value === undefined) {
            return this.isOptional ? undefined : this.isOptionalMessage;
        }
        if (value === null) {
            return this.isNullable ? undefined : this.isNullableMessage;
        }
    }

    // public abstract clean(value: T): T;
}

abstract class LengthySchema<T extends { length: number }> extends Schema<T> {
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

    public validate(value: T) {
        let e = super.validate(value);
        if (e !== undefined) return e;
        if (this.minLength !== undefined && value.length < this.minLength) return this.minLengthMessage ?? "must be longer";
        if (this.maxLength !== undefined && value.length > this.maxLength) return this.maxLengthMessage ?? "must be shorter";
    }
}

class StringSchema extends LengthySchema<string> {
    public validate(value: string) {
        if (typeof value !== "string") return "must be string";
        return super.validate(value);
    }
}

type ObjectFieldSchemas<T> = {
    [Key in keyof T]: Schema<T[Key]>;
};

class ObjectSchema<T extends {}> extends Schema<T> {
    constructor(private fields: ObjectFieldSchemas<T>) {
        super();
    }

    public validate(value: T): ErrorType<T> | undefined {
        let keys = Object.keys(this.fields) as (keyof T)[];
        for (let i = 0; i < keys.length; i++) {
            let k = keys[i];
            let v = value[k];
            let res = this.fields[k].validate(v);
            if (res !== undefined) {
                let err: ErrorMap<T> = {};
                err[k] = res;
                return err as ErrorType<T>;
            }
        }
    }
}

function object<T>(fields: ObjectFieldSchemas<T>) {
    return new ObjectSchema(fields);
}

type OrSchemaToType<T> = T extends [Schema<infer D>, ...infer E] ? D | OrSchemaToType<E> : never;
class OrSchema<T extends [Schema<any>, ...Schema<any>[]]> extends Schema<OrSchemaToType<T>> {
    constructor(private schemas: T) {
        super();
    }
}

function or<T extends [Schema<any>, ...Schema<any>[]]>(schemas: T): Schema<OrSchemaToType<T>> {
    return new OrSchema(schemas);
}

type TupleSchemaToType<T> = T extends [Schema<infer D>, ...infer E] ? [D, ...TupleSchemaToType<E>] : [];
class TupleSchema<T extends [Schema<any>, ...Schema<any>[]]> extends Schema<TupleSchemaToType<T>> {
    constructor(private schemas: T) {
        super();
    }
}

function tuple<T extends [Schema<any>, ...Schema<any>[]]>(schemas: T): Schema<TupleSchemaToType<T>> {
    return new TupleSchema(schemas);
}

// type SchemaType<T extends Schema<any>> = T extends Schema<infer D> ? D : never;

class ArraySchema<T> extends LengthySchema<T[]> {
    constructor(private schema: Schema<T>) {
        super();
    }
}

function array<T>(schema: Schema<T>) {
    return new ArraySchema(schema);
}

let a = string().min(100).max(21);
let d = string().optional();

let dd = object([string(), string().optional()]);

let b = object({
    nice: string().min(100).nullable(),
    oof: object({ ok: string() }),
});

let c = string().or(object({ yikes: string() }));

let f = array(string()).or(array(string()));
let g = array(string()).min(100).or(string());

let o = or([string(), object({ epic: string() })]);

// let g = tuple([string(), string()])
