import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    FaEdit, FaTrash, FaArrowLeft, FaSpinner,
    FaEye, FaTimes, FaChevronLeft, FaChevronRight
} from "react-icons/fa";

interface Dispatcher {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    zone: string;
    address?: string;
    cni?: string;
    active?: boolean;
}

interface Props {
    onDispatchersUpdate?: (count: number) => void;
}

const DispatchersTab: React.FC<Props> = ({ onDispatchersUpdate }) => {
    const [dispatchers, setDispatchers] = useState<Dispatcher[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDispatcher, setSelectedDispatcher] = useState<Dispatcher | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    // --- 1. States ديال الـ Pagination ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const initialForm = {
        userId: "", firstName: "", lastName: "", email: "",
        password: "", confirmPassword: "", phone: "",
        cni: "", zone: "", address: "", role: "DISPATCHER"
    };
    const [formData, setFormData] = useState(initialForm);

    const API_URL = "http://localhost:8081/api/profiles";
    const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

    const fetchDispatchers = async () => {
        try {
            const response = await axios.get(API_URL, { headers: getAuthHeader() });

            // --- التعديل هنا: كنصفيو فقط الـ DISPATCHER ---
            const onlyDispatchers = response.data.filter((user: any) => user.role === "DISPATCHER");

            setDispatchers(onlyDispatchers);
            if (onDispatchersUpdate) onDispatchersUpdate(onlyDispatchers.length);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => { fetchDispatchers(); }, []);

    // --- 2. Logic ديال حساب الصفحات ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = dispatchers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(dispatchers.length / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEditClick = (d: Dispatcher) => {
        setFormData({
            ...initialForm,
            userId: d.userId.toString(),
            firstName: d.firstName || "",
            lastName: d.lastName || "",
            email: d.email || "",
            phone: d.phone || "",
            cni: d.cni || "",
            zone: d.zone || "",
            address: d.address || "",
        });
        setIsEditing(true);
        setIsFormOpen(true);
    };

    const cancelAction = () => {
        setIsFormOpen(false);
        setIsEditing(false);
        setFormData(initialForm);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isEditing) {
                await axios.put(`${API_URL}/${formData.userId}`, formData, { headers: getAuthHeader() });
            } else {
                await axios.post(API_URL, formData, { headers: getAuthHeader() });
            }
            cancelAction();
            fetchDispatchers();
        } catch (error: any) {
            alert("Erreur: " + (error.response?.data?.message || "Error"));
        } finally { setIsLoading(false); }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Voulez-vous vraiment supprimer ce dispatcher ?")) {
            try {
                await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
                fetchDispatchers();
            } catch (error) { alert("Erreur."); }
        }
    };

    return (
        <div className="management-section">
            {!isFormOpen ? (
                <>
                    <div className="header-flex">
                        <h2 className="section-title">Manage Dispatchers </h2>
                        <button className="btn-add" onClick={() => { setIsEditing(false); setIsFormOpen(true); }}>
                            + Add New
                        </button>
                    </div>
                    <div className="table-container">
                        <table className="custom-table">
                            <thead>
                            <tr>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Zone</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {/* كنرسمو غير الـ currentItems ماشي كاع الـ dispatchers */}
                            {currentItems.map((d) => (
                                <tr key={d.userId}>
                                    <td>{d.firstName} {d.lastName}</td>
                                    <td>{d.email}</td>
                                    <td>{d.phone}</td>
                                    <td>{d.zone}</td>
                                    <td className="action-buttons">
                                        <FaEye className="icon-view" onClick={() => { setSelectedDispatcher(d); setShowDetails(true); }} />
                                        <FaEdit className="icon-edit" onClick={() => handleEditClick(d)} />
                                        <FaTrash className="icon-delete" onClick={() => handleDelete(d.userId)} />
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {/* --- 3. تصميم الـ Pagination Buttons --- */}
                        {totalPages > 1 && (
                            <div className="pagination-container">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => paginate(currentPage - 1)}
                                    className="page-nav-btn"
                                >
                                    <FaChevronLeft />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => paginate(i + 1)}
                                        className={`page-number ${currentPage === i + 1 ? 'active' : ''}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => paginate(currentPage + 1)}
                                    className="page-nav-btn"
                                >
                                    <FaChevronRight />
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="form-container">
                    {/* ... (نفس كود الفورم ديالك بلا تغيير) ... */}
                    <div className="header-flex">
                        <h2 className="page-title">{isEditing ? "Edit Dispatcher" : "New Dispatcher"}</h2>
                        <button className="btn-back" onClick={cancelAction}><FaArrowLeft /> Back</button>
                    </div>
                    <div className="form-card-clean">
                        <form onSubmit={handleSave}>
                            <div className="form-row-grid">
                                <div className="input-block"><label>First Name</label><input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange} /></div>
                                <div className="input-block"><label>Last Name</label><input type="text" name="lastName" required value={formData.lastName} onChange={handleInputChange} /></div>
                            </div>
                            <div className="form-row-grid">
                                <div className="input-block"><label>CNI</label><input type="text" name="cni" value={formData.cni} onChange={handleInputChange} /></div>
                                <div className="input-block"><label>Phone Number</label><input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} /></div>
                            </div>
                            <div className="form-row-grid">
                                <div className="input-block">
                                    <label>Zone / City</label>
                                    <select name="zone" required value={formData.zone} onChange={handleInputChange} className="clean-select">
                                        <option value="">Select Zone</option>
                                        <option value="Maarif">Maarif</option>
                                        <option value="Sidi Bernoussi">Sidi Bernoussi</option>
                                        <option value="Casablanca">Casablanca</option>
                                    </select>
                                </div>
                                <div className="input-block"><label>Address</label><input type="text" name="address" value={formData.address} onChange={handleInputChange} /></div>
                            </div>

                            <div className="input-block">
                                <label>Email Address</label>
                                <input type="email" name="email" required value={formData.email} onChange={handleInputChange} disabled={isEditing} />
                            </div>

                            {!isEditing && (
                                <div className="form-row-grid">
                                    <div className="input-block"><label>Password</label><input type="password" name="password" required value={formData.password} onChange={handleInputChange} /></div>
                                    <div className="input-block"><label>Confirm</label><input type="password" name="confirmPassword" required onChange={handleInputChange} /></div>
                                </div>
                            )}

                            <div className="form-footer">
                                <button type="submit" className="save-changes-btn" disabled={isLoading}>
                                    {isLoading ? <FaSpinner className="spinner" /> : (isEditing ? "Update Profile" : "Create Account")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Details (نفس كود المودال ديالك) */}
            {showDetails && selectedDispatcher && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Dispatcher Details</h3>
                            <FaTimes onClick={() => setShowDetails(false)} style={{ cursor: 'pointer' }} />
                        </div>
                        <div className="modal-body">
                            <p><strong>Full Name:</strong> {selectedDispatcher.firstName} {selectedDispatcher.lastName}</p>
                            <p><strong>Email:</strong> {selectedDispatcher.email}</p>
                            <p><strong>Phone:</strong> {selectedDispatcher.phone}</p>
                            <p><strong>CNI:</strong> {selectedDispatcher.cni || "N/A"}</p>
                            <p><strong>Zone:</strong> {selectedDispatcher.zone}</p>
                            <p><strong>Address:</strong> {selectedDispatcher.address || "N/A"}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DispatchersTab;