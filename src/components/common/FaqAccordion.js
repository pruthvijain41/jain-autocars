import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const DEFAULT_FAQ = [
    {
        q: 'Do you offer in-house financing?',
        a: 'Yes. We partner with HDFC, ICICI, Axis, Kotak and three NBFCs. Approvals typically come through in under three hours during weekdays, and we can offer loans up to ninety percent of the on-road price for credit scores above 750.',
    },
    {
        q: 'Can I trade in my old car?',
        a: 'Absolutely. Bring your car in for a twenty-minute physical inspection at the showroom, or upload photos through the "Sell your car" form on the homepage. We give you a written offer the same day — no obligation to buy from us in return.',
    },
    {
        q: 'Is there a warranty on the cars you sell?',
        a: 'Every JA-certified vehicle ships with a complimentary one-year engine and transmission warranty, plus a five-day no-questions return window. Extended warranties up to three years are available at the time of purchase.',
    },
    {
        q: 'How does the test drive work?',
        a: 'Book online or call us. We bring the car to your home or office within Mysore city (free), or you can come down to the showroom. Trained product specialists ride along — no salesy pressure, just answers to your questions.',
    },
    {
        q: 'What documents do I need to buy?',
        a: 'Just an Aadhaar, PAN, and address proof. We handle Form 28/29/30, NOC, ownership transfer and insurance — RTO paperwork is included in the price.',
    },
];

const FaqAccordion = ({ items = DEFAULT_FAQ }) => {
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <div className="rounded-3xl border border-ink/10 bg-white/55 overflow-hidden">
            {items.map((item, i) => {
                const isOpen = openIndex === i;
                return (
                    <div key={i} className={i > 0 ? 'border-t border-ink/10' : ''}>
                        <button
                            onClick={() => setOpenIndex(isOpen ? -1 : i)}
                            className="w-full flex items-center justify-between gap-4 text-left px-6 md:px-8 py-5 md:py-6 hover:bg-ivory-soft/60 transition-colors"
                        >
                            <div className="flex items-baseline gap-4 min-w-0">
                                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint num shrink-0">
                                    — {String(i + 1).padStart(2, '0')}
                                </span>
                                <span className="font-display text-[20px] md:text-[26px] leading-tight text-ink">
                                    {item.q}
                                </span>
                            </div>
                            <span className={`shrink-0 w-9 h-9 rounded-full border flex items-center justify-center transition-all ${isOpen ? 'bg-ink text-ivory border-ink rotate-180' : 'border-ink/15 text-ink'}`}>
                                <ChevronDown size={14} />
                            </span>
                        </button>
                        <div
                            className="px-6 md:px-8 overflow-hidden transition-all duration-500 ease-out"
                            style={{ maxHeight: isOpen ? 600 : 0, opacity: isOpen ? 1 : 0 }}
                        >
                            <div className="pb-7 md:pb-9 pl-0 sm:pl-10">
                                <p className="text-[14.5px] leading-[1.75] text-ink-muted max-w-2xl">
                                    {item.a}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default FaqAccordion;
