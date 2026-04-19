import "./App.css";
import DashboardScreen from "./assets/dashboard/DashboardScreen";
import Auth from "./assets/dashboard/Auth";

import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
    RouterProvider,
    Navigate,
} from "react-router-dom";

import {
    SignedIn,
    SignedOut,
} from "@clerk/clerk-react";


// Route protégée
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    return (
        <>
            <SignedIn>{children}</SignedIn>

            <SignedOut>
                <Navigate to="/auth" replace />
            </SignedOut>
        </>
    );
}


// Route auth
function AuthRoute() {
    return (
        <>
            <SignedOut>
                <Auth />
            </SignedOut>

            <SignedIn>
                <Navigate to="/" replace />
            </SignedIn>
        </>
    );
}

const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            <Route path="/auth" element={<AuthRoute />} />

            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <DashboardScreen />
                    </ProtectedRoute>
                }
            />
        </>
    )
);

function App() {
    return <RouterProvider router={router} />;
}

export default App;