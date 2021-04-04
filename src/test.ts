function string(): StringSchema {
    return new StringSchema();
}

function number(): NumberSchema {
    return new NumberSchema();
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

    or<D>(other: Schema<D>): Schema<OrSchemasToType<[Schema<T>, Schema<D>]>> {
        return new OrSchema([this, other]) as Schema<OrSchemasToType<[Schema<T>, Schema<D>]>>;
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

abstract class SizeSchema<T extends number | { length: number }> extends Schema<T> {
    protected minValue?: number;
    protected minMessage?: string;
    protected maxValue?: number;
    protected maxMessage?: string;

    public min(min: number, message?: string) {
        this.minValue = min;
        this.minMessage = message;
        return this;
    }

    public max(max: number, message?: string) {
        this.maxValue = max;
        this.maxMessage = message;
        return this;
    }
}

class StringSchema extends SizeSchema<string> {
    protected regexMatch?: string;
    protected regexMessage?: string;

    public regex(regex: string, message?: string) {
        this.regexMatch = regex;
        this.regexMessage = message;
    }

    public validate(value: string) {
        let e = super.validate(value);
        if (e !== undefined) return e;
        if (this.minValue !== undefined && value.length < this.minValue) return this.minMessage ?? "must be longer";
        if (this.maxValue !== undefined && value.length > this.maxValue) return this.maxMessage ?? "must be shorter";
        if (this.regexMatch !== undefined && !value.match(this.regexMatch)) return this.regexMessage ?? "does not match regex";
    }
}

class NumberSchema extends SizeSchema<number> {
    public validate(value: number) {
        let e = super.validate(value);
        if (e !== undefined) return e;
        if (this.minValue !== undefined && value < this.minValue) return this.minMessage ?? "must be bigger";
        if (this.maxValue !== undefined && value > this.maxValue) return this.maxMessage ?? "must be smaller";
    }
}

type ObjectKeySchemas<T> = {
    [Key in keyof T]: Schema<T[Key]>;
};
class ObjectSchema<T extends {}> extends Schema<T> {
    constructor(protected fields: ObjectKeySchemas<T>) {
        super();
    }

    public validate(value: T) {
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

function object<T>(fields: ObjectKeySchemas<T>) {
    return new ObjectSchema(fields);
}

type OrSchemasToType<T> = T extends [Schema<infer D>, ...infer E] ? D | OrSchemasToType<E> : never;
class OrSchema<T extends [Schema<any>, ...Schema<any>[]]> extends Schema<OrSchemasToType<T>> {
    constructor(protected schemas: T) {
        super();
    }

    public validate(value: OrSchemasToType<T>) {
        let lastResult: ErrorType<OrSchemasToType<T>> | undefined;
        for (let i = 0; i < this.schemas.length; i++) {
            let schema = this.schemas[i];
            lastResult = schema.validate(value) as OrSchemasToType<T>;
            if (lastResult === undefined) {
                return undefined;
            }
        }
        return lastResult;
    }
}

function or<T extends [Schema<any>, ...Schema<any>[]]>(schemas: T): Schema<OrSchemasToType<T>> {
    return new OrSchema(schemas);
}

type TupleSchemasToType<T> = T extends [Schema<infer D>, ...infer E] ? [D, ...TupleSchemasToType<E>] : [];
class TupleSchema<T extends [Schema<any>, ...Schema<any>[]]> extends Schema<TupleSchemasToType<T>> {
    constructor(private schemas: T) {
        super();
    }

    public validate(value: TupleSchemasToType<T>): ErrorType<TupleSchemasToType<T>> | undefined {
        let e = super.validate(value);
        if (e !== undefined) return e;
        if (!Array.isArray(value) || value.length > this.schemas.length) return "invalid tuple";
        let err: ErrorMap<TupleSchemasToType<T>> = {};
        for (let i = 0; i < this.schemas.length; i++) {
            let schema = this.schemas[i];
            let result = schema.validate(value[i]);
            if (result !== undefined) {
                err[i] = result as any;
                return err as ErrorType<TupleSchemasToType<T>>;
            }
        }
    }
}

function tuple<T extends [Schema<any>, ...Schema<any>[]]>(schemas: T): Schema<TupleSchemasToType<T>> {
    return new TupleSchema(schemas);
}

export type SchemaType<T extends Schema<any>> = T extends Schema<infer D> ? D : never;

class ArraySchema<T> extends SizeSchema<T[]> {
    constructor(private schema: Schema<T>) {
        super();
    }

    public validate(value: T[]) {
        let e = super.validate(value);
        if (e !== undefined) return e;

        if (!Array.isArray(value)) return "must be array";

        let err: ErrorMap<T[]> = {} as any;
        for (let i = 0; i < value.length; i++) {
            let d = value[i];
            let res = this.schema.validate(d);
            if (res !== undefined) {
                err[i] = res;
                return err;
            }
        }
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
