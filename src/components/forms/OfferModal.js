import React, { useEffect, useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { ArrowRight, ArrowLeft, Check, X, AlertCircle } from 'lucide-react';
import Honeypot from './Honeypot';

const Eyebrow = ({ children }) => (
    <span className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.18em] text-[10.5px] text-ink-muted">
        <span className="inline-block w-4 h-px bg-ink/30" />
        {children}
    </span>
);

const PrimaryBtn = ({ children, icon: Icon = ArrowRight, onClick, type = 'button', disabled = false }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className="group inline-flex items-center gap-3 rounded-full pl-5 pr-2 py-2 text-[13.5px] font-medium transition-colors bg-ink text-ivory hover:bg-champagne-deep disabled:opacity-50 disabled:cursor-not-allowed"
    >
        <span>{children}</span>
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-ink/10 group-hover:bg-ink/20 transition-colors">
            <Icon size={14} />
        </span>
    </button>
);

const Field = ({ label, value, onChange, placeholder, type = 'text', autoFocus = false }) => (
    <label className="block rounded-2xl border border-ink/15 px-4 py-2.5 focus-within:border-ink transition-colors bg-white/60">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">{label}</div>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full bg-transparent text-[15px] py-1 placeholder:text-ink-faint outline-none border-0 focus:ring-0 text-ink"
        />
    </label>
);

const INITIAL_FORM = { make: '', model: '', year: '', km: '', name: '', phone: '' };

const OfferModal = ({ open, onClose }) => {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState(INITIAL_FORM);
    const [honeypot, setHoneypot] = useState('');
    const [mounted, setMounted] = useState(false);
    const [shown, setShown] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (open) {
            setMounted(true);
            setStep(0);
            setForm(INITIAL_FORM);
            setSubmitted(false);
            setError(null);
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
        } else {
            setShown(false);
            document.body.style.overflow = '';
            const t = setTimeout(() => setMounted(false), 350);
            return () => clearTimeout(t);
        }
    }, [open]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const canNext = step === 0
        ? form.make.trim() && form.model.trim()
        : step === 1
            ? form.year.trim() && form.km.trim()
            : form.name.trim() && form.phone.trim();

    const indicativeOffer = form.year && form.km ? '11.6 – ₹12.4' : '—';

    const handleSubmit = async () => {
        if (!canNext || submitting) return;

        if (honeypot) {
            setTimeout(() => { setSubmitted(true); }, 600);
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const messageBody = `Selling ${form.year} ${form.make} ${form.model}\nKm: ${form.km}`;
            await addDoc(collection(db, 'inquiries'), {
                name: form.name.trim(),
                phone: form.phone.trim(),
                email: null,
                message: messageBody,
                type: 'sell',
                sellCar: {
                    make: form.make.trim(),
                    model: form.model.trim(),
                    year: form.year ? Number(form.year) : null,
                    kilometers: form.km ? Number(form.km.replace(/,/g, '')) : null,
                    expectedPrice: null,
                },
                status: 'new',
                createdAt: serverTimestamp(),
                submittedAt: serverTimestamp(),
            });
            setSubmitted(true);
        } catch (err) {
            console.error('Offer submission error:', err);
            setError('Could not submit. Please try again or call us.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!mounted) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4"
            style={{ opacity: shown ? 1 : 0, transition: 'opacity 300ms ease' }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    opacity: shown ? 1 : 0,
                    transform: shown ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.98)',
                    transition: 'opacity 380ms cubic-bezier(.2,.7,.2,1), transform 380ms cubic-bezier(.2,.7,.2,1)',
                }}
                className="bg-ivory text-ink rounded-3xl w-full max-w-2xl overflow-hidden border border-ink/10 shadow-2xl"
            >
                <Honeypot value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />

                {/* Header */}
                <div className="flex items-center justify-between px-7 pt-6">
                    <div className="flex items-center gap-2">
                        <Eyebrow>Get an offer</Eyebrow>
                        {!submitted && (
                            <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-faint">— step {step + 1} / 3</span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="w-9 h-9 rounded-full border border-ink/15 flex items-center justify-center hover:bg-ink hover:text-ivory transition-colors"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Progress bar */}
                {!submitted && (
                    <div className="px-7 mt-4">
                        <div className="h-px bg-ink/10 relative overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-champagne"
                                style={{ width: `${((step + 1) / 3) * 100}%`, transition: 'width 500ms cubic-bezier(.2,.7,.2,1)' }}
                            />
                        </div>
                    </div>
                )}

                {/* Step content */}
                {!submitted ? (
                    <div
                        className="px-7 pt-6 pb-2"
                        key={step}
                        style={{ animation: 'fadeUp 380ms cubic-bezier(.2,.7,.2,1) both' }}
                    >
                        {step === 0 && (
                            <div>
                                <h3 className="font-display font-normal text-ink text-[36px] sm:text-[40px] leading-[1] tracking-tightest">
                                    What are you <em className="italic text-champagne">driving?</em>
                                </h3>
                                <p className="mt-2 text-[13.5px] text-ink-muted">Start with make and model — exact spec is fine.</p>
                                <div className="mt-6 grid sm:grid-cols-2 gap-3">
                                    <Field label="Make" value={form.make} onChange={(v) => update('make', v)} placeholder="Hyundai" autoFocus />
                                    <Field label="Model" value={form.model} onChange={(v) => update('model', v)} placeholder="Creta SX" />
                                </div>
                            </div>
                        )}
                        {step === 1 && (
                            <div>
                                <h3 className="font-display font-normal text-ink text-[36px] sm:text-[40px] leading-[1] tracking-tightest">
                                    A few <em className="italic text-champagne">numbers.</em>
                                </h3>
                                <p className="mt-2 text-[13.5px] text-ink-muted">Year of registration and kilometers on the odometer.</p>
                                <div className="mt-6 grid sm:grid-cols-2 gap-3">
                                    <Field label="Year" value={form.year} onChange={(v) => update('year', v)} placeholder="2021" autoFocus />
                                    <Field label="KMs driven" value={form.km} onChange={(v) => update('km', v)} placeholder="38,200" />
                                </div>
                            </div>
                        )}
                        {step === 2 && (
                            <div>
                                <h3 className="font-display font-normal text-ink text-[36px] sm:text-[40px] leading-[1] tracking-tightest">
                                    Where do we <em className="italic text-champagne">reach you?</em>
                                </h3>
                                <p className="mt-2 text-[13.5px] text-ink-muted">A team member will call within 30 minutes. No spam, ever.</p>
                                <div className="mt-6 grid sm:grid-cols-2 gap-3">
                                    <Field label="Name" value={form.name} onChange={(v) => update('name', v)} placeholder="Your name" autoFocus />
                                    <Field label="Phone" value={form.phone} onChange={(v) => update('phone', v)} placeholder="+91 ..." type="tel" />
                                </div>
                                <div className="mt-5 rounded-2xl bg-ink text-ivory p-5 flex items-center justify-between gap-4">
                                    <div>
                                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ivory/55">Indicative offer</div>
                                        <div className="font-display font-normal text-ivory text-[28px] sm:text-[34px] leading-none mt-1 num">
                                            ₹{indicativeOffer} <span className="text-[14px] text-ivory/60">L</span>
                                        </div>
                                    </div>
                                    <div className="text-[11.5px] text-ivory/55 max-w-[160px] text-right">
                                        Final after a 20-minute physical inspection at our showroom.
                                    </div>
                                </div>
                                {error && (
                                    <div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                                        <AlertCircle size={16} /> {error}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="px-7 pt-6 pb-2" style={{ animation: 'fadeUp 380ms cubic-bezier(.2,.7,.2,1) both' }}>
                        <div className="w-12 h-12 rounded-full bg-champagne/15 text-champagne-deep flex items-center justify-center">
                            <Check size={22} />
                        </div>
                        <h3 className="font-display font-normal text-ink text-[36px] sm:text-[40px] leading-[1] tracking-tightest mt-5">
                            Offer <em className="italic text-champagne">on the way.</em>
                        </h3>
                        <p className="mt-3 text-[14px] text-ink-muted max-w-md">
                            Thanks {form.name || 'there'} — a team member will call you within 30 minutes
                            on {form.phone || 'the number provided'} with a written offer for the {form.year} {form.make} {form.model}.
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between px-7 py-5 mt-2 border-t border-ink/10 bg-ivory-soft">
                    {submitted ? (
                        <>
                            <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-faint">
                                We'll be in touch.
                            </span>
                            <PrimaryBtn icon={Check} onClick={onClose}>Done</PrimaryBtn>
                        </>
                    ) : (
                        <>
                            <button
                                disabled={step === 0}
                                onClick={() => setStep(s => Math.max(0, s - 1))}
                                className={`text-[13.5px] inline-flex items-center gap-2 ${step === 0 ? 'text-ink-faint cursor-not-allowed' : 'text-ink hover:text-champagne-deep'}`}
                            >
                                <ArrowLeft size={14} /> Back
                            </button>
                            {step < 2 ? (
                                <PrimaryBtn
                                    icon={ArrowRight}
                                    onClick={() => canNext && setStep(s => Math.min(2, s + 1))}
                                    disabled={!canNext}
                                >
                                    Continue
                                </PrimaryBtn>
                            ) : (
                                <PrimaryBtn
                                    icon={Check}
                                    onClick={handleSubmit}
                                    disabled={!canNext || submitting}
                                >
                                    {submitting ? 'Sending…' : 'Get my offer'}
                                </PrimaryBtn>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OfferModal;
