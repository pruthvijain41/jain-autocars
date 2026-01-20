import React, { useState } from 'react';
import { db } from '../../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Star, Send, CheckCircle, AlertCircle } from 'lucide-react';

const TestimonialForm = () => {
    const [name, setName] = useState('');
    const [testimonialText, setTestimonialText] = useState('');
    const [rating, setRating] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !testimonialText) {
            setError("Name and testimonial text are required.");
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(false);

        const newTestimonial = {
            name,
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
            setName('');
            setTestimonialText('');
            setRating(0);
        } catch (err) {
            setError('There was an error submitting your testimonial. Please try again.');
            console.error('Error submitting testimonial:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
                <input
                    name="name"
                    placeholder="Enter your name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all bg-slate-50 focus:bg-white"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                        >
                            <Star
                                size={28}
                                fill={star <= rating ? "#f59e0b" : "none"}
                                className={star <= rating ? "text-accent" : "text-slate-300"}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Testimonial</label>
                <textarea
                    name="testimonial"
                    placeholder="Share your experience"
                    required
                    rows={4}
                    value={testimonialText}
                    onChange={(e) => setTestimonialText(e.target.value)}
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
                    <CheckCircle size={16} /> Thank you! Your testimonial has been submitted for review.
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? 'Submitting...' : <><Send size={18} /> Submit Testimonial</>}
            </button>
        </form>
    );
};

export default TestimonialForm;