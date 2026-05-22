import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    collection, getDocs, query, doc, deleteDoc, updateDoc, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import {
    Trash2, Phone, Mail, Search, Download, ExternalLink, MessageCircle,
    Save, Check, ChevronDown, Clock, Hash, Car, X,
} from 'lucide-react';

const TYPE_LABELS = {
    general: 'General',
    buy: 'Buying',
    sell: 'Selling',
    'test-drive': 'Test Drive',
    service: 'Service',
    report: 'Report',
};

const TYPE_TABS = ['All Types', 'General', 'Buying', 'Selling', 'Test Drive', 'Service', 'Report'];

const STATUS_OPTS = [
    { id: 'new', l: 'New', text: '#8a5a17', bg: 'rgba(180,120,30,0.15)', dot: '#b4781e' },
    { id: 'contacted', l: 'Contacted', text: '#2a4b7c', bg: 'rgba(42,75,124,0.12)', dot: '#2a4b7c' },
    { id: 'resolved', l: 'Resolved', text: '#1f6b46', bg: 'rgba(31,107,70,0.12)', dot: '#1f6b46' },
];

const STATUS_TABS = [
    { id: 'all', l: 'All', tone: '#0E0E0C' },
    { id: 'new', l: 'New', tone: '#b4781e' },
    { id: 'contacted', l: 'Contacted', tone: '#2a4b7c' },
    { id: 'resolved', l: 'Resolved', tone: '#1f6b46' },
];

const escapeCsv = (v) => {
    if (v == null) return '';
    const s = String(v);
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
};

const downloadCsv = (filename, rows) => {
    const csv = rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const inquiryTimestamp = (inq) =>
    inq.createdAt?.seconds || inq.submittedAt?.seconds || 0;

const relativeTime = (ts) => {
    if (!ts) return 'Just now';
    const diff = Date.now() - ts * 1000;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(ts * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

const StatusPill = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    const s = STATUS_OPTS.find((x) => x.id === value) || STATUS_OPTS[0];

    useEffect(() => {
        if (!open) return undefined;
        const close = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, [open]);

    return (
        <div className="relative" ref={wrapRef} onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((o) => !o);
                }}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-medium border whitespace-nowrap transition-colors"
                style={{ background: s.bg, color: s.text, borderColor: `${s.dot}33` }}
            >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                {s.l}
                <ChevronDown size={11} />
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-ink/10 bg-ivory shadow-xl overflow-hidden z-30">
                    {STATUS_OPTS.map((o) => (
                        <button
                            key={o.id}
                            type="button"
                            onClick={() => {
                                onChange(o.id);
                                setOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-ink hover:bg-ivory-soft ${o.id === value ? 'bg-ivory-soft' : ''}`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: o.dot }} />
                            {o.l}
                            {o.id === value && <Check size={12} className="ml-auto" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const TypeBadge = ({ type }) => (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.08] px-2 py-0.5 text-[10.5px] font-medium text-ink whitespace-nowrap">
        {TYPE_LABELS[type] || 'General'}
    </span>
);

const CarBadge = ({ carName, carId }) => {
    if (!carName) return null;
    const content = (
        <>
            <Car size={10} /> <span className="truncate max-w-[180px]">{carName}</span>
        </>
    );
    const className =
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] whitespace-nowrap';
    const style = { background: 'rgba(42,75,124,0.12)', color: '#2a4b7c' };
    return carId ? (
        <Link to={`/car/${carId}`} target="_blank" rel="noopener noreferrer" className={className} style={style}>
            {content}
        </Link>
    ) : (
        <span className={className} style={style}>
            {content}
        </span>
    );
};

const DetailCell = ({ icon: Icon, label, value, mono }) => (
    <div className="rounded-xl border border-ink/10 bg-white px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-ink/5 text-ink-muted flex items-center justify-center shrink-0">
            <Icon size={14} />
        </div>
        <div className="min-w-0">
            <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-faint">{label}</div>
            <div className={`text-[13.5px] truncate text-ink ${mono ? 'font-mono uppercase tracking-[0.12em]' : ''}`}>
                {value || '—'}
            </div>
        </div>
    </div>
);

const ExpandableRow = ({ inq, expanded, onToggle, onStatus, onSaveNote, onDelete }) => {
    const [note, setNote] = useState(inq.adminNote || '');
    const [savedNote, setSavedNote] = useState(inq.adminNote || '');
    const detailRef = useRef(null);
    const [maxH, setMaxH] = useState(0);

    useEffect(() => {
        setNote(inq.adminNote || '');
        setSavedNote(inq.adminNote || '');
    }, [inq.adminNote]);

    useEffect(() => {
        if (expanded && detailRef.current) {
            setMaxH(detailRef.current.scrollHeight);
        } else {
            setMaxH(0);
        }
    }, [expanded, note]);

    const initials = (inq.name || '?')
        .split(' ')
        .map((s) => s[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const phoneDigits = (inq.phone || '').replace(/[^+\d]/g, '');
    const waNumber = phoneDigits.startsWith('+') ? phoneDigits.slice(1) : phoneDigits;
    const ts = inquiryTimestamp(inq);
    const idShort = inq.id ? inq.id.slice(0, 8) : '';
    const hasUnsaved = note !== savedNote;
    const noteIsSaved = !!savedNote && note === savedNote;

    return (
        <article
            className={`group rounded-2xl border transition-colors ${expanded ? 'border-ink/20 bg-white' : 'border-ink/10 bg-white/55 hover:bg-ivory-soft/60'}`}
        >
            <div
                role="button"
                tabIndex={0}
                onClick={onToggle}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggle();
                    }
                }}
                className="w-full text-left px-5 py-4 flex items-start gap-4 cursor-pointer"
            >
                <div className="w-11 h-11 shrink-0 rounded-full bg-ink text-ivory font-display text-[16px] flex items-center justify-center">
                    {initials || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="font-medium text-[14.5px] text-ink">{inq.name || 'Unknown'}</span>
                            <TypeBadge type={inq.type} />
                            <CarBadge carName={inq.carName} carId={inq.carId} />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <StatusPill value={inq.status || 'new'} onChange={onStatus} />
                            <span
                                className={`w-7 h-7 rounded-full border border-ink/15 flex items-center justify-center text-ink-muted transition-transform ${expanded ? 'rotate-180 bg-ink text-ivory border-ink' : ''}`}
                            >
                                <ChevronDown size={13} />
                            </span>
                        </div>
                    </div>
                    <p className="mt-2 text-[13px] text-ink-muted leading-snug line-clamp-2">{inq.message}</p>
                    <div className="mt-2.5 flex items-center gap-x-4 gap-y-1 flex-wrap text-[11.5px] text-ink-faint">
                        {inq.phone && (
                            <span className="inline-flex items-center gap-1.5 num">
                                <Phone size={11} /> {inq.phone}
                            </span>
                        )}
                        {inq.email && (
                            <span className="inline-flex items-center gap-1.5">
                                <Mail size={11} /> {inq.email}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                            <Clock size={11} /> {relativeTime(ts)}
                        </span>
                        {idShort && (
                            <span className="font-mono uppercase tracking-[0.16em] text-[10px] ml-auto">
                                inq-{idShort}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div
                style={{
                    maxHeight: maxH,
                    opacity: expanded ? 1 : 0,
                    transition: 'max-height 420ms cubic-bezier(.2,.7,.2,1), opacity 320ms ease',
                }}
                className="overflow-hidden"
            >
                <div ref={detailRef} className="bg-ivory-soft/70 border-t border-ink/10 px-5 py-5 space-y-5">
                    <div className="grid sm:grid-cols-3 gap-3">
                        <DetailCell icon={Phone} label="Preferred contact" value={inq.preferredContact} />
                        <DetailCell icon={Clock} label="Best time" value={inq.preferredTime} />
                        <DetailCell icon={Hash} label="Inquiry ID" value={idShort ? `inq-${idShort}` : inq.id} mono />
                    </div>

                    <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint mb-2">
                            — Customer message
                        </div>
                        <div className="rounded-2xl border border-ink/10 bg-white p-5 text-[14px] leading-[1.7] text-ink whitespace-pre-wrap">
                            {inq.message}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {phoneDigits && (
                            <a
                                href={`tel:${phoneDigits}`}
                                className="inline-flex items-center gap-2 rounded-full bg-ink text-ivory px-4 py-2 text-[13px] hover:bg-champagne-deep transition-colors whitespace-nowrap"
                            >
                                <Phone size={13} /> Call
                            </a>
                        )}
                        {waNumber && (
                            <a
                                href={`https://wa.me/${waNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-[#0f7a3e] text-white px-4 py-2 text-[13px] hover:bg-[#0c6231] transition-colors whitespace-nowrap"
                            >
                                <MessageCircle size={13} /> WhatsApp
                            </a>
                        )}
                        {inq.email && (
                            <a
                                href={`mailto:${inq.email}`}
                                className="inline-flex items-center gap-2 rounded-full border border-ink/15 text-ink px-4 py-2 text-[13px] hover:bg-ink hover:text-ivory transition-colors whitespace-nowrap"
                            >
                                <Mail size={13} /> Email
                            </a>
                        )}
                        {inq.carId && (
                            <Link
                                to={`/car/${inq.carId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-ink/15 text-ink px-4 py-2 text-[13px] hover:bg-ink hover:text-ivory transition-colors whitespace-nowrap"
                            >
                                <ExternalLink size={13} /> View car
                            </Link>
                        )}
                        <button
                            type="button"
                            onClick={onDelete}
                            className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#8b1f1f]/30 text-[#8b1f1f] px-4 py-2 text-[13px] hover:bg-[#8b1f1f] hover:text-white hover:border-[#8b1f1f] transition-colors whitespace-nowrap"
                        >
                            <Trash2 size={13} /> Delete
                        </button>
                    </div>

                    <div className="rounded-2xl border border-ink/10 bg-white p-5">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                            <div>
                                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                                    — Internal note
                                </div>
                                <div className="text-[12.5px] text-ink-muted">
                                    Private. Not visible to the customer.
                                </div>
                            </div>
                            {noteIsSaved && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700/10 text-emerald-800 border border-emerald-700/25 px-2.5 py-1 text-[11px]">
                                    <Check size={11} /> Note saved
                                </span>
                            )}
                        </div>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Anything to remember about this customer — context, next steps, prior conversations..."
                            rows={3}
                            maxLength={500}
                            className="w-full rounded-xl border border-ink/10 bg-ivory-soft/40 px-4 py-3 text-[13.5px] text-ink placeholder:text-ink-faint focus:border-ink transition-colors resize-none outline-none"
                        />
                        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                            <div className="text-[11.5px] text-ink-faint num">
                                {note.length} / 500 characters
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setNote(savedNote)}
                                    disabled={!hasUnsaved}
                                    className="text-[12.5px] text-ink-muted hover:text-ink disabled:opacity-40 disabled:hover:text-ink-muted"
                                >
                                    Reset
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await onSaveNote(note);
                                        setSavedNote(note);
                                    }}
                                    disabled={!hasUnsaved}
                                    className="inline-flex items-center gap-2 rounded-full bg-ink text-ivory px-4 py-2 text-[12.5px] hover:bg-champagne-deep transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save size={12} /> Save note
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
};

const AdminInquiriesPage = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('All Types');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const fetchInquiries = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let snapshot;
            try {
                snapshot = await getDocs(query(collection(db, 'inquiries'), orderBy('createdAt', 'desc')));
            } catch (_) {
                snapshot = await getDocs(query(collection(db, 'inquiries'), orderBy('submittedAt', 'desc')));
            }
            const data = snapshot.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .sort((a, b) => inquiryTimestamp(b) - inquiryTimestamp(a));
            setInquiries(data);
        } catch (err) {
            setError('Error fetching inquiries.');
            console.error('Error fetching inquiries:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

    const handleDelete = async (inquiryId) => {
        if (!window.confirm('Delete this inquiry?')) return;
        try {
            await deleteDoc(doc(db, 'inquiries', inquiryId));
            setInquiries((prev) => prev.filter((i) => i.id !== inquiryId));
            if (expandedId === inquiryId) setExpandedId(null);
        } catch (err) {
            setError('Error deleting inquiry.');
            console.error('Error deleting inquiry:', err);
        }
    };

    const handleUpdateStatus = async (inquiryId, newStatus) => {
        const previous = inquiries;
        setInquiries((prev) =>
            prev.map((inq) => (inq.id === inquiryId ? { ...inq, status: newStatus } : inq))
        );
        try {
            await updateDoc(doc(db, 'inquiries', inquiryId), { status: newStatus });
        } catch (err) {
            setError('Error updating status.');
            setInquiries(previous);
        }
    };

    const handleSaveNote = async (inquiryId, note) => {
        const trimmed = (note || '').trim();
        try {
            await updateDoc(doc(db, 'inquiries', inquiryId), { adminNote: trimmed });
            setInquiries((prev) =>
                prev.map((inq) => (inq.id === inquiryId ? { ...inq, adminNote: trimmed } : inq))
            );
        } catch (err) {
            setError('Could not save note.');
            console.error('Note save error:', err);
        }
    };

    const counts = useMemo(
        () => ({
            all: inquiries.length,
            new: inquiries.filter((i) => (i.status || 'new') === 'new').length,
            contacted: inquiries.filter((i) => i.status === 'contacted').length,
            resolved: inquiries.filter((i) => i.status === 'resolved').length,
        }),
        [inquiries]
    );

    const typeFilterValue = useMemo(() => {
        if (typeFilter === 'All Types') return 'all';
        const entry = Object.entries(TYPE_LABELS).find(([, label]) => label === typeFilter);
        return entry ? entry[0] : 'all';
    }, [typeFilter]);

    const filtered = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return inquiries.filter((inq) => {
            if (statusFilter !== 'all' && (inq.status || 'new') !== statusFilter) return false;
            if (typeFilterValue !== 'all' && (inq.type || 'general') !== typeFilterValue) return false;
            if (q) {
                const hay = `${inq.name || ''} ${inq.phone || ''} ${inq.email || ''} ${inq.message || ''} ${inq.carName || ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [inquiries, statusFilter, typeFilterValue, searchTerm]);

    const handleExportCsv = () => {
        const header = ['Date', 'Name', 'Phone', 'Email', 'Type', 'Status', 'Car', 'Message', 'AdminNote'];
        const rows = filtered.map((inq) => {
            const ts = inquiryTimestamp(inq);
            return [
                ts ? new Date(ts * 1000).toISOString() : '',
                inq.name,
                inq.phone,
                inq.email,
                TYPE_LABELS[inq.type] || 'General',
                inq.status || 'new',
                inq.carName || '',
                inq.message,
                inq.adminNote || '',
            ];
        });
        downloadCsv(`inquiries-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
    };

    return (
        <div className="px-4 lg:px-8 py-6 lg:py-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-faint">
                        — Inbox · <span className="num">{inquiries.length}</span> inquiries
                    </div>
                    <h1 className="font-display text-[44px] md:text-[64px] leading-[0.95] tracking-tightest mt-2 text-ink">
                        Customer <em className="italic text-champagne">inquiries.</em>
                    </h1>
                    <p className="mt-2 text-[14px] text-ink-muted max-w-xl">
                        Track and manage customer messages — call, message, take internal notes, and update status as
                        you move each conversation forward.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={!filtered.length}
                    className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white/60 px-3.5 py-2 text-[12.5px] text-ink hover:bg-ink hover:text-ivory transition-colors self-start whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={13} /> Export CSV
                </button>
            </div>

            <div className="mt-7 flex items-center gap-2 bg-white/65 border border-ink/10 rounded-2xl px-5 py-4 focus-within:border-ink/40 transition-colors">
                <Search size={16} className="text-ink-faint" />
                <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, phone, email, message, or car…"
                    className="flex-1 bg-transparent text-[14px] placeholder:text-ink-faint outline-none text-ink"
                />
                {searchTerm && (
                    <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="text-ink-faint hover:text-ink"
                        aria-label="Clear"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <div className="mt-5">
                <div className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-faint mb-2">Status</div>
                <div className="flex items-center gap-2 flex-wrap">
                    {STATUS_TABS.map((t) => {
                        const on = statusFilter === t.id;
                        const n = counts[t.id] ?? 0;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setStatusFilter(t.id)}
                                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] whitespace-nowrap transition-colors ${on ? 'bg-ink text-ivory border-ink' : 'border-ink/15 text-ink hover:border-ink/40'}`}
                            >
                                {t.l}
                                <span
                                    className="num text-[10.5px] px-1.5 py-0.5 rounded-full"
                                    style={{
                                        background: on ? 'rgba(255,255,255,0.18)' : `${t.tone}15`,
                                        color: on ? '#fff' : t.tone,
                                    }}
                                >
                                    {n}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-5">
                <div className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-faint mb-2">
                    Inquiry type
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {TYPE_TABS.map((t) => {
                        const on = typeFilter === t;
                        return (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTypeFilter(t)}
                                className={`rounded-full border px-3.5 py-1.5 text-[12.5px] whitespace-nowrap transition-colors ${on ? 'bg-ink-soft text-ivory border-ink-soft' : 'border-ink/15 text-ink hover:border-ink/40 bg-white/40'}`}
                            >
                                {t}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-7 flex items-center justify-between flex-wrap gap-3 text-[12.5px] text-ink-muted">
                <div>
                    Showing <span className="text-ink num">{filtered.length}</span> of{' '}
                    <span className="text-ink num">{inquiries.length}</span> inquiries
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                    Auto-synced ·{' '}
                    {new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                </div>
            </div>

            {error && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-[13px]">
                    {error}
                </div>
            )}

            <div className="mt-4 space-y-3">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-ink border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-2xl border border-ink/10 bg-white/60 py-20 px-8 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full border border-ink/15 flex items-center justify-center text-ink-muted">
                            <Search size={14} />
                        </div>
                        <div className="font-display text-[28px] leading-tight mt-4 text-ink">
                            No inquiries <em className="italic text-champagne">match.</em>
                        </div>
                        <div className="text-[13px] text-ink-muted mt-1">
                            {inquiries.length === 0
                                ? 'No customer messages yet.'
                                : 'Try a different filter or search term.'}
                        </div>
                    </div>
                ) : (
                    filtered.map((inq) => (
                        <ExpandableRow
                            key={inq.id}
                            inq={inq}
                            expanded={expandedId === inq.id}
                            onToggle={() => setExpandedId(expandedId === inq.id ? null : inq.id)}
                            onStatus={(s) => handleUpdateStatus(inq.id, s)}
                            onSaveNote={(note) => handleSaveNote(inq.id, note)}
                            onDelete={() => handleDelete(inq.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminInquiriesPage;
