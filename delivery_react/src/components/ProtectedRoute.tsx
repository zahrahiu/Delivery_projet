// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const token = localStorage.getItem("token");

    if (!token) {
        // ما كاينش token → redirect لل login
        return <Navigate to="/login" replace />;
    }

    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const roles = payload.roles || [];

        const isAllowed = roles.some((role: string) => allowedRoles.includes(role));
        if (!isAllowed) return <Navigate to="/" replace />; // ماعندوش access

        return <>{children}</>;
    } catch (err) {
        console.error(err);
        return <Navigate to="/login" replace />;
    }
};

export default ProtectedRoute;