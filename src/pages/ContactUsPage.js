import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
    MapPin, Phone, Mail, Clock, MessageCircle, Calendar,
    Instagram, Facebook, Youtube, Navigation, HelpCircle, Sparkles,
} from 'lucide-react';
import InquiryForm from '../components/forms/InquiryForm';
import TestimonialForm from '../components/forms/TestimonialForm';
import FaqAccordion from '../components/common/FaqAccordion';
import { getShowroomStatus } from '../utils/openingHours';
import { fetchShowroomInfo, DEFAULT_SHOWROOM_INFO } from '../utils/showroomInfo';

const SOCIAL_ICONS = {
    instagram: Instagram,
    facebook: Facebook,
    youtube: Youtube,
    whatsapp: MessageCircle,
};

const Eyebrow = ({ children }) => (
    <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-faint">
        — {children}
    </div>
);

const ContactInfoCard = ({ info, status }) => {
    const telHref = `tel:${(info.phone || '').replace(/[^+\d]/g, '')}`;
    const mailHref = `mailto:${info.email}`;
    const addressLines = (info.address || '').split('\n').filter(Boolean);
    const hoursLines = (info.hoursText || '').split('\n').filter(Boolean);
    const social = info.social || {};
    const socialEntries = Object.entries(social).filter(([, v]) => Boolean(v));

    const items = [
        {
            icon: MapPin,
            title: 'Visit us',
            lines: ['Jain Autocars Showroom', ...addressLines],
        },
        {
            icon: Phone,
            title: 'Call us',
            lines: [
                <a key="phone" href={telHref} className="hover:text-ink transition-colors">{info.phone}</a>,
            ],
        },
        {
            icon: Mail,
            title: 'Email us',
            lines: [
                <a key="email" href={mailHref} className="hover:text-ink transition-colors break-all">{info.email}</a>,
            ],
        },
    ];

    return (
        <div className="rounded-3xl border border-ink/10 bg-white/55 p-7 md:p-9 lift">
            <div className="flex items-center justify-between">
                <Eyebrow>Reach us</Eyebrow>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                    All times IST
                </span>
            </div>
            <h3 className="font-display text-[36px] md:text-[44px] leading-[1] tracking-tightest mt-3 text-ink">
                Contact <em className="italic text-champagne">information.</em>
            </h3>

            <ul className="mt-8 space-y-7">
                {items.map((it) => {
                    const Icon = it.icon;
                    return (
                        <li key={it.title} className="flex gap-4">
                            <div className="shrink-0 w-12 h-12 rounded-2xl bg-ink text-champagne flex items-center justify-center">
                                <Icon size={16} />
                            </div>
                            <div className="min-w-0">
                                <div className="font-display text-[20px] leading-tight text-ink">{it.title}</div>
                                <div className="text-[13.5px] text-ink-muted leading-relaxed mt-1">
                                    {it.lines.map((l, i) => <div key={i}>{l}</div>)}
                                </div>
                            </div>
                        </li>
                    );
                })}

                <li className="flex gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-ink text-champagne flex items-center justify-center">
                        <Clock size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-display text-[20px] leading-tight text-ink">Opening hours</div>
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] ${status.isOpen ? 'border-emerald-700/30 bg-emerald-700/10 text-emerald-800' : 'border-ink/15 bg-ink/5 text-ink-muted'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? 'bg-emerald-600' : 'bg-ink-faint'}`} />
                                {status.label}
                            </span>
                        </div>
                        <div className="text-[13.5px] text-ink-muted leading-relaxed mt-2 space-y-1">
                            {hoursLines.map((line, i) => {
                                const [labelPart, ...timePart] = line.split(':');
                                const timeText = timePart.join(':').trim();
                                return timeText ? (
                                    <div key={i} className="grid grid-cols-[1fr_auto] gap-x-4 items-baseline">
                                        <span>{labelPart.trim()}</span>
                                        <span className="num whitespace-nowrap">{timeText}</span>
                                    </div>
                                ) : (
                                    <div key={i}>{line}</div>
                                );
                            })}
                            {status.detail && (
                                <div className="mt-2 text-[12px] text-ink-faint">{status.detail}</div>
                            )}
                        </div>
                    </div>
                </li>
            </ul>

            {socialEntries.length > 0 && (
                <div className="mt-9 pt-6 border-t border-ink/10 flex items-center justify-between flex-wrap gap-3">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-faint">
                        Follow along —
                    </span>
                    <div className="flex items-center gap-2">
                        {socialEntries.map(([key, url]) => {
                            const Icon = SOCIAL_ICONS[key] || MessageCircle;
                            return (
                                <a
                                    key={key}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={key}
                                    className="w-9 h-9 rounded-full border border-ink/15 hover:bg-ink hover:text-ivory text-ink flex items-center justify-center transition-colors"
                                >
                                    <Icon size={14} />
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const MapCard = ({ info }) => {
    const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(info.address || 'Jain Autocars Mysore')}`;
    return (
        <div className="rounded-3xl border border-ink/10 bg-white/55 overflow-hidden lift">
            <div className="relative h-80 md:h-96 overflow-hidden">
                <iframe
                    src={info.mapEmbed}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    title="Jain Autocars Location"
                    className="grayscale-[0.2]"
                />
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-ink/10 flex-wrap">
                <div className="text-[12.5px] text-ink-muted min-w-0">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">Address — </span>
                    <span className="whitespace-pre-line">{info.address}</span>
                </div>
                <a
                    href={directionsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-[12px] text-ink hover:bg-ink hover:text-ivory transition-colors"
                >
                    <Navigation size={12} /> Directions
                </a>
            </div>
        </div>
    );
};

const ContactUsPage = () => {
    const [info, setInfo] = useState(DEFAULT_SHOWROOM_INFO);

    useEffect(() => {
        let mounted = true;
        fetchShowroomInfo().then((data) => { if (mounted) setInfo(data); });
        return () => { mounted = false; };
    }, []);

    const status = getShowroomStatus(new Date(), info.hours || undefined);
    const telHref = `tel:${(info.phone || '').replace(/[^+\d]/g, '')}`;
    const waNumber = (info.social?.whatsapp || info.phone || '').replace(/[^+\d]/g, '').replace(/^\+/, '');
    const waHref = waNumber ? `https://wa.me/${waNumber}` : '#';

    return (
        <div className="bg-ivory min-h-screen">
            <Helmet>
                <title>Contact Us — Jain Autocars Mysore</title>
                <meta
                    name="description"
                    content="Visit our Mysore showroom, call us, or send a message. We respond within thirty minutes during business hours."
                />
            </Helmet>

            <main className="pt-24">
                <section className="pt-12 md:pt-20 pb-14">
                    <div className="max-w-[1480px] mx-auto px-6 md:px-12 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white/60 px-3 py-1.5 text-[11.5px] text-ink-muted">
                            <MessageCircle size={12} className="text-champagne-deep" />
                            <span className="font-mono uppercase tracking-[0.18em] text-[10px]">Contact · Mysore</span>
                        </div>
                        <h1 className="font-display mt-6 text-[56px] sm:text-[88px] lg:text-[136px] leading-[0.88] tracking-tightest text-ink">
                            Get in <em className="italic text-champagne">touch.</em>
                        </h1>
                        <p className="mt-7 text-[15.5px] leading-relaxed text-ink-muted max-w-2xl mx-auto">
                            Have a question about a car or want to schedule a test drive? We're here to help. Reach
                            out using the form below, drop us a call, or come down to the showroom for a walk-through.
                        </p>

                        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
                            <a
                                href={telHref}
                                className="inline-flex items-center gap-2 rounded-full bg-ink text-ivory px-4 py-2 text-[13px] hover:bg-champagne-deep transition-colors"
                            >
                                <Phone size={13} /> {info.phone}
                            </a>
                            {waNumber && (
                                <a
                                    href={waHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-[13px] text-ink hover:bg-ink hover:text-ivory transition-colors"
                                >
                                    <MessageCircle size={13} /> WhatsApp
                                </a>
                            )}
                            <a
                                href="/used-cars-in-mysore"
                                className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-[13px] text-ink hover:bg-ink hover:text-ivory transition-colors"
                            >
                                <Calendar size={13} /> Book test drive
                            </a>
                        </div>
                    </div>
                </section>

                <section className="pb-24">
                    <div className="max-w-[1480px] mx-auto px-6 md:px-12">
                        <div className="grid lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-5 space-y-6">
                                <ContactInfoCard info={info} status={status} />
                                <MapCard info={info} />
                            </div>
                            <div className="lg:col-span-7">
                                <div className="rounded-3xl border border-ink/10 bg-white p-7 md:p-10 shadow-[0_30px_70px_-30px_rgba(14,14,12,0.25)]">
                                    <div className="flex items-end justify-between flex-wrap gap-4">
                                        <div>
                                            <Eyebrow>Write to us</Eyebrow>
                                            <h3 className="font-display text-[36px] md:text-[52px] leading-[0.98] tracking-tightest mt-3 text-ink">
                                                Send us a <em className="italic text-champagne">message.</em>
                                            </h3>
                                            <p className="text-[13.5px] text-ink-muted mt-3 max-w-md">
                                                A team member usually replies within thirty minutes during business hours.
                                                For urgent test-drive bookings, please call us.
                                            </p>
                                        </div>
                                        <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-faint">
                                            Avg. response · <span className="text-ink num">28 min</span>
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <InquiryForm typeStyle="chips" maxMessageLength={500} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-ivory py-24 md:py-32">
                    <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white/60 px-3 py-1.5 text-[11.5px] text-ink-muted">
                            <HelpCircle size={12} className="text-champagne-deep" />
                            <span className="font-mono uppercase tracking-[0.18em] text-[10px]">FAQ</span>
                        </div>
                        <h2 className="font-display mt-6 text-[40px] sm:text-[56px] lg:text-[80px] leading-[0.95] tracking-tightest text-ink">
                            Frequently asked,<br /><em className="italic text-champagne">briefly answered.</em>
                        </h2>
                        <p className="mt-5 text-[14.5px] text-ink-muted max-w-xl mx-auto">
                            Quick answers to the questions we hear most often. Don't see yours? Send a message above —
                            a real person reads every one.
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto px-6 md:px-8 mt-14">
                        <FaqAccordion />
                    </div>
                </section>

                <section className="bg-ivory py-16 md:py-24">
                    <div className="max-w-[1480px] mx-auto px-6 md:px-12">
                        <div className="relative rounded-[32px] bg-ink text-ivory overflow-hidden grain">
                            <div className="absolute -top-10 -right-10 font-display text-[300px] sm:text-[420px] leading-none text-ivory/[0.03] select-none pointer-events-none">
                                ★
                            </div>

                            <div className="relative grid lg:grid-cols-12 gap-10 lg:gap-14 p-8 md:p-14">
                                <div className="lg:col-span-5">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-champagne/40 bg-champagne/10 px-3 py-1.5 text-[11.5px] text-champagne-light">
                                        <Sparkles size={12} /> Tell us how we did
                                    </div>
                                    <h2 className="font-display mt-6 text-[44px] sm:text-[64px] lg:text-[92px] leading-[0.92] tracking-tightest">
                                        Share your<br /><em className="italic text-champagne">experience.</em>
                                    </h2>
                                    <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ivory/70">
                                        Bought a car from us? We'd love to hear your feedback. Your review helps the next
                                        driver find the right car — and helps us get better at what we do.
                                    </p>
                                    <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
                                        <div>
                                            <div className="font-display text-[32px] sm:text-[40px] leading-none num">
                                                4.9<span className="text-champagne">/5</span>
                                            </div>
                                            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ivory/45 mt-1">
                                                Google rating
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-display text-[32px] sm:text-[40px] leading-none num">612</div>
                                            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ivory/45 mt-1">
                                                Reviews
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-display text-[32px] sm:text-[40px] leading-none num">
                                                96<span className="text-champagne">%</span>
                                            </div>
                                            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ivory/45 mt-1">
                                                Repeat or referral
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-7">
                                    <div className="rounded-3xl bg-ivory text-ink p-7 md:p-10 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)]">
                                        <TestimonialForm />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ContactUsPage;
