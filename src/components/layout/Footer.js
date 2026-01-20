import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail, ArrowRight } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-100 pt-16 pb-8 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary text-white p-1.5 rounded-md">
                                <span className="font-heading font-bold text-lg tracking-tighter">JA</span>
                            </div>
                            <span className="font-heading font-bold text-xl text-slate-900">Jain Autocars</span>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Your trusted destination for premium pre-owned vehicles in Mysore. Quality, transparency, and customer satisfaction are our top priorities.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="#" className="text-slate-400 hover:text-primary transition-colors"><Facebook size={20} /></a>
                            <a href="#" className="text-slate-400 hover:text-primary transition-colors"><Instagram size={20} /></a>
                            <a href="#" className="text-slate-400 hover:text-primary transition-colors"><Twitter size={20} /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-heading font-bold text-slate-900 mb-6">Quick Links</h3>
                        <ul className="space-y-3">
                            <li><Link to="/" className="text-slate-500 hover:text-primary transition-colors text-sm">Home</Link></li>
                            <li><Link to="/used-cars-in-mysore" className="text-slate-500 hover:text-primary transition-colors text-sm">Browse Inventory</Link></li>
                            <li><Link to="/contact" className="text-slate-500 hover:text-primary transition-colors text-sm">Contact Us</Link></li>
                            <li><Link to="/admin/login" className="text-slate-500 hover:text-primary transition-colors text-sm">Admin Login</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="font-heading font-bold text-slate-900 mb-6">Contact Us</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-slate-500 text-sm">
                                <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                                <span>480, Chithrabhanu Rd, Kuvempu Nagara, Mysuru, Karnataka 570023</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-500 text-sm">
                                <Phone size={18} className="text-primary shrink-0" />
                                <a href="tel:+919986619282" className="hover:text-primary transition-colors">+91 99866 19282</a>
                            </li>
                            <li className="flex items-center gap-3 text-slate-500 text-sm">
                                <Mail size={18} className="text-primary shrink-0" />
                                <a href="mailto:crsurajjain@gmail.com" className="hover:text-primary transition-colors">crsurajjain@gmail.com</a>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="font-heading font-bold text-slate-900 mb-6">Stay Updated</h3>
                        <p className="text-slate-500 text-sm mb-4">Subscribe to our newsletter for the latest arrivals and offers.</p>
                        <form className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Your email"
                                className="bg-white border border-slate-200 text-slate-900 text-sm rounded-lg px-4 py-2 w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                            <button type="submit" className="bg-primary hover:bg-primary-hover text-white p-2 rounded-lg transition-colors">
                                <ArrowRight size={20} />
                            </button>
                        </form>
                    </div>
                </div>

                <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-400 text-sm">© {currentYear} Jain Autocars. All rights reserved.</p>
                    <div className="flex gap-6 text-sm text-slate-400">
                        <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
