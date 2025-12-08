import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ArrowIcon from "../../components/common/ArrowIcon.jsx";
import { toast } from 'react-toastify';
// Adjust the path below to where your service file is located
import { venuesEditRequestsService } from "../../services/venuesEditRequests/venuesEditRequestsService.js";
import { IMAGE_BASE_URL } from "../../utils/ImageBaseURL.js";
// Import the custom confirmation utility
import { showConfirm } from "../../components/showConfirm.jsx";

import {
    MapPin,
    Phone,
    Mail,
    Calendar,
    Clock,
    Shield,
    FileText,
    Layers,
    Briefcase,
    Info,
    AlertCircle,
    CheckCircle,
    XCircle
} from "lucide-react";

const VenueEditRequestDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // 1. Get data from useLocation
    const request = location.state?.data?.requestData || location.state?.requestData;
    const [isUpdating, setIsUpdating] = useState(false);

    // --- Handlers ---

    const handleAccept = async () => {
        if (!request?.id) return;

        setIsUpdating(true);
        try {
            // Call the accept endpoint
            await venuesEditRequestsService.acceptRequest(request.id);
            // Service handles success toast
            // Navigate back to the list after a short delay or immediately
            setTimeout(() => navigate(-1), 500);
        } catch (error) {
            console.error("Accept failed", error);
            setIsUpdating(false);
        }
    };

    const handleReject = async () => {
        if (!request?.id) return;

        // Use the custom SweetAlert confirm dialog
        const isConfirmed = await showConfirm({
            title: "Reject Request?",
            text: "Are you sure you want to reject this request? This will permanently delete the request.",
            confirmButtonText: "Yes, Reject it",
            icon: 'warning'
        });

        if (!isConfirmed) return;

        setIsUpdating(true);
        try {
            // Call the delete endpoint as requested
            await venuesEditRequestsService.deleteRequest(request.id);
            // Service handles success toast
            setTimeout(() => navigate(-1), 500);
        } catch (error) {
            console.error("Reject/Delete failed", error);
            setIsUpdating(false);
        }
    };

    // --- Helpers ---
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatAmount = (amount) => {
        const num = parseFloat(amount);
        if (isNaN(num)) return 'AED 0';
        return `AED ${Math.abs(num).toLocaleString()}`;
    };

    const formatTime = (time) => {
        if (!time) return 'N/A';
        return time.substring(0, 5); // 00:00
    };

    const handleWhatsAppClick = (phone) => {
        if (!phone) return;
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
    };

    const handleEmailClick = (email) => {
        if (!email) return;
        window.open(`mailto:${email}`, '_blank');
    };

    if (!request) {
        return <div className="p-10 text-center">No data found</div>;
    }

    // Access nested data safely
    const { translations, available_addons } = request;
    const enData = translations?.en || {};

    return (
        <div className="min-h-screen xl:px-5 bg-gray-50">
            {/* Header */}
            <div className="bg-white">
                <div className="mx-auto py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                        <ArrowIcon size={'lg'}/>
                        Back to Requests
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto py-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 gap-6">

                    {/* LEFT SIDEBAR */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">

                            {/* Profile Header */}
                            <div className="bg-primary-50 p-6 text-white">
                                <div className="flex flex-col items-center">
                                    <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center mb-3 border-4 border-white shadow-sm">
                                        <Shield className="w-12 h-12 text-primary-500" />
                                    </div>
                                    <h2 className="text-xl text-gray-900 font-bold text-center">{enData.name || 'No Name'}</h2>
                                    <div className="mt-3 flex gap-2">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                                            request.is_active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                                        }`}>
                                            {request.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize ${
                                            request.venue_type === 'indoor'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-amber-500 text-white'
                                        }`}>
                                            {request.venue_type || 'General'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Section */}
                            <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-100">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-primary-600">{formatAmount(request.price_per_hour)}</div>
                                    <div className="text-xs text-gray-500 mt-1">Per Hour</div>
                                </div>
                                <div className="text-center border-x border-gray-200">
                                    <div className="text-lg font-bold text-primary-600">
                                        {request.surface_type === 2 ? 'Synth' : 'Grass'}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Surface</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-primary-600">{request.city}</div>
                                    <div className="text-xs text-gray-500 mt-1">City</div>
                                </div>
                            </div>

                            {/* Additional Info List */}
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500">Working Hours</p>
                                        <p className="text-sm font-medium">{formatTime(request.available_from)} - {formatTime(request.available_to)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                                        <AlertCircle className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500">Cancellation</p>
                                        <p className="text-sm font-medium">{request.minimum_cancellation_hours} Hours prior</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500">Coordinates</p>
                                        <a
                                            href={`https://maps.google.com/?q=${request.latitude},${request.longitude}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm font-medium text-blue-600 hover:underline truncate block w-40"
                                        >
                                            {request.latitude?.toFixed(4)}, {request.longitude?.toFixed(4)}
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Person Section */}
                            <div className="p-6 border-t border-gray-100">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                                    Contact Person
                                </h4>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-lg">
                                        {request.contact_name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {request.contact_name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {request.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleWhatsAppClick(request.phone_number)}
                                        className="px-3 py-2.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                    >
                                        <Phone className="w-4 h-4" />
                                        WhatsApp
                                    </button>
                                    <button
                                        onClick={() => handleEmailClick(request.email)}
                                        className="px-3 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Email
                                    </button>
                                </div>
                            </div>

                            {/* Status Actions */}
                            <div className="p-6 pt-0 space-y-2">
                                {request.accepted === null ? (
                                    <>
                                        <button
                                            onClick={handleAccept}
                                            disabled={isUpdating}
                                            className="w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                                        >
                                            {isUpdating ? 'Processing...' : (
                                                <>
                                                    <CheckCircle className="w-4 h-4" /> Accept Request
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            disabled={isUpdating}
                                            className="w-full px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                                        >
                                            {isUpdating ? 'Processing...' : (
                                                <>
                                                    <XCircle className="w-4 h-4" /> Reject Request
                                                </>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <div className={`w-full px-4 py-3 rounded-lg text-center font-bold flex items-center justify-center gap-2 ${
                                        request.accepted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {request.accepted ? (
                                            <><CheckCircle className="w-5 h-5" /> Request Accepted</>
                                        ) : (
                                            <><XCircle className="w-5 h-5" /> Request Rejected</>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Created Date */}
                            <div className="p-6 pt-0">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Created {formatDate(request.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT CONTENT AREA */}
                    <div className="lg:col-span-2 2xl:col-span-3 space-y-6">

                        {/* Section 1: Venue Details */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                            <div className="p-4 px-6 w-full border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900">Venue Details</h3>
                            </div>
                            <div className="p-6">
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-5">
                                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Info className="w-4 h-4 text-primary-500" /> Basic Information
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase block mb-1">Name</span>
                                            <p className="font-medium text-gray-900">{enData.name || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase block mb-1">Address</span>
                                            <p className="text-sm text-gray-600">{enData.address || '-'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase block mb-1">Description</span>
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                {enData.description || 'No description provided.'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase block mb-1">Rules & Regulations</span>
                                            <div className="bg-white p-3 rounded border border-gray-200">
                                                <p className="text-sm text-gray-600 whitespace-pre-line">
                                                    {enData.rules_and_regulations || 'No specific rules provided.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Booking Configuration */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                            <div className="p-4 px-6 flex justify-between items-center border-b border-gray-100">
                                <h3 className="font-bold text-gray-900">Configuration</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 border border-gray-100 rounded-lg text-center hover:border-primary-200 transition-colors">
                                        <div className="text-gray-500 text-xs uppercase mb-1">Advance Booking</div>
                                        <div className="text-xl font-bold text-primary-600">{request.advance_booking_days} Days</div>
                                    </div>
                                    <div className="p-4 border border-gray-100 rounded-lg text-center hover:border-primary-200 transition-colors">
                                        <div className="text-gray-500 text-xs uppercase mb-1">Split Booking</div>
                                        <div className={`text-lg font-bold ${request.allow_split_booking ? 'text-green-600' : 'text-red-600'}`}>
                                            {request.allow_split_booking ? 'Allowed' : 'Denied'}
                                        </div>
                                    </div>
                                    <div className="p-4 border border-gray-100 rounded-lg text-center hover:border-primary-200 transition-colors">
                                        <div className="text-gray-500 text-xs uppercase mb-1">Recurring</div>
                                        <div className={`text-lg font-bold ${request.allow_recurring_booking ? 'text-green-600' : 'text-red-600'}`}>
                                            {request.allow_recurring_booking ? 'Allowed' : 'Denied'}
                                        </div>
                                    </div>
                                    <div className="p-4 border border-gray-100 rounded-lg text-center hover:border-primary-200 transition-colors">
                                        <div className="text-gray-500 text-xs uppercase mb-1">Play Type IDs</div>
                                        <div className="text-lg font-bold text-gray-700">
                                            {request.venue_play_type.join(', ')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Add-ons */}
                        <div className="bg-white mt-5 rounded-lg shadow-sm border border-gray-100">
                            <div className="lg:px-6 p-4 flex justify-between items-center border-b border-gray-100">
                                <h3 className="font-bold text-gray-900">Available Add-ons</h3>
                                <p className="text-xs text-gray-500 mt-1">Total : {available_addons?.length || 0} items</p>
                            </div>
                            <div className="p-6">
                                {available_addons && available_addons.length > 0 ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 gap-4">
                                        {available_addons.map((item, idx) => (
                                            <div key={item.id} className="relative flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 border border-gray-100">
                                                <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                                    {formatAmount(item.price)}
                                                </span>

                                                {item.addon?.icon ? (
                                                    <img
                                                        src={`${IMAGE_BASE_URL}${item.addon.icon}`}
                                                        alt={item.addon?.translations?.en?.name}
                                                        className="w-14 h-14 object-contain mb-2"
                                                        onError={(e) => {e.target.src = ''}}
                                                    />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold mb-2">
                                                        <Layers className="w-6 h-6" />
                                                    </div>
                                                )}

                                                <p className="text-sm font-bold text-gray-900 truncate w-full">
                                                    {item.addon?.translations?.en?.name || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Min Order: {item.min_number}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No add-ons available</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 4: Requested Images */}
                        <div className="bg-white mt-5 rounded-lg shadow-sm border border-gray-100">
                            <div className="lg:px-6 p-4 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900">Images Request</h3>
                            </div>
                            <div className="p-6">
                                {request.images_request && request.images_request.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {request.images_request.map((img, idx) => (
                                            <img
                                                key={idx}
                                                src={`${IMAGE_BASE_URL}${img.image || img}`}
                                                alt={`Request ${idx}`}
                                                className="w-full h-40 object-cover rounded-lg border border-gray-200"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No images submitted</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default VenueEditRequestDetails;