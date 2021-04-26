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
    AndSchemasToType,
    AndSchema,
    AnySchema,
    MappedSchema,
} from "./schemas";

/**
 * Requires this field to be of type string.
 * @param requiredMessage The error to return if the value is undefined.
 */
export function string(requiredMessage?: string): StringSchema {
    return new StringSchema(requiredMessage);
}

/**
 * Requires this field to be of type string and match `/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/`.
 * @param invalidMessage The error to return if the email is invalid.
 * @param requiredMessage The error to return if the value is undefined.
 */
export function email(invalidMessage?: string, requiredMessage?: string) {
    return new StringSchema(requiredMessage).regex(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, invalidMessage);
}

/**
 * Requires this field to be of type number.
 * @param requiredMessage The error to return if the value is undefined.
 */
export function number(requiredMessage?: string): NumberSchema {
    return new NumberSchema(requiredMessage);
}

/**
 * Requires this field to be of type boolean.
 * @param requiredMessage The error to return if the value is undefined.
 */
export function boolean(requiredMessage?: string): BooleanSchema {
    return new BooleanSchema(requiredMessage);
}

/**
 * Requires this field to match a value exactly.
 * @param value The required value.
 * @param requiredMessage The error to return if the value is undefined.
 */
export function value<T extends string | number | boolean | null | undefined>(value: T, requiredMessage?: string): Schema<T> {
    return new ValueSchema(value, requiredMessage);
}

/**
 * Requires this field to be a object, matching the specfied keys and their validation schemas
 * @param fields The object and nested validation schemas the value must match.
 * @param requiredMessage The error to return if the value is undefined.
 */
export function object<T>(fields: MappedObjectKeySchemas<T>, requiredMessage?: string): MappedObjectSchema<T>;
/**
 * Requires this field to be a object, allowing all keys and values.
 * @param requiredMessage The error to return if the value is undefined.
 */
export function object<T>(requiredMessage?: string): ObjectSchema;
export function object() {
    if (typeof arguments[0] === "object") {
        return new MappedObjectSchema(arguments[0], arguments[1]);
    } else {
        return new ObjectSchema(arguments[0] ?? arguments[1]);
    }
}

/**
 * Requires this field to match at least one of the specified validation schemas.
 * @param requiredMessage The error to return if the value is undefined.
 */
export function or<T extends [Schema<any>, ...Schema<any>[]]>(schemas: T, requiredMessage?: string): Schema<OrSchemasToType<T>> {
    return new OrSchema(schemas, requiredMessage);
}

/**
 * Requires this field to match all of the specified validation schemas.
 * @param requiredMessage The error to return if the value is undefined.
 */
export function and<T extends [Schema<any>, ...Schema<any>[]]>(schemas: T, requiredMessage?: string): Schema<AndSchemasToType<T>> {
    return new AndSchema(schemas, requiredMessage);
}

/**
 * Requires this field to match a tuple type.
 * @param schemas The tuple and its item's schemas the value must match.
 * @param requiredMessage The error to return if the value is undefined.
 * @returns
 */
export function tuple<T extends [Schema<any>, ...Schema<any>[]]>(schemas: T, requiredMessage?: string): Schema<TupleSchemasToType<T>> {
    return new TupleSchema(schemas, requiredMessage);
}

/**
 * Requires this field to be an array with each item matching the passed validation schema.
 * @param schema The schema each array item must match.
 * @param requiredMessage The error to return if the value is undefined.
 */
export function array<T>(schema: Schema<T>, requiredMessage?: string) {
    return new ArraySchema(schema, requiredMessage);
}

/**
 * Requires this field to match a custom validator. **You should specify the field type by passing a generic parameter: `custom<User>(...)`**
 * @param validator A function that takes a value returns
 * @param requiredMessage The error to return if the value is undefined.
 */
export function custom<T>(validator: Validator<T>, requiredMessage?: string) {
    return new CustomSchema(validator, requiredMessage);
}

/**
 * Requires this field to be a date, or a number/string representing a date. It also transforms the number/string value to a Date instance during transformation.
 * @param requiredMessage The error to return if the value is undefined.
 * @param invalidMessage The error to return if the date format is invalid.
 */
export function date(requiredMessage?: string, invalidMessage?: string) {
    return new DateSchema(requiredMessage, invalidMessage);
}

/**
 * Requires this field to be anything.
 * @param requiredMessage The error to return if the value is undefined.
 */
export function any(requiredMessage?: string) {
    return new AnySchema(requiredMessage);
}

export function mapped<K extends string | number | symbol, V>(keySchema: Schema<K>, valueSchema: Schema<V>): MappedSchema<K, V> {
    return new MappedSchema(keySchema, valueSchema);
}
