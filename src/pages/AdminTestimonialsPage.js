import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    collection, getDocs, query, doc, deleteDoc, updateDoc, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import {
    Trash2, CheckCircle, XCircle, Star, Edit2, Save, Car, Clock,
    ArrowRight,
} from 'lucide-react';

const TST_STATUS = {
    pending: { l: 'Pending', text: '#8a5a17', bg: 'rgba(180,120,30,0.16)', dot: '#b4781e' },
    approved: { l: 'Approved', text: '#1f6b46', bg: 'rgba(31,107,70,0.12)', dot: '#1f6b46' },
};

const StatusChip = ({ status }) => {
    const s = TST_STATUS[status] || TST_STATUS.pending;
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.16em] border whitespace-nowrap"
            style={{ background: s.bg, color: s.text, borderColor: `${s.dot}33` }}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
            {s.l}
        </span>
    );
};

const Stars = ({ rating, onChange, size = 15 }) => (
    <div className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => {
            const filled = n <= rating;
            return (
                <button
                    key={n}
                    type="button"
                    onClick={onChange ? () => onChange(n) : undefined}
                    className={`${onChange ? 'cursor-pointer' : 'cursor-default'} ${filled ? 'text-champagne' : 'text-ink-faint'}`}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                    <Star size={size} fill={filled ? 'currentColor' : 'none'} />
                </button>
            );
        })}
    </div>
);

const relativeTime = (ts) => {
    if (!ts) return '—';
    const diff = Date.now() - ts * 1000;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    return new Date(ts * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

const TestimonialCard = ({ item, onSaveEdit, onToggleStatus, onToggleFeatured, onDelete, onSaveRating }) => {
    const [editing, setEditing] = useState(false);
    const text = item.text || item.testimonial || '';
    const [draftBody, setDraftBody] = useState(text);
    const [draftRating, setDraftRating] = useState(item.rating || 0);
    const status = item.approved ? 'approved' : 'pending';
    const initials = (item.name || '?')
        .split(' ')
        .map((s) => s[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
    const ts = item.createdAt?.seconds;
    const idShort = item.id ? `rev-${item.id.slice(0, 8)}` : '';

    const startEdit = () => {
        setDraftBody(text);
        setDraftRating(item.rating || 0);
        setEditing(true);
    };

    const cancel = () => {
        setEditing(false);
        setDraftBody(text);
        setDraftRating(item.rating || 0);
    };

    const save = async () => {
        const trimmed = draftBody.trim();
        if (!trimmed) return;
        await onSaveEdit({ text: trimmed, rating: draftRating });
        setEditing(false);
    };

    return (
        <article className="rounded-3xl border border-ink/10 bg-white p-5 md:p-7 shadow-[0_18px_50px_-30px_rgba(14,14,12,0.20)]">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-ink text-ivory font-display text-[17px] flex items-center justify-center shrink-0">
                        {initials || '?'}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="font-medium text-[15px] text-ink">{item.name || 'Unknown'}</span>
                            {editing ? (
                                <Stars rating={draftRating} onChange={setDraftRating} />
                            ) : (
                                <Stars rating={item.rating || 0} />
                            )}
                            <StatusChip status={status} />
                            {item.featured && (
                                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.16em] border whitespace-nowrap bg-champagne text-ink border-champagne-deep/40">
                                    <Star size={10} fill="currentColor" /> Featured
                                </span>
                            )}
                        </div>
                        <div className="mt-1.5 text-[12px] text-ink-muted flex items-center flex-wrap gap-x-3 gap-y-1">
                            {item.carBought && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Car size={11} /> {item.carBought}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1.5">
                                <Clock size={11} /> {relativeTime(ts)}
                            </span>
                            {idShort && (
                                <span className="font-mono uppercase tracking-[0.16em] text-[10px]">
                                    {idShort}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-5 grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-9">
                    {editing ? (
                        <div>
                            <textarea
                                value={draftBody}
                                onChange={(e) => setDraftBody(e.target.value)}
                                rows={6}
                                className="w-full rounded-2xl border border-ink/15 bg-ivory-soft/40 px-4 py-3 text-[14.5px] leading-relaxed text-ink focus:border-ink transition-colors resize-none outline-none"
                            />
                            <div className="mt-3 flex items-center justify-between flex-wrap gap-3">
                                <div className="text-[12px] text-ink-muted">
                                    Editing as admin · changes are visible on the live site immediately after saving.
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={cancel}
                                        className="rounded-full border border-ink/15 px-4 py-2 text-[12.5px] text-ink hover:bg-ink/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={save}
                                        className="inline-flex items-center gap-2 rounded-full bg-ink text-ivory px-4 py-2 text-[12.5px] hover:bg-champagne-deep transition-colors whitespace-nowrap"
                                    >
                                        <Save size={12} /> Save changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <blockquote className="relative pl-6">
                            <span className="absolute left-0 top-0 font-display italic text-[44px] leading-none text-champagne select-none">
                                "
                            </span>
                            <p className="font-display italic text-[20px] md:text-[24px] leading-[1.4] text-ink">
                                {text || <span className="text-ink-faint">(empty)</span>}
                            </p>
                        </blockquote>
                    )}
                </div>

                <div className="lg:col-span-3 flex lg:flex-col gap-2 flex-wrap content-start">
                    <button
                        type="button"
                        onClick={startEdit}
                        disabled={editing}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 text-ink px-4 py-2.5 text-[13px] hover:bg-ink hover:text-ivory transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Edit2 size={13} /> Edit
                    </button>
                    <button
                        type="button"
                        onClick={onToggleFeatured}
                        className={`flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] transition-colors whitespace-nowrap ${item.featured ? 'bg-champagne text-ink hover:bg-champagne-light' : 'border border-ink/15 text-ink hover:bg-ink hover:text-ivory'}`}
                    >
                        <Star size={13} fill={item.featured ? 'currentColor' : 'none'} />
                        {item.featured ? 'Featured' : 'Feature'}
                    </button>
                    {!item.approved ? (
                        <button
                            type="button"
                            onClick={onToggleStatus}
                            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] border transition-colors whitespace-nowrap"
                            style={{ background: 'rgba(31,107,70,0.12)', color: '#1f6b46', borderColor: 'rgba(31,107,70,0.30)' }}
                        >
                            <CheckCircle size={13} /> Approve
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onToggleStatus}
                            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] border border-ink/15 text-ink hover:bg-ink hover:text-ivory transition-colors whitespace-nowrap"
                        >
                            <XCircle size={13} /> Unapprove
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onDelete}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-full border border-[#8b1f1f]/30 text-[#8b1f1f] px-4 py-2.5 text-[13px] hover:bg-[#8b1f1f] hover:text-white hover:border-[#8b1f1f] transition-colors whitespace-nowrap"
                    >
                        <Trash2 size={13} /> Delete
                    </button>
                </div>
            </div>
        </article>
    );
};

const AdminTestimonialsPage = () => {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('pending');

    const fetchTestimonials = useCallback(async () => {
        setError(null);
        try {
            const q = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setTestimonials(data);
        } catch (err) {
            setError('Error fetching testimonials.');
            console.error('Error fetching testimonials:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTestimonials(); }, [fetchTestimonials]);

    const handleToggleApproval = async (item) => {
        const next = !item.approved;
        setTestimonials((prev) =>
            prev.map((t) => (t.id === item.id ? { ...t, approved: next } : t))
        );
        try {
            await updateDoc(doc(db, 'testimonials', item.id), { approved: next });
        } catch (err) {
            setError('Error updating testimonial status.');
            setTestimonials((prev) =>
                prev.map((t) => (t.id === item.id ? { ...t, approved: !next } : t))
            );
        }
    };

    const handleToggleFeatured = async (item) => {
        const next = !item.featured;
        setTestimonials((prev) =>
            prev.map((t) => (t.id === item.id ? { ...t, featured: next } : t))
        );
        try {
            await updateDoc(doc(db, 'testimonials', item.id), { featured: next });
        } catch (err) {
            console.error('Error toggling featured:', err);
            setError('Could not update featured flag.');
            setTestimonials((prev) =>
                prev.map((t) => (t.id === item.id ? { ...t, featured: !next } : t))
            );
        }
    };

    const handleSaveEdit = async (id, { text, rating }) => {
        try {
            const payload = { text, rating: Number(rating) || 0 };
            await updateDoc(doc(db, 'testimonials', id), payload);
            setTestimonials((prev) =>
                prev.map((t) => (t.id === id ? { ...t, ...payload } : t))
            );
        } catch (err) {
            console.error('Error saving testimonial edit:', err);
            setError('Could not save edit.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Permanently delete this testimonial?')) return;
        try {
            await deleteDoc(doc(db, 'testimonials', id));
            setTestimonials((prev) => prev.filter((t) => t.id !== id));
        } catch (err) {
            setError('Error deleting testimonial.');
        }
    };

    const counts = useMemo(
        () => ({
            pending: testimonials.filter((t) => !t.approved).length,
            approved: testimonials.filter((t) => t.approved).length,
            all: testimonials.length,
            featured: testimonials.filter((t) => t.featured).length,
        }),
        [testimonials]
    );

    const avgRating = useMemo(() => {
        const approved = testimonials.filter((t) => t.approved && t.rating);
        if (!approved.length) return null;
        return (approved.reduce((s, t) => s + Number(t.rating || 0), 0) / approved.length).toFixed(2);
    }, [testimonials]);

    const filtered = useMemo(() => {
        if (statusFilter === 'pending') return testimonials.filter((t) => !t.approved);
        if (statusFilter === 'approved') return testimonials.filter((t) => t.approved);
        return testimonials;
    }, [testimonials, statusFilter]);

    const tabs = [
        { id: 'pending', l: 'Pending', n: counts.pending, tone: '#b4781e' },
        { id: 'approved', l: 'Approved', n: counts.approved, tone: '#1f6b46' },
        { id: 'all', l: 'All', n: counts.all, tone: '#0E0E0C' },
    ];

    return (
        <div className="px-4 lg:px-8 py-6 lg:py-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-faint">
                        — Customer voice · <span className="num">{counts.pending}</span> awaiting moderation
                    </div>
                    <h1 className="font-display text-[44px] md:text-[64px] leading-[0.95] tracking-tightest mt-2 text-ink">
                        Testimonial <em className="italic text-champagne">management.</em>
                    </h1>
                    <p className="mt-2 text-[14px] text-ink-muted max-w-xl">
                        Review, edit, and approve customer feedback. Approved testimonials appear on the live site
                        immediately; featured ones surface in the homepage carousel.
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="rounded-2xl border border-ink/10 bg-white/60 px-4 py-2.5">
                        <div className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-ink-faint">
                            Avg. rating
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-display text-[22px] leading-none num text-ink">
                                {avgRating || '—'}
                            </span>
                            <span className="text-[12px] text-ink-muted">/ 5.0</span>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-ink/10 bg-white/60 px-4 py-2.5">
                        <div className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-ink-faint">
                            Featured
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-display text-[22px] leading-none num text-ink">
                                {counts.featured}
                            </span>
                            <span className="text-[12px] text-ink-muted">/ {counts.approved}</span>
                        </div>
                    </div>
                </div>
            </div>

            {counts.pending > 0 && (
                <div
                    className="mt-7 rounded-2xl border p-4 md:p-5 flex items-start gap-4 flex-wrap"
                    style={{ background: 'rgba(180,120,30,0.10)', borderColor: 'rgba(180,120,30,0.25)' }}
                >
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(255,255,255,0.6)', color: '#8a5a17', border: '1px solid rgba(180,120,30,0.30)' }}
                    >
                        <Star size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="font-display text-[22px] leading-tight text-ink">
                            {counts.pending} new testimonial{counts.pending > 1 ? 's' : ''} to review.
                        </div>
                        <div className="text-[12.5px] text-ink-muted mt-1">
                            Approve to publish on the live site immediately, or edit for clarity before approving.
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('pending')}
                        className="inline-flex items-center gap-2 rounded-full bg-ink text-ivory px-4 py-2 text-[12.5px] hover:bg-champagne-deep transition-colors whitespace-nowrap"
                    >
                        Open queue <ArrowRight size={13} />
                    </button>
                </div>
            )}

            <div className="mt-7 flex items-center gap-2 flex-wrap">
                {tabs.map((t) => {
                    const on = statusFilter === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setStatusFilter(t.id)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] whitespace-nowrap transition-colors ${on ? 'bg-ink text-ivory border-ink' : 'border-ink/15 text-ink hover:border-ink/40 bg-white/40'}`}
                        >
                            {t.l}
                            <span
                                className="num text-[10.5px] px-1.5 py-0.5 rounded-full"
                                style={{
                                    background: on ? 'rgba(255,255,255,0.18)' : `${t.tone}15`,
                                    color: on ? '#fff' : t.tone,
                                }}
                            >
                                {t.n}
                            </span>
                        </button>
                    );
                })}
            </div>

            {error && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-[13px]">
                    {error}
                </div>
            )}

            <div className="mt-6 space-y-4">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-ink border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-2xl border border-ink/10 bg-white/60 py-20 px-8 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full border border-ink/15 flex items-center justify-center text-ink-muted">
                            <Star size={14} />
                        </div>
                        <div className="font-display text-[28px] leading-tight mt-4 text-ink">
                            Nothing in this <em className="italic text-champagne">tray.</em>
                        </div>
                        <div className="text-[13px] text-ink-muted mt-1">
                            {testimonials.length === 0
                                ? 'No testimonials submitted yet.'
                                : 'Try a different status filter.'}
                        </div>
                    </div>
                ) : (
                    filtered.map((item) => (
                        <TestimonialCard
                            key={item.id}
                            item={item}
                            onSaveEdit={(payload) => handleSaveEdit(item.id, payload)}
                            onToggleStatus={() => handleToggleApproval(item)}
                            onToggleFeatured={() => handleToggleFeatured(item)}
                            onDelete={() => handleDelete(item.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminTestimonialsPage;
