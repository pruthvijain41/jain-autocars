import React from 'react';
import InquiryForm from '../components/forms/InquiryForm';
import TestimonialForm from '../components/forms/TestimonialForm';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const ContactUsPage = () => {
    return (
        <div className="bg-surface-50 min-h-screen pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-4">Get in Touch</h1>
                    <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                        Have questions about a car or want to schedule a test drive? We're here to help.
                        Reach out to us using the form below or visit our showroom.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-soft transition-shadow duration-300">
                            <h2 className="text-2xl font-heading font-bold text-slate-900 mb-8">Contact Information</h2>
                            <div className="space-y-8">
                                <div className="flex items-start gap-5">
                                    <div className="bg-primary/10 p-4 rounded-2xl text-primary shrink-0">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-2 text-lg">Visit Us</h3>
                                        <p className="text-slate-600 leading-relaxed text-base">
                                            480, Chithrabhanu Rd, Kuvempu Nagara,<br />
                                            Mysuru, Karnataka 570023
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-5">
                                    <div className="bg-primary/10 p-4 rounded-2xl text-primary shrink-0">
                                        <Phone size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-2 text-lg">Call Us</h3>
                                        <p className="text-slate-600 text-base">
                                            <a href="tel:+919986619282" className="hover:text-primary transition-colors font-medium">+91 99866 19282</a>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-5">
                                    <div className="bg-primary/10 p-4 rounded-2xl text-primary shrink-0">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-2 text-lg">Email Us</h3>
                                        <p className="text-slate-600 text-base">
                                            <a href="mailto:crsurajjain@gmail.com" className="hover:text-primary transition-colors font-medium">crsurajjain@gmail.com</a>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-5">
                                    <div className="bg-primary/10 p-4 rounded-2xl text-primary shrink-0">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-2 text-lg">Opening Hours</h3>
                                        <p className="text-slate-600 text-base leading-relaxed">
                                            Mon - Sat: 9:00 AM - 8:00 PM<br />
                                            Sun: 10:00 AM - 5:00 PM
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Map */}
                        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 h-96 hover:shadow-soft transition-shadow duration-300">
                            <iframe
                                src="https://maps.google.com/maps?q=Jain+Autocars+Mysore&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                title="Jain Autocars Location"
                            ></iframe>
                        </div>
                    </div>

                    {/* Inquiry Form */}
                    <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300">
                        <InquiryForm />
                    </div>
                </div>

                {/* Testimonial Form Section */}
                <div className="max-w-4xl mx-auto">
                    <div className="bg-primary rounded-[2.5rem] p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                        {/* Decorative Circles */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl"></div>

                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">Share Your Experience</h2>
                            <p className="text-white/80 mb-10 max-w-2xl mx-auto text-lg">
                                Bought a car from us? We'd love to hear your feedback! Your review helps us improve and serve you better.
                            </p>
                            <div className="bg-white rounded-3xl p-8 text-left shadow-xl">
                                <TestimonialForm />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactUsPage;