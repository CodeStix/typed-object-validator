import * as tv from "../src";

function testUser() {
    const NameSchema = tv.string().min(5).max(30);

    const UserSchema = tv.object({
        firstName: NameSchema,
        lastName: NameSchema,
    });

    let a = UserSchema.validate({ lastName: "nicef", firstName: "oofdf" });

    console.log(a);
}

testUser();
