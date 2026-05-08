import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";

import Home from "./components/Home";
import Login from "./components/Login/Login";
import Signup from "./components/SignUp/SignUp";
import AdminDashboard from "./components/Admin/AdminDashboard";
import DispatcherDashboard from "./components/Dispatchers/DispatcherDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import LivreurDashboard from "./components/Livreurs/LivreurDashboard";
import ClientDashboard from "./components/Clients/ClientDashboard";
import UserProfile from "./components/Profile/UserProfile";
import EditProfile from "./components/Profile/EditProfile";
import ColisManagement from "./components/Dispatchers/ ColisManagement";
import AddColisForm from "./components/Dispatchers/AddColisForm";
import UpdateColisForm from "./components/Dispatchers/UpdateColisForm";
import PendingUsers from "./components/Admin/PendingUsers";
import DispatchersList from "./components/Admin/DispatchersTab";
import LivreursList from "./components/Admin/LivreursTab";
import ClientsList from "./components/Admin/ClientsTab";
import VillesManagement from "./components/Admin/VillesTab";
import ZonesManagement from "./components/Admin/ZonesTab";
import ColisList from "./components/Admin/ColisList";
import LivreurList from "./components/Dispatchers/LivreurList";
import axios from "axios";

function App() {

    const [globalNotifications, setGlobalNotifications] = useState([]);

    const fetchNotifications = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const res = await axios.get(
                "http://localhost:8888/notification-service/api/notifications/admin-alerts",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setGlobalNotifications(res.data);
        } catch (err) {
            console.error("Erreur notifications:", err);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/Signup" element={<Signup />} />

                {/* Routes ADMIN */}
                <Route path="/admin" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/dispatchers" element={<ProtectedRoute allowedRoles={["ADMIN"]}><DispatchersList /></ProtectedRoute>} />
                <Route path="/admin/livreurs" element={<ProtectedRoute allowedRoles={["ADMIN"]}><LivreursList /></ProtectedRoute>} />
                <Route path="/admin/clients" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ClientsList /></ProtectedRoute>} />
                <Route path="/admin/villes" element={<ProtectedRoute allowedRoles={["ADMIN"]}><VillesManagement /></ProtectedRoute>} />
                <Route path="/admin/zones" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ZonesManagement /></ProtectedRoute>} />
                <Route path="/admin/colis" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ColisList /></ProtectedRoute>} />
                <Route path="/admin/pending-users" element={<ProtectedRoute allowedRoles={["ADMIN"]}><PendingUsers /></ProtectedRoute>} />

                {/* Routes DISPATCHER */}
                <Route path="/dispatcher/*" element={<ProtectedRoute allowedRoles={["DISPATCHER"]}><DispatcherDashboard /></ProtectedRoute>} />

                {/* Routes LIVREUR */}
                <Route path="/livreur/*" element={<ProtectedRoute allowedRoles={["LIVREUR"]}><LivreurDashboard /></ProtectedRoute>} />

                {/* Routes CLIENT */}
                <Route path="/client/*" element={
                    <ProtectedRoute allowedRoles={["CLIENT"]}>
                        <ClientDashboard />
                    </ProtectedRoute>
                } />
                {/* Routes Communes */}
                <Route path="/profile" element={<ProtectedRoute allowedRoles={["ADMIN", "DISPATCHER", "LIVREUR", "CLIENT"]}><UserProfile /></ProtectedRoute>} />
                <Route path="/edit-profile" element={<EditProfile />} />

            </Routes>

        </BrowserRouter>
    );
}

export default App;