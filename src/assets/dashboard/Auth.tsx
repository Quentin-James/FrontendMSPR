import { SignIn } from "@clerk/clerk-react";

function Auth() {
    return (
        <div className="auth-page">
            <SignIn routing="path" path="/auth" />
        </div>
    );
}

export default Auth;