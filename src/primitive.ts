import { SizeSchema, Schema, ErrorMap, ErrorType, ValidationContext, Validator, TransformationContext } from "./schemas";

type StringCasing = "lower" | "upper" | "capitalize" | "kebab-case" | "kebab-lower-case";

export class StringSchema extends SizeSchema<string> {
    protected regexMatch?: RegExp;
    protected regexMessage = "Does not match regex";
    protected trim?: boolean;
    protected casing?: StringCasing;

    public regex(regex: string | RegExp, message?: string) {
        if (this.regexMatch) throw new Error("Duplicate regex() call");
        this.regexMatch = typeof regex === "string" ? new RegExp(regex) : regex;
        if (message) this.regexMessage = message;
        return this;
    }

    public doTrim(trim = true) {
        if (this.trim !== undefined) throw new Error("Duplicate doTrim() call");
        this.trim = trim;
        return this;
    }

    public doTransformCase(casing: StringCasing) {
        if (this.casing) throw new Error("Duplicate doTransformCase() call");
        this.casing = casing;
        return this;
    }

    public validate(value: string, context: ValidationContext = {}) {
        let n = super.validateNullable(value);
        if (n !== null) return n;

        if (typeof value !== "string") return "Must be string";

        let s = super.validateSize(value.length);
        if (s !== undefined) return s;

        if (this.regexMatch && !this.regexMatch.exec(value)) return this.regexMessage;
    }

    public transform(value: string, context: TransformationContext = {}) {
        if (typeof value === "string") {
            if (this.trim ?? context.trimStrings ?? true) value = value.trim();
            switch (this.casing) {
                case "upper":
                    value = value.toUpperCase();
                    break;
                case "lower":
                    value = value.toLowerCase();
                    break;
                case "capitalize":
                    value = value.slice(0, 1).toUpperCase() + value.slice(1).toLowerCase();
                    break;
                case "kebab-case":
                    value = value.split(" ").join("-");
                    break;
                case "kebab-lower-case":
                    value = value.toLowerCase().split(" ").join("-");
                    break;
            }
        }
        return super.transform(value, context);
    }
}

export function string(): StringSchema {
    return new StringSchema();
}

export function email(invalidMessage?: string) {
    return new StringSchema().regex(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, invalidMessage);
}

export class NumberSchema extends SizeSchema<number> {
    protected intMessage = "Must be integer";
    protected allowFloat?: boolean;

    public float(allow: boolean = true, message?: string) {
        if (this.allowFloat !== undefined) throw new Error("Duplicate float() call");
        this.allowFloat = allow;
        if (message) this.intMessage = message;
        return this;
    }

    public validate(value: number, context: ValidationContext = {}) {
        let n = super.validateNullable(value);
        if (n !== null) return n;

        if (typeof value !== "number" || isNaN(value)) return "Must be number";
        if (!(this.allowFloat ?? false) && !Number.isInteger(value)) return this.intMessage;

        return super.validateSize(value);
    }
}

export function number(): NumberSchema {
    return new NumberSchema();
}

export class BooleanSchema extends Schema<boolean> {
    public validate(value: boolean, context: ValidationContext = {}) {
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

    public validate(value: T, context: ValidationContext = {}) {
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

    public validate(value: T, context: ValidationContext = {}) {
        let n = this.validateNullable(value);
        if (n !== null) return n;

        if (typeof value !== "object") return "Invalid object";

        let keys = Object.keys(this.fields) as (keyof T)[];
        let err: ErrorMap<T> = {};
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let field = value[key];
            let result = this.fields[key].validate(field, context);
            if (result !== undefined) {
                err[key] = result;
                if (context.abortEarly ?? true) return err as ErrorType<T>;
            }
        }
        return Object.keys(err).length > 0 ? (err as ErrorType<T>) : undefined;
    }

    public transform(value: T, context: TransformationContext = {}) {
        if (typeof value === "object" && value !== null) {
            let keys = Object.keys(this.fields) as (keyof T)[];
            let obj: T = {} as any;
            for (let i = 0; i < keys.length; i++) {
                let key = keys[i];
                obj[key] = this.fields[key].transform(value[key], context);
            }
            return super.transform(obj, context);
        } else {
            return super.transform(value, context);
        }
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

    public validate(value: OrSchemasToType<T>, context: ValidationContext = {}) {
        let n = this.validateNullable(value);
        if (n !== null) return n;

        let result: ErrorType<OrSchemasToType<T>> | undefined;
        for (let i = 0; i < this.schemas.length; i++) {
            let schema = this.schemas[i];
            result = schema.validate(value, context) as OrSchemasToType<T>;
            if (result === undefined) {
                return undefined;
            }
        }
        return result;
    }

    public transform(value: OrSchemasToType<T>, context: TransformationContext = {}) {
        // Look for the matching value
        for (let i = 0; i < this.schemas.length; i++) {
            let schema = this.schemas[i];
            if (schema.validate(value, {}) === undefined) {
                value = schema.transform(value, context);
                break;
            }
        }
        return super.transform(value, context);
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

    public validate(value: AndSchemasToType<T>, context: ValidationContext = {}) {
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

    public transform(value: AndSchemasToType<T>, context: TransformationContext = {}) {
        for (let i = 0; i < this.schemas.length; i++) {
            value = this.schemas[i].transform(value, context);
        }
        return super.transform(value, context);
    }
}

export type TupleSchemasToType<T> = T extends [Schema<infer D>, ...infer E] ? [D, ...TupleSchemasToType<E>] : [];

export class TupleSchema<T extends [Schema<any>, ...Schema<any>[]]> extends Schema<TupleSchemasToType<T>> {
    constructor(protected schemas: T) {
        super();
    }

    public validate(value: TupleSchemasToType<T>, context: ValidationContext = {}) {
        let n = super.validateNullable(value);
        if (n !== null) return n;

        if (!Array.isArray(value) || value.length > this.schemas.length) return "Invalid tuple";

        let err: ErrorMap<TupleSchemasToType<T>> = {};
        for (let i = 0; i < this.schemas.length; i++) {
            let schema = this.schemas[i];
            let result = schema.validate(value[i], context);
            if (result !== undefined) {
                err[i] = result as any;
                if (context.abortEarly ?? true) return err as ErrorType<TupleSchemasToType<T>>;
            }
        }
        return Object.keys(err).length > 0 ? (err as ErrorType<TupleSchemasToType<T>>) : undefined;
    }

    public transform(value: TupleSchemasToType<T>, context: TransformationContext = {}) {
        let arr = new Array(this.schemas.length) as TupleSchemasToType<T>;
        for (let i = 0; i < this.schemas.length; i++) {
            let schema = this.schemas[i];
            arr[i] = schema.transform(value[i], context);
        }
        return super.transform(arr, context);
    }
}

export function tuple<T extends [Schema<any>, ...Schema<any>[]]>(schemas: T): Schema<TupleSchemasToType<T>> {
    return new TupleSchema(schemas);
}

export class ArraySchema<T> extends SizeSchema<T[]> {
    constructor(protected schema: Schema<T>) {
        super();
    }

    public validate(value: T[], context: ValidationContext = {}) {
        let n = super.validateNullable(value);
        if (n !== null) return n;

        if (!Array.isArray(value)) return "Must be array";

        let s = super.validateSize(value.length);
        if (s !== undefined) return s;

        let err: ErrorMap<T[]> = {} as any;
        for (let i = 0; i < value.length; i++) {
            let item = value[i];
            let result = this.schema.validate(item, context);
            if (result !== undefined) {
                err[i] = result;
                if (context.abortEarly ?? true) return err;
            }
        }
        return Object.keys(err).length > 0 ? err : undefined;
    }

    public transform(value: T[], context: TransformationContext = {}) {
        let arr = new Array(value.length) as T[];
        for (let i = 0; i < value.length; i++) {
            arr[i] = this.schema.transform(value[i], context);
        }
        return super.transform(arr, context);
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

export class DateSchema extends Schema<Date> {
    protected invalidMessage = "Invalid date";

    constructor(invalidMessage?: string) {
        super();
        if (invalidMessage) this.invalidMessage = invalidMessage;
    }

    public validate(value: Date, context: ValidationContext = {}): string | undefined {
        if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
            let d = new Date(value);
            if (!isNaN(d.getTime())) return undefined;
        }
        return this.invalidMessage;
    }

    public transform(value: Date, context: TransformationContext = {}) {
        // Value can be string, number or Date, which the Date constructor all accepts
        return new Date(value);
    }
}

export function date(invalidMessage?: string) {
    return new DateSchema(invalidMessage);
}
