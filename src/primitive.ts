import { SizeSchema, Schema, ErrorMap, ErrorType, ValidationContext, Validator } from "./schemas";

export class StringSchema extends SizeSchema<string> {
    protected regexMatch?: RegExp;
    protected regexMessage = "Does not match regex";
    protected trim = false;

    public regex(regex: string | RegExp, message?: string) {
        this.regexMatch = typeof regex === "string" ? new RegExp(regex) : regex;
        if (message) this.regexMessage = message;
        return this;
    }

    public doTrim(trim = true) {
        this.trim = trim;
        return this;
    }

    public validate(value: string) {
        let n = super.validateNullable(value);
        if (n !== null) return n;

        if (typeof value !== "string") return "Must be string";

        let s = super.validateSize(value.length);
        if (s !== undefined) return s;

        if (this.regexMatch && !this.regexMatch.exec(value)) return this.regexMessage;
    }

    public transform(value: string) {
        if (this.trim) value = value.trim();
        return super.transform(value);
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

        if (typeof value !== "number" || isNaN(value)) return "Must be number";
        if (!this.allowFloat && !Number.isInteger(value)) return this.intMessage;

        return super.validateSize(value);
    }
}

export function number(): NumberSchema {
    return new NumberSchema();
}

export class BooleanSchema extends Schema<boolean> {
    public validate(value: boolean) {
        let n = super.validateNullable(value);
        if (n !== null) return n;

        if (typeof value !== "boolean") return "Must be boolean";
    }
}

export function boolean(): BooleanSchema {
    return new BooleanSchema();
}

export class ValueSchema<T> extends Schema<T> {
    constructor(protected value: T) {
        super();
    }

    public validate(value: T) {
        let n = this.validateNullable(value);
        if (n !== null) return n;

        if (this.value !== value) return "Invalid value";
    }
}

export function value<T extends string | number | boolean | null | undefined>(value: T): Schema<T> {
    return new ValueSchema(value);
}

type ObjectKeySchemas<T> = {
    [Key in keyof T]: Schema<T[Key]>;
};

export class ObjectSchema<T extends {}> extends Schema<T> {
    constructor(protected fields: ObjectKeySchemas<T>) {
        super();
    }

    public validate(value: T, context: ValidationContext = { abortEarly: true }) {
        let keys = Object.keys(this.fields) as (keyof T)[];
        let err: ErrorMap<T> = {};
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let field = value[key];
            let result = this.fields[key].validate(field);
            if (result !== undefined) {
                err[key] = result;
                if (context.abortEarly) return err as ErrorType<T>;
            }
        }
        return Object.keys(err).length > 0 ? (err as ErrorType<T>) : undefined;
    }

    public transform(value: T) {
        let keys = Object.keys(this.fields) as (keyof T)[];
        let obj: T = {} as any;
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            obj[key] = this.fields[key].transform(value[key]);
        }
        return super.transform(obj);
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

    public transform(value: OrSchemasToType<T>) {
        // Look for the matching value
        for (let i = 0; i < this.schemas.length; i++) {
            let schema = this.schemas[i];
            if (schema.validate(value) === undefined) {
                value = schema.transform(value);
                break;
            }
        }
        return super.transform(value);
    }
}

export function or<T extends [Schema<any>, ...Schema<any>[]]>(schemas: T): Schema<OrSchemasToType<T>> {
    return new OrSchema(schemas);
}

export type AndSchemasToType<T> = T extends [Schema<infer D>, ...infer E] ? D & AndSchemasToType<E> : never;

export class AndSchema<T extends [Schema<any>, ...Schema<any>[]]> extends Schema<AndSchemasToType<T>> {
    constructor(protected schemas: T) {
        super();
    }

    public validate(value: AndSchemasToType<T>, context?: ValidationContext) {
        let n = this.validateNullable(value);
        if (n !== null) return n;

        for (let i = 0; i < this.schemas.length; i++) {
            let schema = this.schemas[i];
            let result = schema.validate(value, context);
            if (result !== undefined) {
                return result as ErrorType<AndSchemasToType<T>>;
            }
        }
    }

    public transform(value: AndSchemasToType<T>) {
        for (let i = 0; i < this.schemas.length; i++) {
            value = this.schemas[i].transform(value);
        }
        return super.transform(value);
    }
}

export type TupleSchemasToType<T> = T extends [Schema<infer D>, ...infer E] ? [D, ...TupleSchemasToType<E>] : [];

export class TupleSchema<T extends [Schema<any>, ...Schema<any>[]]> extends Schema<TupleSchemasToType<T>> {
    constructor(protected schemas: T) {
        super();
    }

    public validate(value: TupleSchemasToType<T>, context: ValidationContext = { abortEarly: true }) {
        let n = super.validateNullable(value);
        if (n !== null) return n;

        if (!Array.isArray(value) || value.length > this.schemas.length) return "Invalid tuple";

        let err: ErrorMap<TupleSchemasToType<T>> = {};
        for (let i = 0; i < this.schemas.length; i++) {
            let schema = this.schemas[i];
            let result = schema.validate(value[i]);
            if (result !== undefined) {
                err[i] = result as any;
                if (context.abortEarly) return err as ErrorType<TupleSchemasToType<T>>;
            }
        }
        return Object.keys(err).length > 0 ? (err as ErrorType<TupleSchemasToType<T>>) : undefined;
    }

    public transform(value: TupleSchemasToType<T>) {
        let arr = new Array(this.schemas.length) as TupleSchemasToType<T>;
        for (let i = 0; i < this.schemas.length; i++) {
            let schema = this.schemas[i];
            arr[i] = schema.transform(value[i]);
        }
        return super.transform(arr);
    }
}

export function tuple<T extends [Schema<any>, ...Schema<any>[]]>(schemas: T): Schema<TupleSchemasToType<T>> {
    return new TupleSchema(schemas);
}

export class ArraySchema<T> extends SizeSchema<T[]> {
    constructor(protected schema: Schema<T>) {
        super();
    }

    public validate(value: T[], context: ValidationContext = { abortEarly: true }) {
        let n = super.validateNullable(value);
        if (n !== null) return n;

        if (!Array.isArray(value)) return "Must be array";

        let s = super.validateSize(value.length);
        if (s !== undefined) return s;

        let err: ErrorMap<T[]> = {} as any;
        for (let i = 0; i < value.length; i++) {
            let item = value[i];
            let result = this.schema.validate(item);
            if (result !== undefined) {
                err[i] = result;
                if (context.abortEarly) return err;
            }
        }
        return Object.keys(err).length > 0 ? err : undefined;
    }

    public transform(value: T[]) {
        let arr = new Array(value.length) as T[];
        for (let i = 0; i < value.length; i++) {
            arr[i] = this.schema.transform(value[i]);
        }
        return super.transform(arr);
    }
}

export function array<T>(schema: Schema<T>) {
    return new ArraySchema(schema);
}

export class CustomSchema<T> extends Schema<T> {
    constructor(protected validator: Validator<T>) {
        super();
    }

    public validate(value: T, context: ValidationContext = { abortEarly: true }): ErrorType<T, string> | undefined {
        return this.validator(value, context);
    }
}

export function custom<T>(validator: Validator<T>) {
    return new CustomSchema(validator);
}
