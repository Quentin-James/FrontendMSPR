import { UserButton, useUser } from "@clerk/clerk-react";

function HeroHeader() {
    const { user } = useUser();

    console.log(user);

    return (
        <header className="hero-head">
            <div className="hero-head-left">
                <h1>Administration & Analytics</h1>

                <p className="subtitle">
                    Pilotage qualite des donnees et insights business sur les donnees
                    reelles.
                </p>
            </div>

            <div className="hero-head-right">
                <UserButton afterSignOutUrl="/auth" />

                <p className="welcome-text">
                    Bienvenue <strong>{user?.firstName}</strong>
                </p>
            </div>
        </header>
    );
}

export default HeroHeader;

