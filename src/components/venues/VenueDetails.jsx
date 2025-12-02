import React, { useState, useMemo } from 'react'; // Added useMemo
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, MapPin, Star, Phone, Mail, User, Clock,
    Calendar, Trophy, Coffee, LayoutGrid, Shield, Info
} from 'lucide-react';

const IMG_BASE_URL = "https://backend.rshqa.com/media/";

const VenueDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // 1. Extract venueData AND daysList from location state
    const { venueData: rawData, daysList = [] } = location.state || {};

    // Safely extract venue object
    const venue = rawData?.data || rawData;

    const [activeImage, setActiveImage] = useState(venue?.images?.[0]?.image || null);

    // 2. Create a helper to get Day Name based on the passed daysList
    // Falls back to a static map if daysList is empty (e.g., page refresh)
    const getDayName = (dayId) => {
        if (daysList && daysList.length > 0) {
            const day = daysList.find(d => d.id === dayId);
            if (day) {
                    return day.translations?.name || day.day || `Day ${dayId}`;
            }
        }

    };

    if (!venue) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <div className="text-gray-500 mb-4">No venue data found.</div>
                <button
                    onClick={() => navigate('/venues')}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                    Go Back to Venues
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            {/* --- Header / Navigation --- */}
            <div className="mb-6 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                    <ArrowLeft size={20} />
                    Back to Venues
                </button>
                <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        venue.is_active
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                        {venue.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        venue.venue_type === 'indoor'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                        {venue.venue_type}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- Left Column (Main Content) --- */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Hero Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="relative h-64 md:h-80 bg-gray-200">
                            <img
                                src={activeImage ? `${IMG_BASE_URL}${activeImage}` : 'https://via.placeholder.com/800x400?text=No+Image'}
                                alt={venue.translations?.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm flex items-center gap-1 font-bold text-yellow-600">
                                <Star size={16} fill="currentColor" />
                                <span>{venue.rate}</span>
                            </div>
                        </div>

                        {/* Thumbnail Strip */}
                        {venue.images && venue.images.length > 1 && (
                            <div className="flex gap-2 p-4 overflow-x-auto border-b border-gray-100">
                                {venue.images.map((img) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setActiveImage(img.image)}
                                        className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                                            activeImage === img.image ? 'border-primary-500 ring-2 ring-primary-100' : 'border-transparent opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        <img
                                            src={`${IMG_BASE_URL}${img.image}`}
                                            alt="Thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="p-6">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{venue.translations?.name}</h1>
                            <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm mb-6">
                                <div className="flex items-center gap-1">
                                    <MapPin size={16} />
                                    <span>{venue.city}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock size={16} />
                                    <span>{venue.available_from?.slice(0,5)} - {venue.available_to?.slice(0,5)}</span>
                                </div>
                            </div>

                            <div className="prose prose-sm max-w-none text-gray-600 bg-gray-50 p-4 rounded-xl">
                                <h3 className="text-gray-900 font-semibold mb-2 flex items-center gap-2">
                                    <Info size={18} /> Description
                                </h3>
                                <p className="whitespace-pre-wrap">{venue.translations?.description || "No description provided."}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sports & Amenities */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Trophy className="text-blue-500" /> Sports & Activities
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {venue.venue_play_type?.map((sport) => (
                                <div key={sport.id} className="flex flex-col items-center justify-center p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-center group hover:bg-blue-50 transition-colors">
                                    {sport.icon ? (
                                        <img src={`${IMG_BASE_URL}${sport.icon}`} alt={sport.translations?.name} className="w-10 h-10 mb-2 object-contain" />
                                    ) : (
                                        <Trophy className="w-8 h-8 text-blue-300 mb-2" />
                                    )}
                                    <span className="font-semibold text-gray-800 text-sm">{sport.translations?.name}</span>
                                </div>
                            ))}
                        </div>

                        {venue.amenites_info && venue.amenites_info.length > 0 && (
                            <>
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-t pt-6 border-gray-100">
                                    <LayoutGrid className="text-purple-500" /> Amenities
                                </h2>
                                <div className="flex flex-wrap gap-3">
                                    {venue.amenites_info.map((amenity) => (
                                        <div key={amenity.id} className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-100 rounded-lg text-purple-900 font-medium text-sm">
                                            {amenity.icon && <img src={`${IMG_BASE_URL}${amenity.icon}`} alt="" className="w-5 h-5 object-contain" />}
                                            {amenity.translations?.name}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Add-ons */}
                    {venue.venue_addons && venue.venue_addons.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Coffee className="text-orange-500" /> Available Add-ons
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {venue.venue_addons.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-orange-200 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center p-2">
                                                <img
                                                    src={`${IMG_BASE_URL}${item.addon.icon}`}
                                                    alt={item.addon.translations.name}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => { e.target.style.display='none'; }}
                                                />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800">{item.addon.translations.name}</div>
                                                <div className="text-xs text-gray-500">Min Order: {item.min_number}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-green-600">AED {item.price}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rules & Regulations */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Shield className="text-red-500" /> Rules & Policies
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">Venue Rules</h3>
                                <ul className="space-y-2">
                                    {venue.translations?.rules_and_regulations?.split('\n').map((rule, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></div>
                                            {rule}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">Booking Policies</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-gray-600">Cancellation Policy</span>
                                        <span className="font-medium text-gray-900">{venue.minimum_cancellation_hours}h notice</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-gray-600">Advance Booking</span>
                                        <span className="font-medium text-gray-900">{venue.advance_booking_days} days</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-gray-600">Split Payment</span>
                                        <span className={`font-medium ${venue.allow_split_booking ? 'text-green-600' : 'text-red-600'}`}>
                                            {venue.allow_split_booking ? 'Allowed' : 'Not Allowed'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {venue.translations?.cancellation_policy && (
                            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800">
                                <span className="font-bold">Specific Cancellation Note:</span> {venue.translations.cancellation_policy}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Right Column (Sidebar) --- */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Price Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <p className="text-gray-500 text-sm mb-1">Starting from</p>
                        <div className="text-4xl font-extrabold text-primary-600 flex items-center justify-center gap-1">
                            <span className="text-lg text-gray-400 font-normal">AED</span>
                            {venue.price_per_hour}
                            <span className="text-sm text-gray-400 font-normal">/hr</span>
                        </div>
                        {venue.min_price && (
                            <p className="text-xs text-gray-400 mt-2">Minimum spend: AED {venue.min_price}</p>
                        )}
                    </div>

                    {/* Contact Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b">Contact Information</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <User size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Contact Person</p>
                                    <p className="font-medium text-gray-900">{venue.contact_name || venue.owner_info?.contact_name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="font-medium text-gray-900">{venue.phone_number || venue.owner_info?.contact_phone}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="font-medium text-gray-900 break-all">{venue.email || venue.owner_info?.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b">Location</h3>
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                            {venue.translations?.address}<br/>
                            {venue.city}
                        </p>

                        {venue.latitude && venue.longitude && (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full h-40 bg-gray-100 rounded-xl overflow-hidden relative group border border-gray-200"
                            >
                                {/* Simulated Map Placeholder */}
                                <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] opacity-20 bg-center bg-cover"></div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/10 group-hover:bg-black/5 transition-colors">
                                    <MapPin size={32} className="text-red-500 drop-shadow-md mb-2" />
                                    <span className="text-xs font-bold text-gray-700 bg-white/80 px-2 py-1 rounded shadow-sm">
                                        Open in Maps
                                    </span>
                                </div>
                            </a>
                        )}
                    </div>

                    {/* Closed Days - USING DYNAMIC DATA */}
                    {venue.closed_days && venue.closed_days.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b flex items-center gap-2">
                                <Calendar size={16} /> Closed Days
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {venue.closed_days.map(dayId => (
                                    <span key={dayId} className="px-3 py-1 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100">
                                        {getDayName(dayId)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VenueDetails;