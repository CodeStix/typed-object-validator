import { OrSchema, AndSchema } from "./primitive";

export type ErrorType<T, Error extends string = string> = Error | (NonNullable<T> extends {} ? ErrorMap<NonNullable<T>, Error> : never);

export type ErrorMap<T, Error extends string = string> = {
    [Key in keyof T]?: ErrorType<T[Key], Error>;
};

export type Validator<T, Error extends string = string> = (value: T, context: ValidationContext) => ErrorType<T, Error> | undefined;

export type Transformer<T> = (value: T) => T;

export abstract class Schema<T> {
    protected isNullable = false;
    protected isNullableMessage = "Null is not acceptable";
    protected isOptional = false;
    protected isOptionalMessage = "Value must exist";
    protected customTransformer?: Transformer<T>;

    optional(message?: string) {
        if (this.isOptional) throw new Error("Duplicate optional() call");
        this.isOptional = true;
        if (message) this.isOptionalMessage = message;
        return this as Schema<T | undefined>;
    }

    nullable(message?: string) {
        if (this.isNullable) throw new Error("Duplicate nullable() call");
        this.isNullable = true;
        if (message) this.isNullableMessage = message;
        return this as Schema<T | null>;
    }

    or<D>(other: Schema<D>): Schema<T | D> {
        return new OrSchema([this, other]) as Schema<T | D>;
    }

    and<D>(other: Schema<D>): Schema<T & D> {
        return new AndSchema([this, other]) as Schema<T & D>;
    }

    doCustom(transformer: Transformer<T>) {
        this.customTransformer = transformer;
        return this;
    }

    /**
     * Returns null when value is valid but not falsey, undefined when valid, string when error.
     */
    protected validateNullable(value: T): string | null | undefined {
        if (value === undefined) return this.isOptional ? undefined : this.isOptionalMessage;
        if (value === null) return this.isNullable ? undefined : this.isNullableMessage;
        return null;
    }

    public abstract validate(value: T, context: ValidationContext): ErrorType<T> | undefined;

    public transform(value: T, context: TransformationContext) {
        if (this.customTransformer) value = this.customTransformer(value);
        return value;
    }
}

export abstract class SizeSchema<T extends number | { length: number }> extends Schema<T> {
    protected minValue?: number;
    protected minMessage = "Must be longer";
    protected maxValue?: number;
    protected maxMessage = "Must be shorter";

    public min(min: number, message?: string): SizeSchema<T> {
        if (this.minValue !== undefined) throw new Error("Duplicate min() call");
        this.minValue = min;
        if (message) this.minMessage = message;
        return this;
    }

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

export type SchemaType<T extends Schema<any>> = T extends Schema<infer D> ? D : never;

export interface ValidationContext {
    abortEarly?: boolean;
    defaultMaxStringLength?: number;
}

export interface TransformationContext {
    trimStrings?: boolean;
}
