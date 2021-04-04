import { SizeSchema, Schema, ErrorMap, ErrorType } from "./schemas";

export class StringSchema extends SizeSchema<string> {
    protected regexMatch?: string;
    protected regexMessage = "Does not match regex";

    public regex(regex: string, message?: string) {
        this.regexMatch = regex;
        if (message) this.regexMessage = message;
        return this;
    }

    public validate(value: string) {
        let n = super.validateNullable(value);
        if (n !== null) return n;

        if (typeof value !== "string") return "must be string";

        let s = super.validateSize(value.length);
        if (s !== undefined) return s;

        if (this.regexMatch && !value.match(this.regexMatch)) return this.regexMessage;
    }
}

export function string(): StringSchema {
    return new StringSchema();
}

export class NumberSchema extends SizeSchema<number> {
    protected intMessage = "Must be integer";
    protected allowFloat = false;

    public float(allow: boolean = true, message?: string) {
        this.allowFloat = allow;
        if (message) this.intMessage = message;
        return this;
    }

    public validate(value: number) {
        let n = super.validateNullable(value);
        if (n !== null) return n;

        if (typeof value !== "number") return "must be number";
        if (!this.allowFloat && !Number.isInteger(value)) return this.intMessage;

        return super.validateSize(value);
    }
}

export function number(): NumberSchema {
    return new NumberSchema();
}

type ObjectKeySchemas<T> = {
    [Key in keyof T]: Schema<T[Key]>;
};
export class ObjectSchema<T extends {}> extends Schema<T> {
    constructor(protected fields: ObjectKeySchemas<T>) {
        super();
    }

    public validate(value: T) {
        let keys = Object.keys(this.fields) as (keyof T)[];
        let err: ErrorMap<T> = {};
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let field = value[key];
            let result = this.fields[key].validate(field);
            if (result !== undefined) {
                err[key] = result;
                return err as ErrorType<T>;
            }
        }
        return Object.keys(err).length > 0 ? (err as ErrorType<T>) : undefined;
    }
}

export function object<T>(fields: ObjectKeySchemas<T>) {
    return new ObjectSchema(fields);
}

export type OrSchemasToType<T> = T extends [Schema<infer D>, ...infer E] ? D | OrSchemasToType<E> : never;

export class OrSchema<T extends [Schema<any>, ...Schema<any>[]]> extends Schema<OrSchemasToType<T>> {
    constructor(protected schemas: T) {
        super();
    }

    public validate(value: OrSchemasToType<T>) {
        let n = this.validateNullable(value);
        if (n !== null) return n;

        let result: ErrorType<OrSchemasToType<T>> | undefined;
        for (let i = 0; i < this.schemas.length; i++) {
            let schema = this.schemas[i];
            result = schema.validate(value) as OrSchemasToType<T>;
            if (result === undefined) {
                return undefined;
            }
        }
        return result;
    }
}

export function or<T extends [Schema<any>, ...Schema<any>[]]>(schemas: T): Schema<OrSchemasToType<T>> {
    return new OrSchema(schemas);
}

export type TupleSchemasToType<T> = T extends [Schema<infer D>, ...infer E] ? [D, ...TupleSchemasToType<E>] : [];

export class TupleSchema<T extends [Schema<any>, ...Schema<any>[]]> extends Schema<TupleSchemasToType<T>> {
    constructor(private schemas: T) {
        super();
    }

    public validate(value: TupleSchemasToType<T>): ErrorType<TupleSchemasToType<T>> | undefined {
        let n = super.validateNullable(value);
        if (n !== null) return n;

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
        return Object.keys(err).length > 0 ? (err as ErrorType<TupleSchemasToType<T>>) : undefined;
    }
}

export function tuple<T extends [Schema<any>, ...Schema<any>[]]>(schemas: T): Schema<TupleSchemasToType<T>> {
    return new TupleSchema(schemas);
}

export class ArraySchema<T> extends SizeSchema<T[]> {
    constructor(private schema: Schema<T>) {
        super();
    }

    public validate(value: T[]) {
        let n = super.validateNullable(value);
        if (n !== null) return n;

        if (!Array.isArray(value)) return "must be array";

        let s = super.validateSize(value.length);
        if (s !== undefined) return s;

        let err: ErrorMap<T[]> = {} as any;
        for (let i = 0; i < value.length; i++) {
            let item = value[i];
            let result = this.schema.validate(item);
            if (result !== undefined) {
                err[i] = result;
                return err;
            }
        }
        return Object.keys(err).length > 0 ? err : undefined;
    }
}

export function array<T>(schema: Schema<T>) {
    return new ArraySchema(schema);
}

let a = string().min(100).max(21);
let d = string().optional();

let dd = tuple([string(), string().optional()]);

let b = object({
    nice: string().min(100).nullable(),
    oof: object({ ok: string() }),
    nice2: string(),
});

let c = string().or(object({ yikes: string() }));

let f = array(string()).or(array(string()));
let g = array(string()).min(100).or(string());

let o = or([string(), object({ epic: string() })]);
