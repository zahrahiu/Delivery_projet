import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login/Login";
import Signup from "./components/SignUp/SignUp";
import AdminDashboard from "./components/Admin/AdminDashboard";
import DispatcherDashboard from "./components/Dispatchers/DispatcherDashboard"; // خاصك تكريه
import ProtectedRoute from "./components/ProtectedRoute";
import LivreurDashboard from "./components/Livreurs/LivreurDashboard";
import ClientDashboard from "./components/Clients/ClientDashboard";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/Signup" element={<Signup />} />

                {/* Route محمي لل admin */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Route محمي لل dispatcher */}
                <Route
                    path="/dispatcher"
                    element={
                        <ProtectedRoute allowedRoles={["DISPATCHER"]}>
                            <DispatcherDashboard />
                        </ProtectedRoute>
                    }
                />

                // داخل الـ Routes
                <Route
                    path="/livreur"
                    element={
                        <ProtectedRoute allowedRoles={["LIVREUR"]}>
                            <LivreurDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/client"
                    element={
                        <ProtectedRoute allowedRoles={["CLIENT"]}>
                            <ClientDashboard />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;