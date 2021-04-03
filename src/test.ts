function string(): StringSchema {
    return new StringSchema();
}

class Schema<T> {
    private isNullable = false;
    private isOptional = false;

    optional(): Schema<T | undefined> {
        this.isOptional = true;
        return this;
    }

    nullable(): Schema<T | null> {
        this.isNullable = true;
        return this;
    }
}

class StringSchema extends Schema<string> {
    private minLength?: number;
    private maxLength?: number;

    min(min: number): StringSchema {
        this.minLength = min;
        return this;
    }

    max(max: number): StringSchema {
        this.maxLength = max;
        return this;
    }
}

type ObjectFieldSchemas<T> = {
    [Key in keyof T]: Schema<T[Key]>;
};

class ObjectSchema<T> extends Schema<T> {
    constructor(private fields: ObjectFieldSchemas<T>) {
        super();
    }
}

function object<T>(fields: ObjectFieldSchemas<T>) {
    return new ObjectSchema(fields);
}

type OrFieldSchemas<T> = {
    [Key in keyof T]: Schema<T[Key]>;
};

type SchemaType<T extends Schema<any>> = T extends Schema<infer D> ? D : never;

class OrSchema<T extends [Schema<any>, ...Schema<any>[]]> extends Schema<SchemaType<T[number]>> {
    constructor(private schemas: T) {
        super();
    }
}

function or<T extends [Schema<any>, ...Schema<any>[]]>(schemas: T) {
    return new OrSchema(schemas) as Schema<SchemaType<T[number]>>;
}

let a = string().min(100).max(21);
let d = string().optional();

let b = object({
    nice: string().min(100),
});

let c = or([a, d, b]);

let e: SchemaType<typeof c>;
