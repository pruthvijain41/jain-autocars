import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { Calendar, Check, AlertCircle, ArrowRight } from 'lucide-react';
import Honeypot from './Honeypot';

const TIME_SLOTS = [
    '10:00 AM', '11:00 AM', '12:00 PM',
    '02:00 PM', '03:00 PM', '04:00 PM',
    '05:00 PM', '06:00 PM',
];

const todayISO = () => new Date().toISOString().slice(0, 10);
const maxDateISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
};

const Field = ({ label, children }) => (
    <label className="block rounded-2xl border border-ink/15 px-4 py-2.5 focus-within:border-ink transition-colors bg-white/60">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">{label}</div>
        {children}
    </label>
);

const inputClassName = "w-full bg-transparent text-[15px] py-1 placeholder:text-ink-faint outline-none border-0 focus:ring-0 focus:border-0 p-0 mt-1 text-ink";

const TestDriveForm = ({ carId, carName, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        date: '',
        timeSlot: TIME_SLOTS[0],
        notes: '',
    });
    const [honeypot, setHoneypot] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        if (honeypot) {
            setTimeout(() => { setSuccess(true); setLoading(false); }, 600);
            return;
        }

        try {
            await addDoc(collection(db, 'testDrives'), {
                carId,
                carName,
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim() || null,
                date: formData.date,
                timeSlot: formData.timeSlot,
                notes: formData.notes.trim() || null,
                status: 'pending',
                createdAt: serverTimestamp(),
            });
            setSuccess(true);
            setFormData({ name: '', phone: '', email: '', date: '', timeSlot: TIME_SLOTS[0], notes: '' });
            if (onSuccess) setTimeout(onSuccess, 1800);
        } catch (err) {
            console.error('Test drive booking error:', err);
            setError('Could not book test drive. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="rounded-2xl bg-ivory-soft/60 border border-ink/10 p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-ink text-champagne flex items-center justify-center">
                    <Check size={18} />
                </div>
                <h4 className="font-display font-normal text-ink text-[28px] sm:text-[32px] leading-tight mt-5">
                    Booking <em className="italic text-champagne">received.</em>
                </h4>
                <p className="text-[13.5px] text-ink-muted mt-2 max-w-md mx-auto">
                    We'll call to confirm your test drive within business hours.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-3">
            <Honeypot value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />

            <div className="sm:col-span-2 rounded-2xl bg-ivory-soft/60 border border-ink/10 p-4 text-[13px] text-ink-muted flex items-start gap-3">
                <Calendar size={16} className="shrink-0 mt-0.5 text-champagne-deep" />
                <span>Pick a preferred date and time. We'll call you to confirm the booking.</span>
            </div>

            <Field label="Name">
                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                    className={inputClassName}
                />
            </Field>
            <Field label="Phone">
                <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+91 ..."
                    className={inputClassName}
                />
            </Field>

            <div className="sm:col-span-2">
                <Field label="Email (optional)">
                    <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className={inputClassName}
                    />
                </Field>
            </div>

            <Field label="Preferred date">
                <input
                    name="date"
                    type="date"
                    value={formData.date}
                    min={todayISO()}
                    max={maxDateISO()}
                    onChange={handleChange}
                    required
                    className={inputClassName}
                />
            </Field>
            <Field label="Time slot">
                <select
                    name="timeSlot"
                    value={formData.timeSlot}
                    onChange={handleChange}
                    className={inputClassName}
                >
                    {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                </select>
            </Field>

            <div className="sm:col-span-2">
                <label className="block rounded-2xl border border-ink/15 px-4 py-2.5 focus-within:border-ink transition-colors bg-white/60">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">Notes (optional)</div>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Anything specific you'd like to check?"
                        className="w-full bg-transparent text-[14.5px] py-1 placeholder:text-ink-faint resize-none outline-none border-0 focus:ring-0 focus:border-0 p-0 mt-1 text-ink"
                    />
                </label>
            </div>

            {error && (
                <div className="sm:col-span-2 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-2xl border border-red-100">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <div className="sm:col-span-2 mt-2 flex items-center justify-between flex-wrap gap-3">
                <div className="text-[12px] text-ink-muted">
                    We'll confirm by phone before your visit.
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="group inline-flex items-center gap-3 rounded-full pl-5 pr-2 py-2 text-[13.5px] font-medium transition-colors bg-ink text-ivory hover:bg-champagne-deep disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <span>{loading ? 'Booking…' : 'Request test drive'}</span>
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-ink/10 group-hover:bg-ink/20 transition-colors">
                        <ArrowRight size={14} />
                    </span>
                </button>
            </div>
        </form>
    );
};

export default TestDriveForm;
