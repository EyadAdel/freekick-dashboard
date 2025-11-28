import React, { useState } from 'react';
import MainInput from './../MainInput.jsx'; // Adjust path if necessary
import {
    Type,
    DollarSign,
    Maximize,
    Image as ImageIcon,
    MapPin,
    Layers,
    Save
} from 'lucide-react';

const PitchesForm = () => {
    // 1. Initial State matching the flat inputs needed
    const [formData, setFormData] = useState({
        name: '',
        price_per_hour: '',
        size: '',
        venue: '',
        parent_pitch: '',
        image: '',
        is_active: true,
        is_primary: false,
    });

    const [errors, setErrors] = useState({});

    // 2. Generic Change Handler
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            // Handle checkboxes vs standard inputs
            [name]: type === 'checkbox' ? checked : value,
        }));

        // Clear specific error on change
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    // 3. Validation & Submit Handler
    const handleSubmit = (e) => {
        e.preventDefault();

        // A. Basic Validation
        const newErrors = {};
        if (!formData.name) newErrors.name = "Pitch Name is required";
        if (!formData.price_per_hour) newErrors.price_per_hour = "Price is required";
        if (!formData.size) newErrors.size = "Size is required";

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;

        // B. Data Transformation to match the specific JSON structure
        const payload = {
            translations: {
                name: formData.name, // Nested inside translations
            },
            is_active: formData.is_active,
            // Format to string decimal (e.g. "250.00")
            price_per_hour: parseFloat(formData.price_per_hour).toFixed(2),
            // Parse as Integer (or use BigInt if number is massive)
            size: parseInt(formData.size, 10),
            is_primary: formData.is_primary,
            image: formData.image || "string", // Default string if empty as per schema
            venue: parseInt(formData.venue || 0, 10),
            parent_pitch: parseInt(formData.parent_pitch || 0, 10)
        };

        // C. Output
        console.log("Form Submitted Successfully:", payload);
        alert("Check Console for Data Structure");
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">

                {/* Header */}
                <div className="bg-blue-600 px-8 py-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Layers className="text-blue-200" />
                        Create New Pitch
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">Fill in the details for the venue pitch.</p>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">

                    {/* Section: Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold border-b pb-2">
                            Basic Information
                        </h3>

                        <MainInput
                            label="Pitch Name"
                            name="name"
                            placeholder="e.g. Main Football Field A"
                            icon={Type}
                            value={formData.name}
                            onChange={handleChange}
                            error={errors.name}
                            required
                        />

                        <MainInput
                            label="Image URL"
                            name="image"
                            placeholder="https://example.com/pitch.jpg"
                            icon={ImageIcon}
                            value={formData.image}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Section: Details (Grid Layout) */}
                    <div className="space-y-4">
                        <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold border-b pb-2 mt-6">
                            Pitch Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <MainInput
                                label="Price Per Hour"
                                name="price_per_hour"
                                type="number"
                                placeholder="0.00"
                                icon={DollarSign}
                                value={formData.price_per_hour}
                                onChange={handleChange}
                                error={errors.price_per_hour}
                                min="0"
                                step="0.01"
                            />

                            <MainInput
                                label="Size (sqm)"
                                name="size"
                                type="number"
                                placeholder="e.g. 500"
                                icon={Maximize}
                                value={formData.size}
                                onChange={handleChange}
                                error={errors.size}
                                min="0"
                            />

                            <MainInput
                                label="Venue ID"
                                name="venue"
                                type="number"
                                placeholder="ID"
                                icon={MapPin}
                                value={formData.venue}
                                onChange={handleChange}
                            />

                            <MainInput
                                label="Parent Pitch ID"
                                name="parent_pitch"
                                type="number"
                                placeholder="ID (0 if none)"
                                icon={Layers}
                                value={formData.parent_pitch}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Section: Status */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3 border border-gray-100">
                        <MainInput
                            type="checkbox"
                            label="Is Active?"
                            name="is_active"
                            value={formData.is_active}
                            onChange={handleChange}
                            helperText="Visible to customers for booking"
                        />

                        <MainInput
                            type="checkbox"
                            label="Is Primary Pitch?"
                            name="is_primary"
                            value={formData.is_primary}
                            onChange={handleChange}
                            helperText="Set as the main pitch for this category"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all focus:ring-4 focus:ring-blue-200 shadow-md hover:shadow-lg"
                        >
                            <Save size={20} />
                            Save Pitch Data
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default PitchesForm;