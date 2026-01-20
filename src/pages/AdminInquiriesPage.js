import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, doc, deleteDoc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Trash2, MessageSquare, Phone, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const AdminInquiriesPage = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchInquiries = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const q = query(collection(db, 'inquiries'), orderBy('submittedAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const inquiriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInquiries(inquiriesData);
        } catch (err) {
            setError('Error fetching inquiries.');
            console.error('Error fetching inquiries:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInquiries();
    }, [fetchInquiries]);

    const handleDeleteInquiry = async (inquiryId) => {
        if (window.confirm('Are you sure you want to delete this inquiry?')) {
            try {
                await deleteDoc(doc(db, 'inquiries', inquiryId));
                fetchInquiries();
            } catch (err) {
                setError('Error deleting inquiry.');
                console.error('Error deleting inquiry:', err);
            }
        }
    };

    const handleUpdateStatus = async (inquiryId, newStatus) => {
        try {
            await updateDoc(doc(db, 'inquiries', inquiryId), { status: newStatus });
            // Optimistic update
            setInquiries(prev => prev.map(inq =>
                inq.id === inquiryId ? { ...inq, status: newStatus } : inq
            ));
        } catch (err) {
            setError('Error updating status.');
            console.error('Error updating status:', err);
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'resolved': return 'bg-green-100 text-green-700';
            case 'contacted': return 'bg-blue-100 text-blue-700';
            default: return 'bg-yellow-100 text-yellow-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-heading font-bold text-slate-900">Customer Inquiries</h1>
                <p className="text-slate-500 text-sm">Track and manage customer messages</p>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading inquiries...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-medium">
                    {error}
                </div>
            ) : inquiries.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                    <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-400 font-medium">No inquiries received yet.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Message</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {inquiries.map((inq) => (
                                    <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 align-top w-1/4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 font-bold text-slate-900">
                                                    <User size={16} className="text-slate-400" />
                                                    {inq.name}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                                    <Phone size={14} />
                                                    {inq.phone}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1">
                                                    {inq.submittedAt?.seconds ? new Date(inq.submittedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top w-1/2">
                                            {inq.carName && (
                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold mb-2">
                                                    Regarding: {inq.carName}
                                                </div>
                                            )}
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                {inq.message}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <select
                                                value={inq.status || 'new'}
                                                onChange={(e) => handleUpdateStatus(inq.id, e.target.value)}
                                                className={`
                                                    text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border-none focus:ring-2 focus:ring-primary/20 cursor-pointer
                                                    ${getStatusColor(inq.status || 'new')}
                                                `}
                                            >
                                                <option value="new">New</option>
                                                <option value="contacted">Contacted</option>
                                                <option value="resolved">Resolved</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 align-top text-right">
                                            <button
                                                onClick={() => handleDeleteInquiry(inq.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Inquiry"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden divide-y divide-slate-100">
                        {inquiries.map((inq) => (
                            <div key={inq.id} className="p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 flex items-center gap-2">
                                            <User size={16} className="text-slate-400" /> {inq.name}
                                        </span>
                                        <span className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                                            <Phone size={14} /> {inq.phone}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {inq.submittedAt?.seconds ? new Date(inq.submittedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                    </span>
                                </div>

                                {inq.carName && (
                                    <div className="inline-block self-start px-2 py-1 rounded-md bg-slate-50 text-slate-600 text-xs font-bold">
                                        Re: {inq.carName}
                                    </div>
                                )}

                                <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-700 leading-relaxed">
                                    {inq.message}
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <select
                                        value={inq.status || 'new'}
                                        onChange={(e) => handleUpdateStatus(inq.id, e.target.value)}
                                        className={`
                                            text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border-none focus:ring-2 focus:ring-primary/20 cursor-pointer
                                            ${getStatusColor(inq.status || 'new')}
                                        `}
                                    >
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="resolved">Resolved</option>
                                    </select>

                                    <button
                                        onClick={() => handleDeleteInquiry(inq.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
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

export default AdminInquiriesPage;