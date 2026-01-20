import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import ImageUpload from './ImageUpload';
import PropTypes from 'prop-types';

const initialState = {
    make: '', model: '', price: '', year: '', mileage: '', description: '',
    engineSize: '', fuelType: '', transmission: '', features: '',
    exteriorColor: '', owner: '' // <-- Added owner field
};

const FormField = ({ name, label, placeholder, type = 'text', value, onChange, required = true }) => (
    <div className="px-4 w-full">
        <label className="block text-sm font-bold text-slate-700 mb-1 capitalize">{label || name}</label>
        <input
            type={type}
            name={name}
            placeholder={placeholder}
            className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-slate-900 focus:border-primary focus:ring-primary/20 transition-all"
            value={value}
            onChange={onChange}
            required={required}
        />
    </div>
);

const SelectField = ({ name, label, options, value, onChange }) => (
    <div className="px-4 w-full">
        <label className="block text-sm font-bold text-slate-700 mb-1 capitalize">{label || name}</label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            required
            className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-slate-900 focus:border-primary focus:ring-primary/20 transition-all"
        >
            <option value="">Select {label || name}</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);


const AdminCarForm = ({ editingCar, setEditingCar, onCarUpdated }) => {
    const [carDetails, setCarDetails] = useState(initialState);
    const [imageUrls, setImageUrls] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (editingCar) {
            setCarDetails({
                make: editingCar.make || '',
                model: editingCar.model || '',
                price: editingCar.price || '',
                year: editingCar.year || '',
                mileage: editingCar.mileage || '',
                description: editingCar.description || '',
                engineSize: editingCar.engineSize || '',
                fuelType: editingCar.fuelType || '',
                transmission: editingCar.transmission || '',
                features: Array.isArray(editingCar.features) ? editingCar.features.join(', ') : (editingCar.features || ''),
                exteriorColor: editingCar.exteriorColor || '',
                owner: editingCar.owner || ''
            });
            setImageUrls(editingCar.imageUrls || []);
        } else {
            setCarDetails(initialState);
            setImageUrls([]);
        }
    }, [editingCar]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCarDetails({ ...carDetails, [name]: value });
    };

    const handleImageUploadSuccess = (urls) => {
        setImageUrls(prevUrls => [...prevUrls, ...urls]);
    };

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
            mileage: Number(carDetails.mileage),
            features: carDetails.features.split(',').map(item => item.trim()).filter(Boolean),
            owner: carDetails.owner,
        };

        try {
            if (editingCar) {
                await updateDoc(doc(db, 'cars', editingCar.id), carDataToSave);
                alert('Car updated successfully!');
            } else {
                await addDoc(collection(db, 'cars'), { ...carDataToSave, createdAt: serverTimestamp() });
                alert('Car added successfully!');
            }
            setCarDetails(initialState);
            setImageUrls([]);
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
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 pb-4 border-b border-slate-100">
                {editingCar ? 'Edit Car Details' : 'Add New Car'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField name="make" value={carDetails.make} onChange={handleInputChange} placeholder="e.g., Toyota" />
                <FormField name="model" value={carDetails.model} onChange={handleInputChange} placeholder="e.g., Camry" />
                <FormField name="year" type="number" value={carDetails.year} onChange={handleInputChange} placeholder="e.g., 2021" />
                <FormField name="price" type="number" value={carDetails.price} onChange={handleInputChange} placeholder="e.g., 25000" />
                <FormField name="mileage" type="number" value={carDetails.mileage} onChange={handleInputChange} placeholder="e.g., 30000" />
                <FormField name="engineSize" value={carDetails.engineSize} onChange={handleInputChange} placeholder="e.g., 2.5L" />
                <SelectField name="fuelType" label="Fuel Type" value={carDetails.fuelType} onChange={handleInputChange} options={['Petrol', 'Gasoline', 'Diesel', 'Electric', 'Hybrid']} />
                <SelectField name="transmission" value={carDetails.transmission} onChange={handleInputChange} options={['Automatic', 'Manual']} />
                <SelectField name="owner" label="Owner" value={carDetails.owner} onChange={handleInputChange} options={['1st Owner', '2nd Owner', '3rd Owner', '4th Owner', '5th Owner']} />
                <FormField name="exteriorColor" label="Color" value={carDetails.exteriorColor} onChange={handleInputChange} placeholder="e.g., Silver, Blue" />
            </div>

            <div className="px-4">
                <FormField name="features" value={carDetails.features} onChange={handleInputChange} placeholder="e.g., Sunroof, Leather Seats (comma-separated)" />
            </div>

            <div className="px-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea
                    name="description"
                    placeholder="Enter car description"
                    className="w-full rounded-xl border-slate-200 bg-slate-50 p-4 text-slate-900 focus:border-primary focus:ring-primary/20 min-h-[120px]"
                    value={carDetails.description}
                    onChange={handleInputChange}
                    required
                ></textarea>
            </div>

            <div className="px-4">
                <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10">
                    <div className="text-center">
                        <p className="text-lg font-bold text-slate-900">Upload Car Images</p>
                        <p className="text-sm text-slate-500">Drag and drop or click to upload</p>
                    </div>
                    <ImageUpload onUploadSuccess={handleImageUploadSuccess} />
                    {imageUrls.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {imageUrls.map((url, index) => (
                                <img key={index} src={url} alt={`preview ${index}`} className="h-20 w-20 object-cover rounded-lg border border-slate-200 shadow-sm" />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end px-4 pt-4 border-t border-slate-100">
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-70"
                >
                    {submitting ? 'Saving...' : (editingCar ? 'Update Car' : 'Save Car')}
                </button>
            </div>
        </form>
    );
};

AdminCarForm.propTypes = {
    editingCar: PropTypes.object,
    setEditingCar: PropTypes.func.isRequired,
    onCarUpdated: PropTypes.func.isRequired,
};

export default AdminCarForm;