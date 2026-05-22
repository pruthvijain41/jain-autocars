import React, { useState } from 'react';
import { db } from '../../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Star, Send, Check, AlertCircle } from 'lucide-react';
import Honeypot from './Honeypot';

const Field = ({ label, value, onChange, placeholder, type = 'text', name, required }) => (
    <label className="block rounded-2xl border border-ink/15 px-4 py-2.5 focus-within:border-ink transition-colors bg-white/80">
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

const TestimonialForm = () => {
    const [name, setName] = useState('');
    const [carBought, setCarBought] = useState('');
    const [testimonialText, setTestimonialText] = useState('');
    const [rating, setRating] = useState(5);
    const [hover, setHover] = useState(0);
    const [honeypot, setHoneypot] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !testimonialText) {
            setError('Name and review text are required.');
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(false);

        if (honeypot) {
            setTimeout(() => {
                setSuccess(true);
                setLoading(false);
            }, 600);
            return;
        }

        const newTestimonial = {
            name,
            carBought: carBought || null,
            text: testimonialText,
            rating,
            createdAt: serverTimestamp(),
            approved: false,
            avatarUrl: '',
            likes: 0,
            dislikes: 0,
        };

        try {
            await addDoc(collection(db, 'testimonials'), newTestimonial);
            setSuccess(true);
        } catch (err) {
            setError('There was an error submitting your review. Please try again.');
            console.error('Error submitting testimonial:', err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center py-8">
                <div className="mx-auto w-14 h-14 rounded-full bg-ink text-champagne flex items-center justify-center">
                    <Check size={18} />
                </div>
                <h4 className="font-display text-[32px] sm:text-[40px] leading-tight mt-5 text-ink">
                    Thank you, <em className="italic text-champagne">{name || 'friend'}.</em>
                </h4>
                <p className="text-[14px] text-ink-muted mt-3 max-w-md mx-auto">
                    Your review will appear on our stories page within forty-eight hours.
                    We're grateful you trusted us with your purchase.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <Honeypot value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />

            <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                    — Your review
                </div>
                <h3 className="font-display text-[28px] sm:text-[34px] leading-tight tracking-tightest mt-3 text-ink">
                    Rate your <em className="italic text-champagne">experience.</em>
                </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                {[1, 2, 3, 4, 5].map((n) => {
                    const filled = (hover || rating) >= n;
                    return (
                        <button
                            key={n}
                            type="button"
                            onClick={() => setRating(n)}
                            onMouseEnter={() => setHover(n)}
                            onMouseLeave={() => setHover(0)}
                            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${filled ? 'bg-champagne text-ink' : 'bg-ivory-soft text-ink-faint'}`}
                            aria-label={`${n} star${n > 1 ? 's' : ''}`}
                        >
                            <Star size={18} fill={filled ? 'currentColor' : 'none'} />
                        </button>
                    );
                })}
                <span className="ml-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-faint num">
                    — {rating}.0 / 5.0
                </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
                <Field
                    label="Your name"
                    value={name}
                    onChange={setName}
                    placeholder="Your name"
                    name="name"
                    required
                />
                <Field
                    label="Car bought"
                    value={carBought}
                    onChange={setCarBought}
                    placeholder="e.g. 2022 Honda City"
                    name="carBought"
                />
            </div>

            <label className="block rounded-2xl border border-ink/15 px-4 py-2.5 focus-within:border-ink transition-colors bg-white/80">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">Tell us about it</div>
                <textarea
                    name="testimonial"
                    placeholder="The good, the bad, the small details that mattered..."
                    required
                    rows={4}
                    value={testimonialText}
                    onChange={(e) => setTestimonialText(e.target.value)}
                    className="w-full bg-transparent text-[14.5px] py-1 placeholder:text-ink-faint resize-none outline-none border-0 focus:ring-0 focus:border-0 p-0 mt-1 text-ink"
                />
            </label>

            {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-2xl border border-red-100">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-ink/10">
                <div className="text-[12px] text-ink-muted">
                    Published to our Stories page within 48 hours, after verification.
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="group inline-flex items-center gap-3 rounded-full pl-5 pr-2 py-2 text-[13.5px] font-medium transition-colors bg-ink text-ivory hover:bg-champagne-deep disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <span>{loading ? 'Submitting…' : 'Submit review'}</span>
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-ink/10 group-hover:bg-ink/20 transition-colors">
                        <Send size={13} />
                    </span>
                </button>
            </div>
        </form>
    );
};

export default TestimonialForm;
