import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { ArrowRight, Check, AlertCircle, Car, Tag, Wrench, HelpCircle, ShieldCheck } from 'lucide-react';
import Honeypot from './Honeypot';

const TYPE_OPTIONS = [
    { value: 'general', label: 'General' },
    { value: 'buy', label: 'Buying' },
    { value: 'sell', label: 'Selling' },
    { value: 'test-drive', label: 'Test Drive' },
    { value: 'service', label: 'Service' },
    { value: 'report', label: 'Report' },
];

const TYPE_CHIPS = [
    { value: 'buy', label: 'Buy a car', icon: Car },
    { value: 'sell', label: 'Sell my car', icon: Tag },
    { value: 'service', label: 'Service / RTO', icon: Wrench },
    { value: 'general', label: 'General', icon: HelpCircle },
];

const CONTACT_METHODS = ['Phone', 'WhatsApp', 'Email'];
const CONTACT_TIMES = ['Anytime', 'Morning', 'Afternoon', 'Evening'];

const Field = ({ label, value, onChange, placeholder, type = 'text', required = false, name }) => (
    <label className="block rounded-2xl border border-ink/15 px-4 py-2.5 focus-within:border-ink transition-colors bg-white/60">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">{label}</div>
        <input
            type={type}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className="w-full bg-transparent text-[15px] py-1 placeholder:text-ink-faint outline-none border-0 focus:ring-0 focus:border-0 p-0 mt-1 text-ink"
        />
    </label>
);

const Select = ({ label, value, onChange, options }) => (
    <label className="block rounded-2xl border border-ink/15 px-4 py-2.5 focus-within:border-ink transition-colors bg-white/60">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">{label}</div>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent text-[15px] py-1 outline-none border-0 focus:ring-0 focus:border-0 p-0 mt-1 text-ink"
        >
            {options.map(o => (
                typeof o === 'string'
                    ? <option key={o} value={o}>{o}</option>
                    : <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    </label>
);

const InquiryForm = ({ carId, carName, defaultType, compact = false, typeStyle = 'select', maxMessageLength }) => {
    const initialState = {
        name: '',
        phone: '',
        email: '',
        message: '',
        type: defaultType || (carId ? 'buy' : 'general'),
        preferredContact: 'Phone',
        preferredTime: 'Anytime',
    };

    const [formData, setFormData] = useState(initialState);
    const [honeypot, setHoneypot] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const upd = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        if (honeypot) {
            setTimeout(() => { setSuccess(true); setLoading(false); }, 600);
            return;
        }

        try {
            const inquiryData = {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim() || null,
                message: formData.message.trim(),
                type: formData.type,
                preferredContact: formData.preferredContact,
                preferredTime: formData.preferredTime,
                status: 'new',
                createdAt: serverTimestamp(),
                submittedAt: serverTimestamp(),
            };

            if (carId) inquiryData.carId = carId;
            if (carName) inquiryData.carName = carName;

            await addDoc(collection(db, 'inquiries'), inquiryData);
            setSuccess(true);
            setFormData(initialState);
        } catch (e) {
            setError('Error submitting inquiry. Please try again.');
            console.error('Error adding inquiry document:', e);
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
                    Inquiry <em className="italic text-champagne">received.</em>
                </h4>
                <p className="text-[13.5px] text-ink-muted mt-2 max-w-md mx-auto">
                    A team member will call you within thirty minutes during business hours.
                    Thanks{formData.name ? `, ${formData.name}` : ''}.
                </p>
            </div>
        );
    }

    const placeholderMessage = carName
        ? `I'm interested in the ${carName}. Can we schedule a test drive this weekend?`
        : 'Tell us what you\'re looking for…';

    return (
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-3">
            <Honeypot value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />

            {!carId && typeStyle === 'select' && (
                <div className="sm:col-span-2">
                    <Select
                        label="Enquiry type"
                        value={formData.type}
                        onChange={(v) => upd('type', v)}
                        options={TYPE_OPTIONS}
                    />
                </div>
            )}

            {!carId && typeStyle === 'chips' && (
                <div className="sm:col-span-2">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint mb-2">Inquiry type</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {TYPE_CHIPS.map((t) => {
                            const on = formData.type === t.value;
                            const Icon = t.icon;
                            return (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => upd('type', t.value)}
                                    className={`flex items-center gap-2 rounded-2xl border px-3.5 py-3 text-left transition-colors text-[13px] ${on ? 'bg-ink text-ivory border-ink' : 'border-ink/15 hover:border-ink/40 bg-ivory/40 text-ink'}`}
                                >
                                    <Icon size={14} />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <Field label="Name" value={formData.name} onChange={(v) => upd('name', v)} placeholder="Your name" required name="name" />
            <Field label="Phone" value={formData.phone} onChange={(v) => upd('phone', v)} placeholder="+91 ..." type="tel" required name="phone" />

            <div className="sm:col-span-2">
                <Field label="Email (optional)" value={formData.email} onChange={(v) => upd('email', v)} placeholder="you@example.com" type="email" name="email" />
            </div>

            {!compact && (
                <>
                    <Select label="Preferred contact" value={formData.preferredContact} onChange={(v) => upd('preferredContact', v)} options={CONTACT_METHODS} />
                    <Select label="Best time to reach" value={formData.preferredTime} onChange={(v) => upd('preferredTime', v)} options={CONTACT_TIMES} />
                </>
            )}

            <div className="sm:col-span-2">
                <label className="block rounded-2xl border border-ink/15 px-4 py-2.5 focus-within:border-ink transition-colors bg-white/60">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">Message</div>
                    <textarea
                        value={formData.message}
                        onChange={(e) => upd('message', e.target.value)}
                        placeholder={placeholderMessage}
                        rows={4}
                        required
                        maxLength={maxMessageLength || undefined}
                        className="w-full bg-transparent text-[14.5px] py-1 placeholder:text-ink-faint resize-none outline-none border-0 focus:ring-0 focus:border-0 p-0 mt-1 text-ink"
                    />
                </label>
                {maxMessageLength && (
                    <div className="mt-1.5 text-right text-[11px] text-ink-faint num">
                        {formData.message.length} / {maxMessageLength}
                    </div>
                )}
            </div>

            {error && (
                <div className="sm:col-span-2 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-2xl border border-red-100">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <div className="sm:col-span-2 mt-2 pt-3 border-t border-ink/10 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-[12px] text-ink-muted">
                    <ShieldCheck size={13} className="text-champagne-deep" />
                    We don't share your details with third parties.
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="group inline-flex items-center gap-3 rounded-full pl-5 pr-2 py-2 text-[13.5px] font-medium transition-colors bg-ink text-ivory hover:bg-champagne-deep disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <span>{loading ? 'Sending…' : 'Send inquiry'}</span>
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-ink/10 group-hover:bg-ink/20 transition-colors">
                        <ArrowRight size={14} />
                    </span>
                </button>
            </div>
        </form>
    );
};

export default InquiryForm;
