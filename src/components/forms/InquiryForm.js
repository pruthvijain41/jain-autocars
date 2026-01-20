import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

const InquiryForm = ({ carId }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        message: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const inquiryData = {
                name: formData.name,
                phone: formData.phone,
                message: formData.message,
                submittedAt: serverTimestamp(),
                status: 'new',
            };

            if (carId) {
                inquiryData.carId = carId;
            }

            await addDoc(collection(db, 'inquiries'), inquiryData);
            setSuccess(true);
            setFormData({ name: '', phone: '', message: '' });

        } catch (e) {
            setError('Error submitting inquiry. Please try again.');
            console.error('Error adding inquiry document: ', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-heading font-bold text-slate-900 mb-4">
                {carId ? 'Inquire About This Car' : 'Send Us a Message'}
            </h2>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                    name="name"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all bg-slate-50 focus:bg-white"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                    name="phone"
                    type="tel"
                    placeholder="Your Phone Number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all bg-slate-50 focus:bg-white"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea
                    name="message"
                    placeholder="Your Message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all bg-slate-50 focus:bg-white resize-none"
                ></textarea>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                    <CheckCircle size={16} /> Inquiry submitted successfully!
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? 'Sending...' : <><Send size={18} /> Submit Inquiry</>}
            </button>
        </form>
    );
};

export default InquiryForm;