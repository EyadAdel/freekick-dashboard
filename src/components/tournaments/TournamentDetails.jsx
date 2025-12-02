import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Calendar, Clock, MapPin, Trophy, DollarSign,
    ArrowLeft, Share2, Award, BookOpen, LayoutGrid,
    CheckCircle, Hash, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { tournamentsService } from '../../services/tournaments/tournamentsService';
import { venuesService } from '../../services/venues/venuesService';
import { toast } from 'react-toastify';
import {useDispatch} from "react-redux";
import {setPageTitle} from "../../features/pageTitle/pageTitleSlice.js";

const TournamentDetails = () => {
    const dispatch = useDispatch();



    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // 1. Initialize State with passed data (Tournament + Venue Name)
    const initialTournament = location.state?.tournamentData || null;
    const initialVenueName = location.state?.venueName || '';
    useEffect(() => {
        dispatch(setPageTitle(`${initialTournament.name}`));
    }, [dispatch]);
    const [tournament, setTournament] = useState(initialTournament);
    const [venueName, setVenueName] = useState(initialVenueName);
    const [loading, setLoading] = useState(!initialTournament);
    const [activeTab, setActiveTab] = useState('overview');

    // Lightbox State
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // 2. Fetch Data
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                let currentData = tournament;

                // A. Fetch Tournament Details if not passed via state
                if (!currentData && id) {
                    setLoading(true);
                    const response = await tournamentsService.getById(id);
                    currentData = response.data || response;
                    setTournament(currentData);
                }

                // B. Fetch Venue Name ONLY if we don't have it (Fallback)
                if (currentData && currentData.venue && !venueName) {
                    const venuesRes = await venuesService.getAllVenues();
                    const venuesList = venuesRes.results || venuesRes || [];
                    const foundVenue = venuesList.find(v => v.id === currentData.venue);

                    if (foundVenue) {
                        setVenueName(foundVenue.translations?.en?.name || foundVenue.name);
                    } else {
                        setVenueName(`Venue #${currentData.venue}`);
                    }
                }

            } catch (error) {
                console.error("Error loading details:", error);
                if (!tournament) {
                    toast.error("Could not load tournament details");
                    navigate('/tournaments');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id, navigate, tournament, venueName]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!tournament) return null;

    // --- Helpers ---
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const today = new Date().toISOString().split('T')[0];
        const dateObj = new Date(`${today}T${timeString}`);
        if(isNaN(dateObj.getTime())) return timeString.substring(0, 5);
        return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const StatusBadge = ({ isActive }) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
            isActive
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
        }`}>
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );

    // --- Gallery Logic ---
    const allImages = tournament.images && Array.isArray(tournament.images) ? tournament.images : [];

    const openLightbox = (index) => {
        setCurrentImageIndex(index);
        setLightboxOpen(true);
    };

    const nextImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12 font-sans text-secondary-600">

            {/* --- HERO / BANNER SECTION --- */}
            <div className="relative bg-white shadow-sm">

                {/* 1. Background Image Container */}
                <div className="h-64 md:h-80 w-full overflow-hidden relative">
                    {!tournament.cover_image ? (
                        <img
                            src={tournament.cover_image}
                            alt={tournament.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/1200x400?text=No+Cover+Image';
                            }}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center">
                            <Trophy size={64} className="text-white opacity-30" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                    <button
                        onClick={() => navigate('/tournaments')}
                        className="absolute top-6 left-6 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-2 rounded-full transition-all"
                    >
                        <ArrowLeft size={24} />
                    </button>
                </div>

                {/* 2. Floating Info Card */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-20 z-10">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">

                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <StatusBadge isActive={tournament.is_active} />
                                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    <Hash size={12} /> {tournament.code || 'NO-CODE'}
                                </span>
                                {tournament.private && (
                                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-200">
                                        Private
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">{tournament.name}</h1>
                            {tournament.subtitle && (
                                <p className="text-lg text-primary-600 font-medium">{tournament.subtitle}</p>
                            )}

                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={16} className="text-primary-500" />
                                    <span>{venueName || `Venue ID: ${tournament.venue}`}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Trophy size={16} className="text-primary-500" />
                                    <span className="capitalize">{tournament.scoring_system?.replace('_', ' ')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 min-w-[140px]">
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Entry Fee</p>
                                <p className="text-2xl font-bold text-primary-600">
                                    {parseFloat(tournament.entry_fee) > 0
                                        ? `AED ${parseFloat(tournament.entry_fee).toLocaleString()}`
                                        : 'Free'}
                                </p>
                            </div>
                            <button className="flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors text-sm font-medium">
                                <Share2 size={16} /> Share Tournament
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- TABS --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">
                        {['Overview', 'Rules & Prizes', 'Gallery'].map((tab) => {
                            const key = tab.toLowerCase().split(' ')[0];
                            const isActive = activeTab === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`
                                        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                        ${isActive
                                        ? 'border-primary-600 text-primary-700'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                    `}
                                >
                                    {tab}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* --- MAIN CONTENT GRID --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Tab Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8 animate-fade-in">
                                <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-bold text-secondary-600 mb-4 flex items-center gap-2">
                                        <BookOpen size={20} className="text-primary-500" /> About Tournament
                                    </h3>
                                    <div className="prose text-gray-600 leading-relaxed whitespace-pre-line">
                                        {tournament.description || "No description provided."}
                                    </div>
                                </section>

                                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-primary-50 rounded-xl p-5 border border-primary-100 flex items-start gap-4">
                                        <div className="bg-white p-2 rounded-lg text-primary-600 shadow-sm">
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-primary-700 uppercase">Dates</p>
                                            <p className="font-semibold text-gray-900 mt-1">{formatDate(tournament.start_date)}</p>
                                            <p className="text-sm text-gray-500">to {formatDate(tournament.end_date)}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl p-5 border border-gray-200 flex items-start gap-4">
                                        <div className="bg-gray-100 p-2 rounded-lg text-gray-600">
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase">Daily Schedule</p>
                                            <p className="font-semibold text-gray-900 mt-1">
                                                {formatTime(tournament.start_time)} - {formatTime(tournament.end_time)}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* RULES TAB */}
                        {activeTab === 'rules' && (
                            <div className="space-y-8 animate-fade-in">
                                <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <Award size={100} />
                                    </div>
                                    <h3 className="text-lg font-bold text-secondary-600 mb-4 flex items-center gap-2">
                                        <Award size={20} className="text-primary-500" /> Prizes & Awards
                                    </h3>
                                    <div className="prose text-gray-600 whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        {tournament.prizes || "No prize details listed."}
                                    </div>
                                </section>

                                <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-bold text-secondary-600 mb-4 flex items-center gap-2">
                                        <CheckCircle size={20} className="text-primary-500" /> Rules & Regulations
                                    </h3>
                                    <div className="text-gray-600 whitespace-pre-line leading-relaxed">
                                        {tournament.rules || "Standard tournament rules apply."}
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* GALLERY TAB */}
                        {activeTab === 'gallery' && (
                            <div className="animate-fade-in bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-secondary-600 mb-6 flex items-center gap-2">
                                    <LayoutGrid size={20} className="text-primary-500" /> Tournament Gallery
                                </h3>

                                {allImages.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {allImages.map((imgObj, index) => (
                                            <div
                                                key={imgObj.id || index}
                                                onClick={() => openLightbox(index)}
                                                className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100 border border-gray-200"
                                            >
                                                <img
                                                    src={imgObj.image}
                                                    alt={`Gallery ${index}`}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                    <div className="opacity-0 group-hover:opacity-100 bg-white/90 p-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                                        <LayoutGrid size={20} className="text-primary-600" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                        <LayoutGrid className="mx-auto h-12 w-12 text-gray-300" />
                                        <h3 className="mt-2 text-sm font-semibold text-gray-900">No images</h3>
                                        <p className="mt-1 text-sm text-gray-500">There are no gallery images for this tournament.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Sidebar Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Registration Info</h4>

                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600">Max Teams</span>
                                <span className="font-bold text-secondary-600">{tournament.max_teams}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                                <div className="bg-primary-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-100">
                                <div className="flex items-start gap-3">
                                    <Calendar size={18} className="text-primary-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Registration Deadline</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatDate(tournament.registration_deadline)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <DollarSign size={18} className="text-primary-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Entry Fee</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {parseFloat(tournament.entry_fee) <= 0 ? "Free" : `AED ${parseFloat(tournament.entry_fee)}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-secondary-600 to-indigo-900 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h4 className="font-bold text-lg mb-2">Need Help?</h4>
                                <p className="text-indigo-100 text-sm mb-4">
                                    Contact the venue administration for more details about this tournament.
                                </p>
                                <button className="w-full py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-sm font-medium transition-colors">
                                    Contact Organizer
                                </button>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- LIGHTBOX MODAL --- */}
            {lightboxOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={() => setLightboxOpen(false)}>
                    <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white p-2">
                        <X size={32} />
                    </button>
                    <button onClick={prevImage} className="absolute left-4 text-white/70 hover:text-white p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all">
                        <ChevronLeft size={32} />
                    </button>
                    <div className="max-w-5xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={allImages[currentImageIndex].image}
                            alt="Full View"
                            className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl"
                        />
                        <div className="text-center mt-4 text-white/60 text-sm">
                            Image {currentImageIndex + 1} of {allImages.length}
                        </div>
                    </div>
                    <button onClick={nextImage} className="absolute right-4 text-white/70 hover:text-white p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all">
                        <ChevronRight size={32} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default TournamentDetails;