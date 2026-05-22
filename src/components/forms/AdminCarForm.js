import React, { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../../firebase/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import PropTypes from 'prop-types';
import {
    X, Check, ChevronDown, Star, ImagePlus, Plus, Trash2, GripVertical,
} from 'lucide-react';
import ImageUpload from './ImageUpload';
import EditorialCarCard from '../cars/EditorialCarCard';

const BODY_TYPES = ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Crossover', 'Coupe', 'Convertible', 'Van', 'Pickup'];
const FUELS = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'];
const TRANSMISSIONS = ['Manual', 'Automatic'];
const OWNERS = ['1st Owner', '2nd Owner', '3rd Owner', '4th Owner', '5th Owner'];
const INSURANCES = ['Comprehensive', 'Third-Party', 'Expired', 'Not Available'];
const STATUSES = [
    { id: 'Available', l: 'Available' },
    { id: 'Reserved', l: 'Reserved' },
    { id: 'Sold', l: 'Sold' },
];
const SUGGESTED_FEATURES = ['Sunroof', 'Alloy wheels', 'Touchscreen', 'Heated seats', 'HUD', '360° camera'];

const initialState = {
    make: '', model: '', year: '', price: '', bodyType: 'Sedan',
    status: 'Available', featured: false,
    kilometers: '', fuelType: 'Petrol', transmission: 'Automatic',
    engineSize: '', exteriorColor: '', owner: '1st Owner',
    registrationState: '', insurance: 'Comprehensive',
    videoUrl: '', description: '',
};

const FieldSection = ({ kicker, title, children }) => (
    <section>
        <div className="flex items-end justify-between mb-4">
            <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">{kicker}</div>
                <h3 className="font-display text-[20px] sm:text-[22px] leading-tight mt-1.5 text-ink">{title}</h3>
            </div>
        </div>
        {children}
    </section>
);

const TextField = ({ label, value, onChange, placeholder, type = 'text', step, required = false, name }) => (
    <label className="block rounded-2xl border border-ink/15 px-4 py-2.5 focus-within:border-ink transition-colors bg-white/60">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">{label}</div>
        <input
            type={type}
            name={name}
            step={step}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className="w-full bg-transparent text-[15px] py-1 placeholder:text-ink-faint outline-none border-0 focus:ring-0 focus:border-0 p-0 mt-1 text-ink"
        />
    </label>
);

const SelectField = ({ label, value, onChange, options, labels, required = false }) => (
    <label className="block rounded-2xl border border-ink/15 px-4 py-2.5 focus-within:border-ink transition-colors bg-white/60 relative">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">{label}</div>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className="w-full bg-transparent text-[15px] py-1 appearance-none cursor-pointer outline-none border-0 focus:ring-0 focus:border-0 p-0 mt-1 text-ink pr-6"
        >
            {options.map((o) => (
                <option key={o} value={o}>
                    {labels ? labels[o] || o : o}
                </option>
            ))}
        </select>
        <ChevronDown size={13} className="absolute right-3 bottom-3 text-ink-muted pointer-events-none" />
    </label>
);

const AdminCarForm = ({ editingCar, setEditingCar, onCarUpdated, onClose }) => {
    const [carDetails, setCarDetails] = useState(initialState);
    const [imageUrls, setImageUrls] = useState([]);
    const [features, setFeatures] = useState([]);
    const [featureInput, setFeatureInput] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (editingCar) {
            setCarDetails({
                make: editingCar.make || '',
                model: editingCar.model || '',
                year: editingCar.year || '',
                price: editingCar.price || '',
                bodyType: editingCar.bodyType || 'Sedan',
                status: editingCar.status || 'Available',
                featured: !!editingCar.featured,
                kilometers: editingCar.kilometers ?? editingCar.mileage ?? '',
                fuelType: editingCar.fuelType || 'Petrol',
                transmission: editingCar.transmission || 'Automatic',
                engineSize: editingCar.engineSize || '',
                exteriorColor: editingCar.exteriorColor || '',
                owner: editingCar.owner || '1st Owner',
                registrationState: editingCar.registrationState || '',
                insurance: editingCar.insurance || 'Comprehensive',
                videoUrl: editingCar.videoUrl || '',
                description: editingCar.description || '',
            });
            setImageUrls(editingCar.imageUrls || []);
            setFeatures(
                Array.isArray(editingCar.features)
                    ? editingCar.features
                    : (editingCar.features || '').split(',').map((s) => s.trim()).filter(Boolean)
            );
        } else {
            setCarDetails(initialState);
            setImageUrls([]);
            setFeatures([]);
        }
    }, [editingCar]);

    const upd = (k, v) => setCarDetails((prev) => ({ ...prev, [k]: v }));

    const addFeature = (raw) => {
        const v = (raw || '').trim().replace(/,/g, '');
        if (!v) return;
        if (features.includes(v)) {
            setFeatureInput('');
            return;
        }
        setFeatures((f) => [...f, v]);
        setFeatureInput('');
    };

    const removeFeature = (chip) => setFeatures((f) => f.filter((x) => x !== chip));

    const handleFeatureKey = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addFeature(featureInput);
        } else if (e.key === 'Backspace' && !featureInput && features.length) {
            setFeatures((f) => f.slice(0, -1));
        }
    };

    const handleImageUploadSuccess = (urls) => setImageUrls((prev) => [...prev, ...urls]);
    const handleImageDelete = (idx) => setImageUrls((prev) => prev.filter((_, i) => i !== idx));

    const dragIndex = useRef(null);
    const handleImageDragStart = (e, idx) => {
        dragIndex.current = idx;
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleImageDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    const handleImageDrop = (e, dropIdx) => {
        e.preventDefault();
        const from = dragIndex.current;
        dragIndex.current = null;
        if (from == null || from === dropIdx) return;
        setImageUrls((prev) => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(dropIdx, 0, moved);
            return next;
        });
    };

    const previewCar = useMemo(
        () => ({
            id: editingCar?.id || 'preview',
            make: carDetails.make || 'Make',
            model: carDetails.model || 'Model goes here',
            year: carDetails.year || '—',
            price: Number(carDetails.price) || 0,
            fuelType: carDetails.fuelType,
            transmission: carDetails.transmission,
            kilometers: Number(carDetails.kilometers) || 0,
            bodyType: carDetails.bodyType,
            imageUrls,
            status: carDetails.status,
            featured: carDetails.featured,
            ownership: carDetails.owner,
        }),
        [editingCar?.id, carDetails, imageUrls]
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (imageUrls.length === 0) {
            alert('Please upload at least one image for the car.');
            return;
        }
        setSubmitting(true);

        const carDataToSave = {
            ...carDetails,
            imageUrls,
            price: Number(carDetails.price),
            year: Number(carDetails.year),
            kilometers: Number(carDetails.kilometers),
            featured: !!carDetails.featured,
            status: carDetails.status || 'Available',
            features,
        };

        try {
            if (editingCar) {
                await updateDoc(doc(db, 'cars', editingCar.id), carDataToSave);
            } else {
                await addDoc(collection(db, 'cars'), {
                    ...carDataToSave,
                    views: 0,
                    createdAt: serverTimestamp(),
                });
            }
            setCarDetails(initialState);
            setImageUrls([]);
            setFeatures([]);
            setEditingCar(null);
            onCarUpdated();
        } catch (error) {
            console.error('Error saving car:', error);
            alert('Error saving car. Please check the console for details.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-ivory text-ink w-full max-w-4xl rounded-t-3xl md:rounded-3xl overflow-hidden border border-ink/10 shadow-2xl flex flex-col max-h-[100vh] md:max-h-[92vh]">
            <div className="sticky top-0 bg-ivory border-b border-ink/10 px-6 md:px-8 py-5 flex items-center justify-between gap-3 z-10">
                <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                        — {editingCar ? 'Editing listing' : 'New listing'}
                    </div>
                    <h2 className="font-display text-[28px] md:text-[36px] leading-tight tracking-tightest mt-1.5 text-ink">
                        {editingCar ? `Edit ${editingCar?.make || 'vehicle'}` : 'Add new'}{' '}
                        <em className="italic text-champagne">vehicle.</em>
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="shrink-0 w-10 h-10 rounded-full border border-ink/15 flex items-center justify-center hover:bg-ink hover:text-ivory transition-colors text-ink"
                >
                    <X size={15} />
                </button>
            </div>

            <form
                onSubmit={handleSubmit}
                id="adminCarForm"
                className="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-9"
            >
                <FieldSection kicker="01 · Basic info" title="What is it?">
                    <div className="grid sm:grid-cols-2 gap-3">
                        <TextField label="Make" value={carDetails.make} onChange={(v) => upd('make', v)} placeholder="e.g. BMW" required name="make" />
                        <TextField label="Model" value={carDetails.model} onChange={(v) => upd('model', v)} placeholder="e.g. 5 Series 530d M Sport" required name="model" />
                        <TextField label="Year" value={carDetails.year} onChange={(v) => upd('year', v)} type="number" placeholder="2022" required name="year" />
                        <TextField label="Price (₹)" value={carDetails.price} onChange={(v) => upd('price', v)} type="number" step="1" placeholder="5840000" required name="price" />
                        <SelectField label="Body type" value={carDetails.bodyType} onChange={(v) => upd('bodyType', v)} options={BODY_TYPES} required />
                    </div>
                </FieldSection>

                <FieldSection kicker="02 · Listing status" title="Visibility on the site">
                    <div className="grid sm:grid-cols-2 gap-3 items-start">
                        <SelectField
                            label="Status"
                            value={carDetails.status}
                            onChange={(v) => upd('status', v)}
                            options={STATUSES.map((s) => s.id)}
                            labels={STATUSES.reduce((m, s) => { m[s.id] = s.l; return m; }, {})}
                            required
                        />
                        <label className="flex items-center justify-between rounded-2xl border border-ink/15 px-4 py-3.5 bg-white/60 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${carDetails.featured ? 'bg-champagne text-ink' : 'bg-ink/5 text-ink-muted'}`}>
                                    <Star size={14} fill={carDetails.featured ? 'currentColor' : 'none'} />
                                </span>
                                <div>
                                    <div className="text-[13.5px] font-medium text-ink">Feature on homepage</div>
                                    <div className="text-[11.5px] text-ink-muted">Show in the "Featured vehicles" carousel.</div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => upd('featured', !carDetails.featured)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${carDetails.featured ? 'bg-ink' : 'bg-ink/20'}`}
                                aria-pressed={carDetails.featured}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-ivory transition-transform ${carDetails.featured ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </button>
                        </label>
                    </div>
                </FieldSection>

                <FieldSection kicker="03 · Specifications" title="The technical detail">
                    <div className="grid sm:grid-cols-2 gap-3">
                        <TextField label="Kilometers driven" value={carDetails.kilometers} onChange={(v) => upd('kilometers', v)} type="number" placeholder="24300" required name="kilometers" />
                        <TextField label="Engine size" value={carDetails.engineSize} onChange={(v) => upd('engineSize', v)} placeholder="2,993 cc · 6-cyl Turbo" name="engineSize" />
                        <SelectField label="Fuel type" value={carDetails.fuelType} onChange={(v) => upd('fuelType', v)} options={FUELS} required />
                        <SelectField label="Transmission" value={carDetails.transmission} onChange={(v) => upd('transmission', v)} options={TRANSMISSIONS} required />
                        <SelectField label="Ownership" value={carDetails.owner} onChange={(v) => upd('owner', v)} options={OWNERS} required />
                        <TextField label="Exterior color" value={carDetails.exteriorColor} onChange={(v) => upd('exteriorColor', v)} placeholder="Mineral White Metallic" name="exteriorColor" />
                    </div>
                </FieldSection>

                <FieldSection kicker="04 · Registration & insurance" title="Paperwork">
                    <div className="grid sm:grid-cols-2 gap-3">
                        <TextField label="Registration state" value={carDetails.registrationState} onChange={(v) => upd('registrationState', v)} placeholder="KA-09" name="registrationState" />
                        <SelectField label="Insurance" value={carDetails.insurance} onChange={(v) => upd('insurance', v)} options={INSURANCES} />
                    </div>
                </FieldSection>

                <FieldSection kicker="05 · Description & media" title="Tell the story">
                    <div className="mb-4">
                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint mb-2">Features</div>
                        <div className="rounded-2xl border border-ink/15 bg-white/60 px-3 py-2.5 flex items-center flex-wrap gap-2 min-h-[52px] focus-within:border-ink transition-colors">
                            {features.map((f) => (
                                <span key={f} className="inline-flex items-center gap-1.5 rounded-full bg-ink text-ivory px-2.5 py-1 text-[11.5px]">
                                    {f}
                                    <button
                                        type="button"
                                        onClick={() => removeFeature(f)}
                                        className="text-ivory/70 hover:text-ivory"
                                        aria-label={`Remove ${f}`}
                                    >
                                        <X size={11} />
                                    </button>
                                </span>
                            ))}
                            <input
                                value={featureInput}
                                onChange={(e) => setFeatureInput(e.target.value)}
                                onKeyDown={handleFeatureKey}
                                onBlur={() => addFeature(featureInput)}
                                placeholder="Type a feature, press Enter…"
                                className="flex-1 bg-transparent text-[13.5px] py-1 min-w-[140px] placeholder:text-ink-faint outline-none text-ink"
                            />
                        </div>
                        <div className="text-[11px] text-ink-faint mt-1.5">
                            Suggested:
                            {SUGGESTED_FEATURES.map((s) => (
                                <button
                                    type="button"
                                    key={s}
                                    onClick={() => addFeature(s)}
                                    className="ml-2 link-u text-ink-muted hover:text-ink"
                                >
                                    + {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mb-4">
                        <TextField label="Video URL" value={carDetails.videoUrl} onChange={(v) => upd('videoUrl', v)} placeholder="https://youtube.com/..." name="videoUrl" />
                    </div>

                    <div className="mb-4">
                        <label className="block rounded-2xl border border-ink/15 px-4 py-2.5 focus-within:border-ink transition-colors bg-white/60">
                            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">Description</div>
                            <textarea
                                name="description"
                                value={carDetails.description}
                                onChange={(e) => upd('description', e.target.value)}
                                rows={5}
                                required
                                placeholder="Describe the condition, ownership story, recent service work, anything a buyer should know..."
                                className="w-full bg-transparent text-[14.5px] py-1 placeholder:text-ink-faint resize-none outline-none border-0 focus:ring-0 focus:border-0 p-0 mt-1 text-ink"
                            />
                        </label>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">Photos</div>
                            <div className="text-[11px] text-ink-muted">JPG / PNG · drag to reorder · first is cover</div>
                        </div>
                        <div className="rounded-2xl border-2 border-dashed border-ink/20 bg-ivory-soft/40 p-7 text-center hover:bg-ivory-soft/70 transition-colors">
                            <div className="mx-auto w-12 h-12 rounded-full bg-ink text-champagne flex items-center justify-center">
                                <ImagePlus size={16} />
                            </div>
                            <div className="font-display text-[20px] leading-tight mt-3 text-ink">Add photos</div>
                            <div className="text-[12.5px] text-ink-muted mt-1">
                                Choose files from your computer to upload to Cloudinary.
                            </div>
                            <div className="mt-3 inline-flex items-center justify-center">
                                <ImageUpload onUploadSuccess={handleImageUploadSuccess} />
                            </div>
                        </div>

                        {imageUrls.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {imageUrls.map((url, index) => (
                                    <div
                                        key={`${url}-${index}`}
                                        draggable
                                        onDragStart={(e) => handleImageDragStart(e, index)}
                                        onDragOver={handleImageDragOver}
                                        onDrop={(e) => handleImageDrop(e, index)}
                                        className="relative group aspect-[4/3] rounded-xl overflow-hidden border border-ink/10 bg-ivory-soft cursor-grab active:cursor-grabbing"
                                    >
                                        <img src={url} alt={`car ${index + 1}`} className="w-full h-full object-cover" />
                                        {index === 0 && (
                                            <span className="absolute top-2 left-2 font-mono text-[9.5px] uppercase tracking-[0.16em] px-1.5 py-0.5 rounded bg-ivory/90 text-ink">
                                                Cover
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleImageDelete(index)}
                                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-ink/70 text-ivory backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                            title="Remove image"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                        <span className="absolute bottom-2 left-2 p-1 rounded bg-black/40 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <GripVertical size={11} />
                                        </span>
                                    </div>
                                ))}
                                <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-ink/15 bg-ivory/40 flex items-center justify-center text-ink-faint">
                                    <Plus size={18} />
                                </div>
                            </div>
                        )}
                    </div>
                </FieldSection>

                <FieldSection kicker="06 · Live preview" title="How it appears on the site">
                    <div className="rounded-3xl bg-ivory-soft/70 border border-ink/10 p-4 sm:p-6">
                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint mb-3">
                            — Inventory card preview
                        </div>
                        <div className="max-w-md mx-auto">
                            <EditorialCarCard car={previewCar} variant="grid" />
                        </div>
                    </div>
                </FieldSection>
            </form>

            <div className="sticky bottom-0 bg-ivory-soft border-t border-ink/10 px-6 md:px-8 py-4 flex items-center justify-between flex-wrap gap-3 z-10">
                <div className="text-[12px] text-ink-muted">
                    {editingCar ? (
                        <>Editing listing <span className="text-ink num">#{(editingCar.id || '').toString().slice(-6)}</span></>
                    ) : (
                        'New listings appear on the site immediately after saving.'
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-ink/15 px-4 py-2.5 text-[13px] text-ink hover:bg-ink hover:text-ivory transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="adminCarForm"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-full bg-ink text-ivory px-5 py-2.5 text-[13.5px] hover:bg-champagne-deep transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <Check size={13} /> {submitting ? 'Saving…' : editingCar ? 'Update vehicle' : 'Save vehicle'}
                    </button>
                </div>
            </div>
        </div>
    );
};

AdminCarForm.propTypes = {
    editingCar: PropTypes.object,
    setEditingCar: PropTypes.func.isRequired,
    onCarUpdated: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default AdminCarForm;
