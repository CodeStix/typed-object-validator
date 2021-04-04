import * as tv from "../src";

function testUser() {
    const GenderSchema = tv.value("male").or(tv.boolean());

    console.log(GenderSchema.validate(false));

    const NameSchema = tv.string().min(5).max(30);

    const UserSchema = tv.object({
        firstName: tv.string().min(5, "First name must be longer").max(10, "First name must be shorter"),
        lastName: NameSchema,
    });

    let a = UserSchema.validate({ lastName: "nicef", firstName: "asdff" });

    console.log(a);
}

testUser();
