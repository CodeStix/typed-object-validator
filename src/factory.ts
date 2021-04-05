import {
    Schema,
    Validator,
    ArraySchema,
    BooleanSchema,
    CustomSchema,
    DateSchema,
    MappedObjectKeySchemas,
    MappedObjectSchema,
    NumberSchema,
    ObjectSchema,
    OrSchema,
    OrSchemasToType,
    StringSchema,
    TupleSchema,
    TupleSchemasToType,
    ValueSchema,
} from "./schemas";

export function string(requiredMessage?: string): StringSchema {
    return new StringSchema(requiredMessage);
}

export function email(invalidMessage?: string, requiredMessage?: string) {
    return new StringSchema(requiredMessage).regex(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, invalidMessage);
}

export function number(requiredMessage?: string): NumberSchema {
    return new NumberSchema(requiredMessage);
}

export function boolean(requiredMessage?: string): BooleanSchema {
    return new BooleanSchema(requiredMessage);
}

export function value<T extends string | number | boolean | null | undefined>(value: T, requiredMessage?: string): Schema<T> {
    return new ValueSchema(value, requiredMessage);
}

export function object<T>(fields: MappedObjectKeySchemas<T>, requiredMessage?: string): MappedObjectSchema<T>;
export function object<T>(requiredMessage?: string): ObjectSchema;
export function object() {
    if (typeof arguments[0] === "object") {
        return new MappedObjectSchema(arguments[0], arguments[1]);
    } else {
        return new ObjectSchema(arguments[0] ?? arguments[1]);
    }
}

export function or<T extends [Schema<any>, ...Schema<any>[]]>(schemas: T, requiredMessage?: string): Schema<OrSchemasToType<T>> {
    return new OrSchema(schemas, requiredMessage);
}

export function tuple<T extends [Schema<any>, ...Schema<any>[]]>(schemas: T, requiredMessage?: string): Schema<TupleSchemasToType<T>> {
    return new TupleSchema(schemas, requiredMessage);
}

export function array<T>(schema: Schema<T>, requiredMessage?: string) {
    return new ArraySchema(schema, requiredMessage);
}

export function custom<T>(validator: Validator<T>, requiredMessage?: string) {
    return new CustomSchema(validator, requiredMessage);
}

export function date(requiredMessage?: string, invalidMessage?: string) {
    return new DateSchema(requiredMessage, invalidMessage);
}
