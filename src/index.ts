import { OrSchema, OrSchemasToType } from "./primitive";

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

export abstract class SizeSchema<T extends number | { length: number }> extends Schema<T> {
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

export type SchemaType<T extends Schema<any>> = T extends Schema<infer D> ? D : never;

// let g = tuple([string(), string()])
