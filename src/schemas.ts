import { OrSchema, AndSchema } from "./primitive";

export type ErrorType<T, Error extends string = string> = Error | (NonNullable<T> extends {} ? ErrorMap<NonNullable<T>, Error> : never);

export type ErrorMap<T, Error extends string = string> = {
    [Key in keyof T]?: ErrorType<T[Key], Error>;
};

export type Validator<T, Error extends string = string> = (value: unknown, context: ValidationContext) => ErrorType<T, Error> | undefined;

export type Transformer<T> = (value: T) => T;

export abstract class Schema<T> {
    protected isNullable = false;
    protected noNullMessage: string;
    protected isOptional = false;
    protected requiredMessage: string;

    private customTransformer?: Transformer<T>;
    private whenEmptyValue?: { set: T };
    private setPrototype?: T;

    protected constructor(requiredMessage?: string, noNullMessage?: string) {
        this.requiredMessage = requiredMessage ?? "Enter a value";
        this.noNullMessage = noNullMessage ?? "Null is not acceptable";
    }

    public optional() {
        if (this.isOptional) throw new Error("Duplicate optional() call");
        this.isOptional = true;
        return this as Schema<T | undefined>;
    }

    public nullable() {
        if (this.isNullable) throw new Error("Duplicate nullable() call");
        this.isNullable = true;
        return this as Schema<T | null>;
    }

    public or<D>(other: Schema<D>, requiredMessage?: string): Schema<T | D> {
        return new OrSchema([this, other], requiredMessage) as Schema<T | D>;
    }

    public and<D>(other: Schema<D>, requiredMessage?: string): Schema<T & D> {
        return new AndSchema([this, other], requiredMessage) as Schema<T & D>;
    }

    public doSetWhenEmpty<D extends string>(valueToSet: D): Schema<T | D>;
    public doSetWhenEmpty<D extends any>(valueToSet: D): Schema<T | D>;
    public doSetWhenEmpty<D>(valueToSet: D): Schema<T | D> {
        if (this.whenEmptyValue) throw new Error("Duplicate doSetWhenEmpty() call");
        this.whenEmptyValue = { set: valueToSet as any };
        return this as Schema<T | D>;
    }

    public doCustom(transformer: Transformer<T>) {
        if (this.customTransformer) throw new Error("Duplicate doCustom() call");
        this.customTransformer = transformer;
        return this;
    }

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

    public abstract validate(value: unknown, context: ValidationContext): ErrorType<T> | undefined;

    public transform(value: T, context: TransformationContext = {}): T {
        if (this.customTransformer) value = this.customTransformer(value);
        if (this.whenEmptyValue) value = value ? value : this.whenEmptyValue.set;
        if (this.setPrototype) value = Object.assign(this.setPrototype, value);
        return value;
    }
}

export abstract class SizeSchema<T> extends Schema<T> {
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
}

export interface TransformationContext {
    trimStrings?: boolean;
}
