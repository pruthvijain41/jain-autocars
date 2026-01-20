import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import AdminCarForm from '../components/forms/AdminCarForm';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';

const AdminCarsPage = () => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCar, setEditingCar] = useState(null);

    const fetchCars = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const q = query(collection(db, 'cars'));
            const querySnapshot = await getDocs(q);
            const carsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCars(carsData);
        } catch (err) {
            setError('Error fetching cars. Please try again.');
            console.error('Error fetching cars:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCars();
    }, [fetchCars]);

    const handleDeleteCar = useCallback(async (carId) => {
        if (window.confirm('Are you sure you want to delete this car? This action cannot be undone.')) {
            try {
                await deleteDoc(doc(db, 'cars', carId));
                fetchCars();
            } catch (err) {
                setError('Error deleting car.');
                console.error('Error deleting car:', err);
            }
        }
    }, [fetchCars]);

    const handleEditCar = (car) => {
        setEditingCar(car);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingCar(null);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingCar(null);
    };

    const handleCarUpdated = () => {
        fetchCars();
        handleFormClose();
    };

    const filteredCars = cars.filter(car =>
        `${car.make || ''} ${car.model || ''} ${car.year || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-slate-900">Cars Management</h1>
                    <p className="text-slate-500 text-sm">Manage your vehicle inventory</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all"
                >
                    <Plus size={20} />
                    Add New Car
                </button>
            </div>

            {/* Search & Stats */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by make, model, or year..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-sm font-bold text-slate-600">
                    <span>Total Cars:</span>
                    <span className="text-primary">{cars.length}</span>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading inventory...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-medium">
                    {error}
                </div>
            ) : filteredCars.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">No cars found matching your search.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Owner</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCars.map((car) => (
                                    <tr key={car.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                                                    {car.imageUrls?.[0] ? (
                                                        <img src={car.imageUrls[0]} alt={car.model} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-slate-300">
                                                            <Car size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{car.year} {car.make} {car.model}</p>
                                                    <p className="text-xs text-slate-500">{car.mileage} km • {car.fuelType}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-700">₹{Number(car.price).toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                {car.owner || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditCar(car)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCar(car.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden divide-y divide-slate-100">
                        {filteredCars.map((car) => (
                            <div key={car.id} className="p-4 flex flex-col gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="h-20 w-20 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 shadow-sm">
                                        {car.imageUrls?.[0] ? (
                                            <img src={car.imageUrls[0]} alt={car.model} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-slate-300">
                                                <Car size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 text-lg leading-tight mb-1">{car.year} {car.make} {car.model}</p>
                                        <p className="text-sm text-slate-500 mb-2">{car.mileage} km • {car.fuelType}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-primary">₹{Number(car.price).toLocaleString()}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                                                {car.owner || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => handleEditCar(car)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-50 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors"
                                    >
                                        <Edit2 size={16} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCar(car.id)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingCar ? 'Edit Vehicle' : 'Add New Vehicle'}
                            </h2>
                            <button
                                onClick={handleFormClose}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            <AdminCarForm
                                editingCar={editingCar}
                                setEditingCar={setEditingCar}
                                onCarUpdated={handleCarUpdated}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCarsPage;