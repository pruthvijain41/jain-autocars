import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, doc, deleteDoc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Trash2, CheckCircle, XCircle, Star, MessageSquare } from 'lucide-react';

const AdminTestimonialsPage = () => {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTestimonials = useCallback(async () => {
        setError(null);
        try {
            const q = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTestimonials(data);
        } catch (err) {
            setError('Error fetching testimonials.');
            console.error('Error fetching testimonials:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTestimonials();
    }, [fetchTestimonials]);

    const handleUpdateApproval = async (id, currentStatus) => {
        try {
            await updateDoc(doc(db, 'testimonials', id), { approved: !currentStatus });
            setTestimonials(prev => prev.map(item =>
                item.id === id ? { ...item, approved: !currentStatus } : item
            ));
        } catch (err) {
            setError('Error updating testimonial status.');
        }
    };

    const handleDeleteTestimonial = async (id) => {
        if (window.confirm('Are you sure you want to permanently delete this testimonial?')) {
            try {
                await deleteDoc(doc(db, 'testimonials', id));
                setTestimonials(prev => prev.filter(item => item.id !== id));
            } catch (err) {
                setError('Error deleting testimonial.');
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-heading font-bold text-slate-900">Testimonial Management</h1>
                <p className="text-slate-500 text-sm">Review and approve customer feedback</p>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading testimonials...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-medium">
                    {error}
                </div>
            ) : testimonials.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                    <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-400 font-medium">No testimonials submitted yet.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rating</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Testimonial</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {testimonials.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 align-top">
                                            <p className="font-bold text-slate-900">{item.name}</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={16}
                                                        className={i < item.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top max-w-md">
                                            <p className="text-sm text-slate-700 italic leading-relaxed">"{item.text || item.testimonial}"</p>
                                        </td>
                                        <td className="px-6 py-4 align-top text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleUpdateApproval(item.id, item.approved)}
                                                    className={`
                                                        flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                                                        ${item.approved
                                                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                                                        }
                                                    `}
                                                >
                                                    {item.approved ? (
                                                        <><XCircle size={14} /> Un-approve</>
                                                    ) : (
                                                        <><CheckCircle size={14} /> Approve</>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTestimonial(item.id)}
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
                        {testimonials.map((item) => (
                            <div key={item.id} className="p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-900">{item.name}</p>
                                        <p className="text-xs text-slate-400">
                                            {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={14}
                                                className={i < item.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-700 italic leading-relaxed">
                                    "{item.text || item.testimonial}"
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        onClick={() => handleUpdateApproval(item.id, item.approved)}
                                        className={`
                                            flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all
                                            ${item.approved
                                                ? 'bg-amber-50 text-amber-700'
                                                : 'bg-green-50 text-green-700'
                                            }
                                        `}
                                    >
                                        {item.approved ? (
                                            <><XCircle size={16} /> Un-approve</>
                                        ) : (
                                            <><CheckCircle size={16} /> Approve</>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTestimonial(item.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTestimonialsPage;