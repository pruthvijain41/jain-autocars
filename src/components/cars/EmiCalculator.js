import React, { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';

const fmt = (v) => Math.round(Math.max(0, v)).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const SliderRow = ({ label, value, min, max, step, rightLabel, onChange }) => (
    <div>
        <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">— {label}</span>
            <span className="font-display font-normal text-ink text-[18px] num">{rightLabel}</span>
        </div>
        <div className="relative mt-3 h-5">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-ink/10" />
            <div
                className="absolute top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-ink"
                style={{ width: `${((value - min) / (max - min)) * 100}%` }}
            />
            <input
                type="range"
                min={min} max={max} step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="range-thumb absolute inset-0 w-full appearance-none bg-transparent"
                style={{ pointerEvents: 'auto' }}
            />
        </div>
    </div>
);

const Stat = ({ label, value }) => (
    <div className="rounded-xl border border-ink/10 bg-ivory-soft/50 px-3.5 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">{label}</div>
        <div className="font-display font-normal text-ink text-[20px] leading-tight mt-1 num">{value}</div>
    </div>
);

const EmiCalculator = ({ price = 0 }) => {
    const priceRupees = Math.max(0, Number(price) || 0);
    const [dpPct, setDpPct] = useState(20);
    const [years, setYears] = useState(5);
    const [rate, setRate] = useState(9.25);

    const { dp, loan, emi, total, interest, n } = useMemo(() => {
        const dpAmt = Math.round((priceRupees * dpPct) / 100);
        const loanAmt = Math.max(0, priceRupees - dpAmt);
        const months = years * 12;
        const monthlyRate = rate / 100 / 12;
        let monthlyEmi;
        if (monthlyRate === 0) {
            monthlyEmi = months > 0 ? loanAmt / months : 0;
        } else {
            const pow = Math.pow(1 + monthlyRate, months);
            monthlyEmi = loanAmt > 0 ? (loanAmt * monthlyRate * pow) / (pow - 1) : 0;
        }
        const totalPaid = monthlyEmi * months;
        return {
            dp: dpAmt,
            loan: loanAmt,
            n: months,
            emi: monthlyEmi,
            total: totalPaid,
            interest: totalPaid - loanAmt,
        };
    }, [priceRupees, dpPct, years, rate]);

    return (
        <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-7">
                <SliderRow
                    label="Down payment"
                    value={dpPct}
                    min={5} max={70} step={1}
                    rightLabel={`${dpPct}% · ₹${fmt(dp)}`}
                    onChange={setDpPct}
                />
                <SliderRow
                    label="Loan tenure"
                    value={years}
                    min={1} max={7} step={1}
                    rightLabel={`${years} ${years === 1 ? 'year' : 'years'}`}
                    onChange={setYears}
                />
                <SliderRow
                    label="Interest rate"
                    value={rate}
                    min={7.5} max={14} step={0.05}
                    rightLabel={`${rate.toFixed(2)}% p.a.`}
                    onChange={setRate}
                />

                <div className="grid grid-cols-3 gap-3 pt-2">
                    <Stat label="Loan amount" value={`₹${fmt(loan)}`} />
                    <Stat label="Total interest" value={`₹${fmt(interest)}`} />
                    <Stat label="Total payable" value={`₹${fmt(total + dp)}`} />
                </div>
            </div>

            <div className="lg:col-span-5">
                <div className="rounded-2xl bg-ink text-ivory p-7 h-full flex flex-col justify-between">
                    <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ivory/55">Estimated monthly EMI</div>
                        <div className="font-display font-normal text-ivory text-[56px] md:text-[72px] leading-none mt-2 num tracking-tightest">
                            ₹{fmt(emi)}
                        </div>
                        <div className="text-[13px] text-ivory/65 mt-2">
                            for <span className="num text-ivory">{n}</span> months · at <span className="num text-ivory">{rate.toFixed(2)}%</span> p.a.
                        </div>
                    </div>
                    <div className="mt-8">
                        <div className="hairline-light" />
                        <p className="mt-4 text-[12px] text-ivory/55 leading-relaxed">
                            Indicative only. Final EMI depends on credit profile and partner bank.
                            We work with HDFC, ICICI, Axis, Kotak and three NBFCs.
                        </p>
                        <a
                            href="/contact?type=finance"
                            className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-champagne text-ink py-3 text-[13.5px] font-medium hover:bg-champagne-light transition-colors"
                        >
                            <Calculator size={14} /> Apply for finance
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmiCalculator;
