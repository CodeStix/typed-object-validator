import React, { useState } from "react";
import { AnyListener, FormError, FormInput, FormTextArea, Listener, useForm } from "typed-react-form";
import * as tv from "typed-object-validator";

const UserSchema = tv.object({
    firstName: tv.string().doTransformCase("capitalize").min(1, "Enter a first name").doSetWhenEmpty("nice"),
    lastName: tv.string().doTransformCase("capitalize").min(1, "Enter a last name"),
    title: tv.string().doTransformCase("kebab-lower-case"),
    data: tv.object().optional(),
    birthDate: tv.date("Enter a birth date"),
    gender: tv.value("male").or(tv.value("female")).doSetWhenEmpty("custom"),
});

type User = tv.SchemaType<typeof UserSchema>;

function App() {
    const [submitted, setSubmitted] = useState<User>();
    const form = useForm<Partial<User>>(
        { firstName: "", lastName: "" },
        (values) => UserSchema.validate(values as any, { abortEarly: false }) ?? ({} as any)
    );

    return (
        <div>
            <form
                style={{ margin: "2em" }}
                onReset={() => form.resetAll(false)}
                onSubmit={form.handleSubmit(() => {
                    console.log("submit", form.values);
                    setSubmitted({ ...form.values } as User);
                })}>
                <p>First name</p>
                <FormInput form={form} name="firstName" />
                <FormError form={form} name="firstName" />
                <p>Last name</p>
                <FormInput form={form} name="lastName" />
                <FormError form={form} name="lastName" />
                <p>Title</p>
                <FormTextArea form={form} name="title" />
                <FormError form={form} name="title" />
                <p>Birth date</p>
                <FormInput form={form} name="birthDate" type="date" />
                <FormError form={form} name="birthDate" />
                <p>Gender</p>
                <label>
                    <FormInput form={form} name="gender" type="radio" value="male" />
                    Male
                </label>
                <label>
                    <FormInput form={form} name="gender" type="radio" value="female" />
                    Female
                </label>
                <FormError form={form} name="gender" />
                <p>Unknown fields are filtered out in the transformed output</p>
                <button type="button" onClick={() => form.setValue("unknownKey" as any, false)}>
                    Set unknown field
                </button>
                <button type="submit">Register</button>
                <button type="reset">Reset</button>
            </form>
            <div style={{ margin: "2em" }}>
                <h2>Output</h2>
                <pre>
                    <AnyListener form={form} render={() => JSON.stringify(form.values, null, 2)} />
                </pre>
            </div>
            <div style={{ margin: "2em" }}>
                <h2>Transformed Output</h2>
                <pre>
                    <AnyListener form={form} render={() => JSON.stringify(UserSchema.transform(form.values as any), null, 2)} />
                </pre>
            </div>
        </div>
    );
}

export default App;
