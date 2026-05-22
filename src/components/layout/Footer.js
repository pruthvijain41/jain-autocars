import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, MessageCircle, ArrowRight } from 'lucide-react';

const Eyebrow = ({ children }) => (
    <span className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.18em] text-[10.5px] text-ivory/70">
        <span className="inline-block w-4 h-px bg-ivory/40" />
        {children}
    </span>
);

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-ink text-ivory">
            <div className="max-w-[1480px] mx-auto px-6 md:px-12 pt-20 pb-10">
                <div className="grid md:grid-cols-12 gap-10">
                    <div className="md:col-span-5">
                        <Link to="/" className="flex items-center gap-2.5">
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-ivory/30">
                                <span className="font-display text-[20px] leading-none">J</span>
                            </span>
                            <span className="font-display text-[24px] leading-none">Jain Autocars</span>
                        </Link>
                        <p className="mt-5 max-w-md text-[14px] text-ivory/65 leading-relaxed">
                            Mysore's most-trusted name in pre-owned cars since 2011. A family-run dealership built on
                            one rule — sell the kind of car we would put our own family in.
                        </p>
                        <div className="mt-6 flex items-center gap-3">
                            {[
                                { name: 'Instagram', Icon: Instagram, href: '#' },
                                { name: 'Facebook', Icon: Facebook, href: '#' },
                                { name: 'YouTube', Icon: Youtube, href: '#' },
                                { name: 'WhatsApp', Icon: MessageCircle, href: 'https://wa.me/919986619282' },
                            ].map(({ name, Icon, href }) => (
                                <a
                                    key={name}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={name}
                                    className="w-9 h-9 rounded-full border border-ivory/15 hover:border-ivory/40 flex items-center justify-center transition-colors"
                                >
                                    <Icon size={14} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <Eyebrow>Shop</Eyebrow>
                        <ul className="mt-4 space-y-2.5 text-[13.5px] text-ivory/75">
                            <li><Link to="/used-cars-in-mysore" className="link-u">All cars</Link></li>
                            <li><Link to="/used-cars-in-mysore?bodyType=SUV" className="link-u">SUVs</Link></li>
                            <li><Link to="/used-cars-in-mysore?bodyType=Sedan" className="link-u">Sedans</Link></li>
                            <li><Link to="/used-cars-in-mysore?priceMax=1000000" className="link-u">Under ₹10L</Link></li>
                            <li><Link to="/favorites" className="link-u">Saved cars</Link></li>
                        </ul>
                    </div>

                    <div className="md:col-span-2">
                        <Eyebrow>Company</Eyebrow>
                        <ul className="mt-4 space-y-2.5 text-[13.5px] text-ivory/75">
                            <li><Link to="/contact" className="link-u">Contact</Link></li>
                            <li><Link to="/contact" className="link-u">Visit showroom</Link></li>
                            <li><Link to="/used-cars-in-mysore" className="link-u">Inventory</Link></li>
                            <li><Link to="/admin/login" className="link-u">Admin</Link></li>
                        </ul>
                    </div>

                    <div className="md:col-span-3">
                        <Eyebrow>Stay in the loop</Eyebrow>
                        <p className="mt-4 text-[13.5px] text-ivory/65">Fresh arrivals every Friday. No spam, no marketing fluff.</p>
                        <form
                            className="mt-4 flex items-center gap-1 rounded-full border border-ivory/15 bg-ivory/5 pl-4 pr-1 py-1"
                            onSubmit={(e) => e.preventDefault()}
                        >
                            <input
                                type="email"
                                placeholder="you@example.com"
                                className="flex-1 bg-transparent text-[13.5px] py-2 placeholder:text-ivory/35 outline-none border-0 focus:ring-0"
                            />
                            <button type="submit" aria-label="Subscribe" className="w-9 h-9 rounded-full bg-ivory text-ink flex items-center justify-center hover:bg-champagne transition-colors">
                                <ArrowRight size={14} />
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-16 pt-6 border-t border-ivory/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[12px] text-ivory/45 font-mono uppercase tracking-[0.18em]">
                    <div>© {currentYear} Jain Autocars · Kuvempu Nagara, Mysore</div>
                    <div className="flex items-center gap-6">
                        <a href="#" className="link-u">Privacy</a>
                        <a href="#" className="link-u">Terms</a>
                        <a href="#" className="link-u">Sitemap</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
