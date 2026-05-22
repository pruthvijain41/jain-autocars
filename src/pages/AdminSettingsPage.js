import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import {
    Save, CheckCircle, AlertCircle, Settings, ExternalLink, Phone, Mail,
    Facebook, Instagram, MessageCircle, MapPin, Clock, X, Dot,
} from 'lucide-react';
import { fetchShowroomInfo, SHOWROOM_INFO_DOC_ID, DEFAULT_SHOWROOM_INFO } from '../utils/showroomInfo';

const Eyebrow = ({ children, dark = false }) => (
    <div className={`font-mono text-[10.5px] uppercase tracking-[0.2em] ${dark ? 'text-ivory/55' : 'text-ink-faint'}`}>
        — {children}
    </div>
);

const SectionHeading = ({ kicker, title, italic, action }) => (
    <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
            <Eyebrow>{kicker}</Eyebrow>
            <h3 className="font-display text-[26px] md:text-[32px] leading-tight tracking-tightest mt-2 text-ink">
                {title} {italic && <em className="italic text-champagne">{italic}</em>}
            </h3>
        </div>
        {action}
    </div>
);

const SInput = ({ label, value, onChange, placeholder, type = 'text', help, mono = false, rightAdorn }) => (
    <label className="block">
        <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">{label}</span>
            {rightAdorn}
        </div>
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full rounded-xl bg-ivory-soft/70 border border-ink/10 px-4 py-3 text-[14.5px] text-ink placeholder:text-ink-faint focus:bg-white focus:border-ink focus:ring-2 focus:ring-champagne/35 outline-none transition-all ${mono ? 'font-mono tracking-tight' : ''}`}
        />
        {help && <div className="mt-1.5 text-[11.5px] text-ink-muted">{help}</div>}
    </label>
);

const STextarea = ({ label, value, onChange, placeholder, help, rows = 3 }) => (
    <label className="block">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint mb-2">{label}</div>
        <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full rounded-xl bg-ivory-soft/70 border border-ink/10 px-4 py-3 text-[14.5px] text-ink placeholder:text-ink-faint focus:bg-white focus:border-ink focus:ring-2 focus:ring-champagne/35 outline-none transition-all resize-none"
        />
        {help && <div className="mt-1.5 text-[11.5px] text-ink-muted">{help}</div>}
    </label>
);

const SInputWithIcon = ({ label, icon: Icon, value, onChange, placeholder, help, type = 'text' }) => (
    <label className="block">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint mb-2">{label}</div>
        <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md bg-ink/5 text-ink-muted flex items-center justify-center">
                <Icon size={13} />
            </div>
            <input
                type={type}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl bg-ivory-soft/70 border border-ink/10 pl-14 pr-4 py-3 text-[14.5px] text-ink placeholder:text-ink-faint focus:bg-white focus:border-ink focus:ring-2 focus:ring-champagne/35 outline-none transition-all"
            />
        </div>
        {help && <div className="mt-1.5 text-[11.5px] text-ink-muted">{help}</div>}
    </label>
);

const AdminSettingsPage = () => {
    const [info, setInfo] = useState(DEFAULT_SHOWROOM_INFO);
    const [pristine, setPristine] = useState(DEFAULT_SHOWROOM_INFO);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [savedAt, setSavedAt] = useState(null);
    const [toast, setToast] = useState(false);

    useEffect(() => {
        fetchShowroomInfo().then((data) => {
            const merged = {
                ...DEFAULT_SHOWROOM_INFO,
                ...data,
                social: { ...DEFAULT_SHOWROOM_INFO.social, ...(data.social || {}) },
            };
            setInfo(merged);
            setPristine(merged);
            setLoading(false);
        });
    }, []);

    const dirty = useMemo(
        () => JSON.stringify(info) !== JSON.stringify(pristine),
        [info, pristine]
    );

    const upd = (field, value) => setInfo((prev) => ({ ...prev, [field]: value }));
    const updSocial = (field, value) =>
        setInfo((prev) => ({ ...prev, social: { ...prev.social, [field]: value } }));

    const revert = () => setInfo(pristine);

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const payload = {
                name: info.name,
                address: info.address,
                phone: info.phone,
                email: info.email,
                hoursText: info.hoursText,
                mapEmbed: info.mapEmbed,
                social: info.social,
            };
            await setDoc(doc(db, 'showroomInfo', SHOWROOM_INFO_DOC_ID), payload, { merge: true });
            setPristine(info);
            setSavedAt(new Date());
            setToast(true);
            setTimeout(() => setToast(false), 4000);
        } catch (err) {
            console.error('Showroom info save error:', err);
            setError('Could not save settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="px-4 lg:px-8 py-20 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-ink border-t-transparent rounded-full mx-auto" />
            </div>
        );
    }

    const socials = [
        { k: 'facebook', icon: Facebook },
        { k: 'instagram', icon: Instagram },
        { k: 'whatsapp', icon: MessageCircle },
    ];

    return (
        <div className="px-4 lg:px-8 py-6 lg:py-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                    <Eyebrow>Workspace · Public-site settings</Eyebrow>
                    <h1 className="font-display text-[40px] md:text-[60px] leading-[0.95] tracking-tightest mt-2 flex items-center gap-3 flex-wrap text-ink">
                        <span className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-ink text-champagne">
                            <Settings size={20} />
                        </span>
                        Showroom <em className="italic text-champagne">settings.</em>
                    </h1>
                    <p className="mt-2 text-[14px] text-ink-muted max-w-xl">
                        Edit the address, contact info, and hours shown on the public site. Changes go live within a
                        few minutes of saving.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start">
                    <Link
                        to="/contact"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white/60 px-3.5 py-2 text-[12.5px] text-ink hover:bg-ink hover:text-ivory transition-colors whitespace-nowrap"
                    >
                        <ExternalLink size={13} /> Preview live page
                    </Link>
                </div>
            </div>

            <form onSubmit={handleSave} className="mt-10 grid lg:grid-cols-3 gap-6 max-w-6xl">
                <div className="lg:col-span-2 space-y-5">
                    <div className="rounded-3xl border border-ink/10 bg-white p-6 md:p-8 shadow-[0_18px_50px_-30px_rgba(14,14,12,0.20)]">
                        <SectionHeading kicker="01" title="Business" italic="basics." />
                        <div className="mt-6 space-y-5">
                            <SInput
                                label="Showroom name"
                                value={info.name}
                                onChange={(v) => upd('name', v)}
                                placeholder="Jain Autocars"
                            />
                            <STextarea
                                label="Address"
                                value={info.address}
                                onChange={(v) => upd('address', v)}
                                rows={3}
                                placeholder="Survey No, Street, City, PIN"
                                help="Displayed on the Contact page and in the footer. Use line breaks for legibility."
                            />
                            <div className="grid sm:grid-cols-2 gap-5">
                                <SInputWithIcon
                                    icon={Phone}
                                    label="Phone"
                                    value={info.phone}
                                    onChange={(v) => upd('phone', v)}
                                    placeholder="+91 ..."
                                    type="tel"
                                />
                                <SInputWithIcon
                                    icon={Mail}
                                    label="Email"
                                    value={info.email}
                                    onChange={(v) => upd('email', v)}
                                    placeholder="hello@..."
                                    type="email"
                                />
                            </div>
                            <STextarea
                                label="Opening hours"
                                rows={3}
                                value={info.hoursText}
                                onChange={(v) => upd('hoursText', v)}
                                help="Free-form text displayed on the Contact page. The live/open status badge auto-derives from this — keep day labels and times in the standard format."
                            />
                        </div>
                    </div>

                    <div className="rounded-3xl border border-ink/10 bg-white p-6 md:p-8 shadow-[0_18px_50px_-30px_rgba(14,14,12,0.20)]">
                        <SectionHeading kicker="02" title="Map &" italic="location." />
                        <div className="mt-6">
                            <SInput
                                label="Google Maps embed URL"
                                mono
                                value={info.mapEmbed}
                                onChange={(v) => upd('mapEmbed', v)}
                                placeholder="https://www.google.com/maps/embed?pb=..."
                                help={
                                    <>
                                        In Google Maps, click <span className="text-ink">Share → Embed a map</span>,
                                        then copy the <span className="text-ink font-mono">src</span> URL from the
                                        iframe. Leave blank to use the default Mysore showroom pin.
                                    </>
                                }
                            />
                        </div>
                    </div>

                    <div className="rounded-3xl border border-ink/10 bg-white p-6 md:p-8 shadow-[0_18px_50px_-30px_rgba(14,14,12,0.20)]">
                        <div className="flex items-center gap-3">
                            <div className="hairline flex-1" />
                            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-faint whitespace-nowrap">
                                — Social links (optional) —
                            </span>
                            <div className="hairline flex-1" />
                        </div>
                        <div className="mt-6 grid sm:grid-cols-3 gap-5">
                            <SInputWithIcon
                                icon={Facebook}
                                label="Facebook"
                                value={info.social?.facebook}
                                onChange={(v) => updSocial('facebook', v)}
                                placeholder="https://facebook.com/..."
                                type="url"
                            />
                            <SInputWithIcon
                                icon={Instagram}
                                label="Instagram"
                                value={info.social?.instagram}
                                onChange={(v) => updSocial('instagram', v)}
                                placeholder="https://instagram.com/..."
                                type="url"
                            />
                            <SInputWithIcon
                                icon={MessageCircle}
                                label="WhatsApp link"
                                value={info.social?.whatsapp}
                                onChange={(v) => updSocial('whatsapp', v)}
                                placeholder="https://wa.me/..."
                                type="url"
                            />
                        </div>
                    </div>

                    {error && (
                        <div
                            className="rounded-2xl border px-5 py-4 flex items-center gap-3"
                            style={{ background: 'rgba(139,31,31,0.08)', borderColor: 'rgba(139,31,31,0.25)', color: '#8b1f1f' }}
                        >
                            <AlertCircle size={16} className="shrink-0" />
                            <div className="text-[13px]">{error}</div>
                        </div>
                    )}

                    {toast && (
                        <div
                            className="rounded-2xl border px-5 py-4 flex items-center gap-3 flex-wrap"
                            style={{ background: 'rgba(31,107,70,0.10)', borderColor: 'rgba(31,107,70,0.25)', color: '#1f6b46' }}
                        >
                            <span
                                className="w-9 h-9 rounded-full flex items-center justify-center"
                                style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(31,107,70,0.30)' }}
                            >
                                <CheckCircle size={15} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="font-medium text-[14px]">Settings saved.</div>
                                <div className="text-[12.5px] text-ink-muted">
                                    Public site will reflect changes shortly.{' '}
                                    <Link
                                        to="/contact"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link-u text-ink-muted"
                                    >
                                        Preview now
                                    </Link>
                                    .
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setToast(false)}
                                aria-label="Dismiss"
                                className="w-8 h-8 rounded-full text-ink-muted hover:bg-ink/5 flex items-center justify-center"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="text-[12px] text-ink-muted">
                            {dirty ? (
                                <span className="inline-flex items-center gap-1.5 text-[#8a5a17]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#b4781e]" />
                                    Unsaved changes
                                </span>
                            ) : savedAt ? (
                                <>
                                    Last saved{' '}
                                    <span className="text-ink num">
                                        {savedAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                                    </span>
                                </>
                            ) : (
                                <>All changes saved</>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={revert}
                                disabled={!dirty || saving}
                                className="rounded-full border border-ink/15 px-4 py-2.5 text-[13px] text-ink hover:bg-ink/5 transition-colors disabled:opacity-40 disabled:hover:bg-transparent whitespace-nowrap"
                            >
                                Revert
                            </button>
                            <button
                                type="submit"
                                disabled={!dirty || saving}
                                className="inline-flex items-center gap-2 rounded-full bg-ink text-ivory px-5 py-2.5 text-[13.5px] hover:bg-champagne-deep transition-colors disabled:opacity-40 disabled:hover:bg-ink whitespace-nowrap"
                            >
                                <Save size={13} /> {saving ? 'Saving…' : 'Save settings'}
                            </button>
                        </div>
                    </div>
                </div>

                <aside className="space-y-5">
                    <div className="lg:sticky lg:top-24 space-y-5">
                        <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(14,14,12,0.20)]">
                            <Eyebrow>Live preview</Eyebrow>
                            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint mt-3 mb-3">
                                — As shown on Contact page
                            </div>

                            <div className="flex items-center gap-2.5 mb-5">
                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-ink/20">
                                    <span className="font-display text-[18px] leading-none text-ink">JA</span>
                                </span>
                                <span className="font-display text-[22px] leading-none text-ink">
                                    {info.name || '—'}
                                </span>
                            </div>

                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-ink text-champagne flex items-center justify-center shrink-0">
                                        <MapPin size={13} />
                                    </div>
                                    <div className="text-[12.5px] text-ink-muted leading-relaxed whitespace-pre-line">
                                        {info.address || '—'}
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-ink text-champagne flex items-center justify-center shrink-0">
                                        <Phone size={13} />
                                    </div>
                                    <div className="text-[12.5px] num text-ink">{info.phone || '—'}</div>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-ink text-champagne flex items-center justify-center shrink-0">
                                        <Mail size={13} />
                                    </div>
                                    <div className="text-[12.5px] text-ink break-all">{info.email || '—'}</div>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-ink text-champagne flex items-center justify-center shrink-0">
                                        <Clock size={13} />
                                    </div>
                                    <div className="text-[12.5px] text-ink-muted leading-relaxed whitespace-pre-line">
                                        {info.hoursText || '—'}
                                    </div>
                                </li>
                            </ul>

                            <div className="mt-6 pt-5 border-t border-ink/10 flex items-center justify-between flex-wrap gap-2">
                                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                                    Follow —
                                </span>
                                <div className="flex items-center gap-2">
                                    {socials.map(({ k, icon: Icon }) => (
                                        <span
                                            key={k}
                                            className={`w-8 h-8 rounded-full border flex items-center justify-center ${info.social?.[k] ? 'border-ink/30 text-ink' : 'border-ink/10 text-ink-faint'}`}
                                        >
                                            <Icon size={13} />
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-ink text-ivory p-6 shadow-[0_18px_50px_-30px_rgba(14,14,12,0.20)]">
                            <Eyebrow dark>Tips</Eyebrow>
                            <h4 className="font-display text-[22px] leading-tight mt-2">
                                A few <em className="italic text-champagne">notes.</em>
                            </h4>
                            <ul className="mt-4 space-y-3 text-[12.5px] text-ivory/70">
                                <li className="flex gap-2">
                                    <Dot size={14} className="shrink-0 text-champagne mt-0.5" />
                                    Changes propagate to the live site within a few minutes.
                                </li>
                                <li className="flex gap-2">
                                    <Dot size={14} className="shrink-0 text-champagne mt-0.5" />
                                    Phone should be the showroom landline or WhatsApp business line — not a personal
                                    number.
                                </li>
                                <li className="flex gap-2">
                                    <Dot size={14} className="shrink-0 text-champagne mt-0.5" />
                                    Hours format affects the "Open now" status badge — keep day labels in the standard
                                    form.
                                </li>
                                <li className="flex gap-2">
                                    <Dot size={14} className="shrink-0 text-champagne mt-0.5" />
                                    Empty social links are hidden from the public site automatically.
                                </li>
                            </ul>
                        </div>
                    </div>
                </aside>
            </form>
        </div>
    );
};

export default AdminSettingsPage;
