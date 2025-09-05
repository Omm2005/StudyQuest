'use server'

import { signOut } from "."

const SignOutOption = async () => {
    await signOut();
}

export default SignOutOption