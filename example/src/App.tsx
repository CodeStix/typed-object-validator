import React, { useState } from "react";
import { AnyListener, FormError, FormInput, FormTextArea, Listener, useForm } from "typed-react-form";
import * as tv from "typed-object-validator";

class UserClass {
    firstName!: string;
    lastName!: string;
    title!: string;
    data!: object | undefined;
    birthDate!: Date;
    gender!: "male" | "female";

    public printValues() {
        console.log("this user has instance", this.firstName, this.lastName);
    }
}

const UserSchema = tv
    .object({
        firstName: tv.string().doTransformCase("capitalize").min(1, "Enter a first name"),
        lastName: tv.string().doTransformCase("capitalize").min(1, "Enter a last name"),
        title: tv.string().doTransformCase("kebab-lower-case").doSetWhenEmpty(undefined),
        data: tv.object("Whoops").optional(),
        birthDate: tv.date("Enter a birth date"),
        gender: tv.value("male").or(tv.value("female"), "Please select male or female"),
    })
    .doPrototype(UserClass.prototype);

type User = tv.SchemaType<typeof UserSchema>;

function App() {
    const form = useForm<Partial<User>>(new UserClass(), (values) => UserSchema.validate(values as any, { abortEarly: false }) ?? ({} as any));

    return (
        <div>
            <form
                style={{ margin: "2em" }}
                onReset={() => form.resetAll(false)}
                onSubmit={form.handleSubmit(() => {
                    console.log("submit", form.values);

                    let user = UserSchema.transform(form.values as any);
                    user.printValues();
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
            {/* <div style={{ margin: "2em" }}>
                <h2>Errors</h2>
                <pre>
                    <AnyListener form={form} render={() => JSON.stringify(form.errorMap, null, 2)} />
                </pre>
            </div> */}
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
