export type ErrorType<T, Error extends string = string> = Error | (NonNullable<T> extends {} ? ErrorMap<NonNullable<T>, Error> : never);

export type ErrorMap<T, Error extends string = string> = {
    [Key in keyof T]?: ErrorType<T[Key], Error>;
};

export type Validator<T, Error extends string = string> = (value: unknown, context: ValidationContext) => ErrorType<T, Error> | undefined;

export type Transformer<T> = (value: T, context: TransformationContext) => T;

export type SchemaType<T extends Schema<any>> = T extends Schema<infer D> ? D : never;

export interface ValidationContext {
    abortEarly?: boolean;
}

export interface TransformationContext {
    trimStrings?: boolean;
}

export abstract class Schema<T> {
    protected isNullable = false;
    protected noNullMessage: string;
    protected isOptional = false;
    protected requiredMessage: string;

    private customTransformer?: Transformer<T>;
    private whenEmptyValue?: { set: T };
    private setPrototype?: T;

    public constructor(requiredMessage?: string, noNullMessage?: string) {
        this.requiredMessage = requiredMessage ?? "Enter a value";
        this.noNullMessage = noNullMessage ?? "Null is not acceptable";
    }

    /**
     * Accepts undefined as a valid value for this field.
     */
    public optional() {
        if (this.isOptional) throw new Error("Duplicate optional() call");
        this.isOptional = true;
        return this as Schema<T | undefined>;
    }

    /**
     * Accepts null as a valid value for this field.
     */
    public nullable() {
        if (this.isNullable) throw new Error("Duplicate nullable() call");
        this.isNullable = true;
        return this as Schema<T | null>;
    }

    /**
     * Accepts this or the specified schema for this field.
     * @param other The other validation schema that will be accepted too.
     * @param requiredMessage The message to display when neither of the values were specified.
     */
    public or<D>(other: Schema<D>, requiredMessage?: string): Schema<T | D> {
        return new OrSchema([this, other], requiredMessage) as Schema<T | D>;
    }

    /**
     * The value must match this and the specfied schema.
     * @param other The other validation schema that must be accepted too.
     * @param requiredMessage The message to display when the value is undefined.
     */
    public and<D>(other: Schema<D>, requiredMessage?: string): Schema<T & D> {
        return new AndSchema([this, other], requiredMessage) as Schema<T & D>;
    }

    /**
     * Transforms this field to the specified value when it is falsey/empty during transformation.
     * @param valueToSet The value to set when it value is falsey/empty.
     */
    public doSetWhenEmpty<D extends string>(valueToSet: D): Schema<T | D>;
    public doSetWhenEmpty<D extends any>(valueToSet: D): Schema<T | D>;
    public doSetWhenEmpty<D>(valueToSet: D): Schema<T | D> {
        if (this.whenEmptyValue) throw new Error("Duplicate doSetWhenEmpty() call");
        this.whenEmptyValue = { set: valueToSet as any };
        return this as Schema<T | D>;
    }

    /**
     * Executes a custom transfomer on this field during transformation.
     * @param transformer The transformation function to apply.
     */
    public doCustom(transformer: Transformer<T>) {
        if (this.customTransformer) throw new Error("Duplicate doCustom() call");
        this.customTransformer = transformer;
        return this;
    }

    /**
     * Updates the prototype of this field during transformation.
     * @param prototype The prototype to set, use `MyClass.prototype`.
     */
    public doSetPrototype<P extends T>(prototype: P): Schema<P> {
        if (this.setPrototype) throw new Error("Duplicate doPrototype() call");
        this.setPrototype = prototype;
        return this as any;
    }

    protected validateNullable(value: unknown): string | null | undefined {
        if (value === undefined) return this.isOptional ? undefined : this.requiredMessage;
        if (value === null) return this.isNullable ? undefined : this.noNullMessage;
        return null;
    }

    /**
     * Validates any value to match this schema.
     * @returns A matching error for each field or undefined when the passed value is valid.
     */
    public abstract validate(value: unknown, context: ValidationContext): ErrorType<T> | undefined;

    /**
     * Applies all the transformers on this schema (each function starting with **do**) to the specified object.
     * @returns The transformed value.
     */
    public transform(value: T, context: TransformationContext = {}): T {
        if (this.customTransformer) value = this.customTransformer(value, context);
        if (this.whenEmptyValue) value = value ? value : this.whenEmptyValue.set;
        if (this.setPrototype && typeof value === "object") value = Object.assign(this.setPrototype, value);
        return value;
    }
}

export abstract class SizeSchema<T> extends Schema<T> {
    protected minValue?: number;
    protected minMessage = "Must be longer";
    protected maxValue?: number;
    protected maxMessage = "Must be shorter";

    /**
     * Limits the accepted minimum value/size for this field.
     * @param min The minimum accepted value/size.
     * @param message The error that will be returned when it is smaller that the said value.
     */
    public min(min: number, message?: string): SizeSchema<T> {
        if (this.minValue !== undefined) throw new Error("Duplicate min() call");
        this.minValue = min;
        if (message) this.minMessage = message;
        return this;
    }

    /**
     * Limits the accepted maximum value/size for this field.
     * @param min The maximum accepted value/size.
     * @param message The error that will be returned when it is bigger that the said value.
     */
    public max(max: number, message?: string): SizeSchema<T> {
        if (this.maxValue !== undefined) throw new Error("Duplicate max() call");
        this.maxValue = max;
        if (message) this.maxMessage = message;
        return this;
    }

    protected validateSize(value: number): ErrorType<T> | undefined {
        if (this.minValue !== undefined && value < this.minValue) return this.minMessage;
        if (this.maxValue !== undefined && value > this.maxValue) return this.maxMessage;
    }
}

export type StringCasing = "lower" | "upper" | "capitalize" | "kebab-case" | "kebab-lower-case";

export class StringSchema extends SizeSchema<string> {
    protected regexMatch?: RegExp;
    protected regexMessage = "Does not match regex";
    protected trim?: boolean;
    protected casing?: StringCasing;

    public constructor(requiredMessage?: string) {
        super(requiredMessage);
    }

    /**
     * Requires this field to match a regex.
     * @param regex The regex to match.
     * @param message The error to return when it doesn't match.
     */
    public regex(regex: string | RegExp, message?: string) {
        if (this.regexMatch) throw new Error("Duplicate regex() call");
        this.regexMatch = typeof regex === "string" ? new RegExp(regex) : regex;
        if (message) this.regexMessage = message;
        return this;
    }

    /**
     * Trim this string during transformation. **String trimming is enabled by default and can be overridden using `TransformationContext`**
     * @param trim True to enable, false to disable trimming.
     */
    public doTrim(trim = true) {
        if (this.trim !== undefined) throw new Error("Duplicate doTrim() call");
        this.trim = trim;
        return this;
    }

    /**
     * Transform this string's casing during transformation.
     * @param casing The case transformation to apply.
     */
    public doCase(casing: StringCasing) {
        if (this.casing) throw new Error("Duplicate doTransformCase() call");
        this.casing = casing;
        return this;
    }

    public validate(value: unknown, context: ValidationContext = {}) {
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

export type NumberRounding = "ceil" | "round" | "floor";

export class NumberSchema extends SizeSchema<number> {
    protected intMessage = "Must be integer";
    protected allowFloat?: boolean;

    protected rounding?: NumberRounding;

    public constructor(requiredMessage?: string) {
        super(requiredMessage);
    }

    /**
     * Allows this field to have a decimal point. (**All number fields must be integer by default**)
     * @param allow True to allow a decimal point, false to not.
     * @param mustBeIntegerMessage The error to return if the value has a decimal point while it isn't allowed
     */
    public float(allow: boolean = true, mustBeIntegerMessage?: string) {
        if (this.allowFloat !== undefined) throw new Error("Duplicate float() call");
        this.allowFloat = allow;
        if (mustBeIntegerMessage) this.intMessage = mustBeIntegerMessage;
        return this;
    }

    /**
     * Rounds this number field during transformation.
     * @param rounding The rounding method to apply.
     */
    public doRound(rounding: NumberRounding = "floor") {
        if (this.rounding) throw new Error("Duplicate doRound() call");
        this.rounding = rounding;
        return this;
    }

    public validate(value: unknown, context: ValidationContext = {}) {
        let n = super.validateNullable(value);
        if (n !== null) return n;

        if (typeof value !== "number" || isNaN(value)) return "Must be number";
        if (!(this.allowFloat ?? false) && !Number.isInteger(value)) return this.intMessage;

        return super.validateSize(value);
    }

    public transform(value: number, context: TransformationContext) {
        switch (this.rounding) {
            case "ceil":
                value = Math.ceil(value);
                break;
            case "floor":
                value = Math.floor(value);
                break;
            case "round":
                value = Math.round(value);
                break;
        }
        return super.transform(value);
    }
}

export class BooleanSchema extends Schema<boolean> {
    public constructor(requiredMessage?: string) {
        super(requiredMessage);
    }

    public validate(value: unknown, context: ValidationContext = {}) {
        let n = super.validateNullable(value);
        if (n !== null) return n;

        if (typeof value !== "boolean") return "Must be boolean";
    }
}

export class ValueSchema<T> extends Schema<T> {
    public constructor(protected value: T, requiredMessage?: string) {
        super(requiredMessage);
    }

    public validate(value: unknown, context: ValidationContext = {}) {
        let n = this.validateNullable(value);
        if (n !== null) return n;

        if (this.value !== value) return this.requiredMessage;
    }
}

export class ObjectSchema extends Schema<object> {
    public constructor(requiredMessage?: string) {
        super(requiredMessage);
    }

    public validate(value: unknown, context: ValidationContext) {
        let n = this.validateNullable(value);
        if (n !== null) return n;

        if (typeof value !== "object") return "Must be object";
    }
}

export type MappedObjectKeySchemas<T> = {
    [Key in keyof T]: Schema<T[Key]>;
};

export class MappedObjectSchema<T extends {}> extends Schema<T> {
    public constructor(protected fields: MappedObjectKeySchemas<T>, requiredMessage?: string) {
        super(requiredMessage);
    }

    public validate(value: unknown, context: ValidationContext = {}) {
        let n = this.validateNullable(value);
        if (n !== null) return n;

        if (typeof value !== "object") return "Invalid object";

        let keys = Object.keys(this.fields) as (keyof T)[];
        let err: ErrorMap<T> = {};
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let field = (value as T)[key];
            let result = this.fields[key].validate(field, context);
            if (result !== undefined) {
                err[key] = result;
                if (context.abortEarly ?? true) return err as ErrorType<T>;
            }
        }
        return Object.keys(err).length > 0 ? (err as ErrorType<T>) : undefined;
    }

    public transform(value: T, context: TransformationContext = {}): T {
        if (typeof value === "object" && value !== null) {
            let keys = Object.keys(this.fields) as (keyof T)[];
            let obj: T = {} as any;
            for (let i = 0; i < keys.length; i++) {
                let key = keys[i];
                obj[key] = this.fields[key].transform((value as T)[key], context);
            }
            return super.transform(obj, context);
        } else {
            return super.transform(value, context);
        }
    }
}

export type OrSchemasToType<T> = T extends [Schema<infer D>, ...infer E] ? D | OrSchemasToType<E> : never;

export class OrSchema<T extends [Schema<any>, ...Schema<any>[]]> extends Schema<OrSchemasToType<T>> {
    constructor(protected schemas: T, requiredMessage?: string) {
        super(requiredMessage);
    }

    public validate(value: unknown, context: ValidationContext = {}) {
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

export type AndSchemasToType<T> = T extends [Schema<infer D>, ...infer E] ? D & AndSchemasToType<E> : never;

export class AndSchema<T extends [Schema<any>, ...Schema<any>[]]> extends Schema<AndSchemasToType<T>> {
    constructor(protected schemas: T, requiredMessage?: string) {
        super(requiredMessage);
    }

    public validate(value: unknown, context: ValidationContext = {}) {
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
    constructor(protected schemas: T, requiredMessage?: string) {
        super(requiredMessage);
    }

    public validate(value: unknown, context: ValidationContext = {}) {
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
        if (Array.isArray(value)) {
            let arr = new Array(this.schemas.length) as TupleSchemasToType<T>;
            for (let i = 0; i < this.schemas.length; i++) {
                let schema = this.schemas[i];
                arr[i] = schema.transform(value[i], context);
            }
            return super.transform(arr, context);
        } else {
            return super.transform(value, context);
        }
    }
}

export class ArraySchema<T> extends SizeSchema<T[]> {
    constructor(protected schema: Schema<T>, requiredMessage?: string) {
        super(requiredMessage);
    }

    public validate(value: unknown, context: ValidationContext = {}) {
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

export class CustomSchema<T> extends Schema<T> {
    constructor(protected validator: Validator<T>, requiredMessage?: string) {
        super(requiredMessage);
    }

    public validate(value: unknown, context: ValidationContext = { abortEarly: true }): ErrorType<T, string> | undefined {
        return this.validator(value as T, context);
    }
}

export class DateSchema extends Schema<Date> {
    protected invalidMessage: string;

    constructor(requiredMessage?: string, invalidDateMessage?: string) {
        super(requiredMessage);
        this.invalidMessage = invalidDateMessage ?? "Invalid date";
    }

    public validate(value: unknown, context: ValidationContext = {}) {
        let n = super.validateNullable(value);
        if (n !== null) return n;

        if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
            let d = new Date(value);
            if (!isNaN(d.getTime())) return undefined;
        }
        return this.invalidMessage;
    }

    public transform(value: Date, context: TransformationContext = {}) {
        // Value can be string, number or Date (see validate), which the Date constructor all accepts
        if (typeof value === "string" || typeof value === "number" || value instanceof Date) value = new Date(value);

        return super.transform(value, context);
    }
}
