import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompareArrows, ArrowRight, X } from 'lucide-react';
import { getCompare, clearCompare, COMPARE_LIMIT } from '../../utils/favorites';

const CompareBar = () => {
    const [count, setCount] = useState(0);
    const location = useLocation();

    useEffect(() => {
        const update = () => setCount(getCompare().length);
        update();
        window.addEventListener('jain:storage', update);
        return () => window.removeEventListener('jain:storage', update);
    }, []);

    if (location.pathname === '/compare') return null;

    return (
        <AnimatePresence>
            {count > 0 && (
                <motion.div
                    initial={{ x: '-50%', y: 80, opacity: 0 }}
                    animate={{ x: '-50%', y: 0, opacity: 1 }}
                    exit={{ x: '-50%', y: 80, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="fixed bottom-6 left-1/2 z-40 max-w-[calc(100%-2rem)]"
                >
                    <div
                        className="bg-ink text-ivory rounded-full flex items-center gap-3 pl-5 pr-2 py-2 border border-ink"
                        style={{ boxShadow: '0 20px 60px -20px rgba(14,14,12,0.55)' }}
                    >
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-champagne text-ink shrink-0">
                            <GitCompareArrows size={13} />
                        </span>
                        <span className="text-[13px] leading-none whitespace-nowrap">
                            <span className="font-display text-[18px] text-champagne num align-middle mr-1">{count}</span>
                            <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ivory/65 align-middle">
                                of {COMPARE_LIMIT} selected
                            </span>
                        </span>
                        <button
                            onClick={() => clearCompare()}
                            className="w-7 h-7 rounded-full text-ivory/55 hover:text-ivory hover:bg-ivory/10 flex items-center justify-center transition-colors"
                            title="Clear"
                            aria-label="Clear compare list"
                        >
                            <X size={13} />
                        </button>
                        <Link
                            to="/compare"
                            className="ml-1 inline-flex items-center gap-1.5 bg-champagne text-ink hover:bg-champagne-light px-4 py-2 rounded-full text-[12.5px] font-medium transition-colors whitespace-nowrap"
                        >
                            Compare <ArrowRight size={13} />
                        </Link>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CompareBar;
