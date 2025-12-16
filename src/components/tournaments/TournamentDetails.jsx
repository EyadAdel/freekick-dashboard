import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from "react-redux";
import {
    Calendar, Clock, MapPin, Trophy,
    Share2, Award, BookOpen, LayoutGrid,
    CheckCircle, Edit, Shield, CheckCircle2,
    XCircle, Image as ImageIcon, Users, Activity,
    User, UserCircle, Phone, Mail
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

// --- Services ---
import { tournamentsService } from '../../services/tournaments/tournamentsService';
import { venuesService } from '../../services/venues/venuesService';
import { venueSportsService } from '../../services/venueSports/venueSportsService.js';
import { setPageTitle } from "../../features/pageTitle/pageTitleSlice.js";

// --- Utils ---
import { getImageUrl } from '../../utils/imageUtils';

// --- Hooks ---
import { useContact } from '../../hooks/useContact';

// --- Components ---
import ArrowIcon from '../../components/common/ArrowIcon';
import TournamentsForm from "../../components/tournaments/TournamentsForm.jsx";

// --- HELPER COMPONENTS ---

const Header = ({ onBack, onUpdate, isEditing, t }) => (
    <div className="bg-white shadow-sm z-10 relative">
        <div className="mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
            >
                <ArrowIcon className="w-8 h-8 transform rotate-90" />
                <span className="font-medium">{t('header.back')}</span>
            </button>

            {!isEditing && (
                <button
                    onClick={onUpdate}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                >
                    <Edit size={16} />
                    <span>{t('header.update')}</span>
                </button>
            )}
        </div>
    </div>
);

// --- UPDATED CARD COMPONENT ---
const TournamentProfileCard = ({ tournament, venueName, t, currentLang, onWhatsApp }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString(currentLang, {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString.substring(0, 5);
    };

    // Calculate total participants
    const teamsCount = tournament.joined_data?.filter(i => i.kind === 'team').length || 0;
    const soloFromMixed = tournament.joined_data?.filter(item => item.kind === 'user') || [];
    const directUsers = tournament.joined_user_data || [];
    const allPlayers = [...soloFromMixed, ...directUsers];
    const uniquePlayersCount = new Set(allPlayers.map(p => p.id)).size;

    const totalRegistered = teamsCount + uniquePlayersCount;
    const max = tournament.max_teams || 0;
    const percentage = max > 0 ? (totalRegistered / max) * 100 : 0;

    // Organizer Data
    const organizer = tournament.user || {};

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
            {/* Image Section */}
            <div className="relative h-64 w-full">
                {tournament.cover_image ? (
                    <img
                        src={getImageUrl(tournament.cover_image)}
                        alt={tournament.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center">
                        <Trophy size={64} className="text-white opacity-30" />
                    </div>
                )}

                <div className="hidden absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 items-center justify-center">
                    <Trophy size={64} className="text-white opacity-30" />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

                <div className="absolute top-4 right-4">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md shadow-sm ${
                        tournament.is_active ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
                    }`}>
                        {tournament.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {tournament.is_active ? t('status.active') : t('status.inactive')}
                    </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h2 className="text-2xl font-bold leading-tight mb-1 drop-shadow-md">
                        {tournament.name}
                    </h2>
                    {tournament.subtitle && (
                        <p className="text-sm text-gray-200 font-medium mb-2 drop-shadow-sm italic">
                            {tournament.subtitle}
                        </p>
                    )}
                    <div className="flex items-center gap-2 text-sm opacity-90">
                        <MapPin size={14} className="text-primary-300" />
                        <span className="truncate">{venueName || t('card.venue_id', { id: tournament.venue })}</span>
                    </div>
                </div>
            </div>

            {/* Dates */}
            <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center text-sm">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold mb-0.5">{t('card.start_date')}</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-1">
                        <Calendar size={14} className="text-primary-600"/> {formatDate(tournament.start_date)}
                    </span>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="flex flex-col text-right">
                    <span className="text-xs text-gray-500 uppercase font-bold mb-0.5">{t('card.end_date')}</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-1">
                        {formatDate(tournament.end_date)} <Calendar size={14} className="text-primary-600"/>
                    </span>
                </div>
            </div>

            {/* Time */}
            <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-center text-sm">
                <Clock size={14} className="text-gray-400 mr-2"/>
                <span className="text-gray-600 font-medium">
                    {t('card.daily')}: {formatTime(tournament.start_time)} - {formatTime(tournament.end_time)}
                </span>
            </div>

            {/* Fee */}
            <div className="p-6 text-center border-b border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">{t('card.entry_fee')}</p>
                <div className="text-3xl font-extrabold text-primary-600 flex items-center justify-center gap-1">
                    {parseFloat(tournament.entry_fee) > 0 ? (
                        <>
                            <span className="text-lg text-gray-400 font-medium">{t('card.currency')}</span>
                            {parseFloat(tournament.entry_fee).toLocaleString()}
                        </>
                    ) : (
                        t('card.free')
                    )}
                </div>
            </div>

            {/* Progress */}
            <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <Users size={14} className="text-blue-500"/> {t('card.registered_teams')}
                    </h3>
                    <span className="text-xs font-bold text-primary-600">
                        {totalRegistered} / {max}
                    </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                        className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                </div>
            </div>

            {/* --- Contact Details --- */}
            {organizer && (
                <div className="px-5 py-5 bg-white border-b border-gray-100 flex-grow">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        {t('card.contact_details') || "Organizer Contact"}
                    </h4>

                    {/* Organizer Info */}
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                            {organizer.image ? (
                                <img
                                    src={getImageUrl(organizer.image)}
                                    alt={organizer.name}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                            ) : null}
                            <div className="w-full h-full flex items-center justify-center" style={{ display: organizer.image ? 'none' : 'flex' }}>
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {organizer.name || "Organizer"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {t('card.role_organizer') || "Tournament Organizer"}
                            </p>
                        </div>
                    </div>

                    {/* Phone Display */}
                    {organizer.phone && (
                        <div className="flex items-center gap-3 p-2 rounded-lg mt-1 hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0 border border-green-100">
                                <Phone className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {organizer.phone}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Contact Buttons */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        {organizer.phone && (
                            <button
                                onClick={onWhatsApp}
                                className="w-full py-2.5 bg-green-50 hover:bg-green-100 text-green-700 font-medium rounded-lg border border-green-200 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <Phone size={16} />
                                {t('card.whatsapp') || "WhatsApp"}
                            </button>
                        )}
                        {organizer.email && (
                            <button className="mt-2 w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg border border-gray-200 transition-colors flex items-center justify-center gap-2 text-sm">
                                <Mail size={16} />
                                {t('card.email') || "Email"}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const TournamentGallery = ({ images, t }) => {
    const [activeImage, setActiveImage] = useState(images && images.length > 0 ? images[0].image : null);

    useEffect(() => {
        if (images && images.length > 0) {
            setActiveImage(images[0].image);
        }
    }, [images]);

    if (!images || images.length === 0) return null;

    return (
        <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="text-primary-600" size={20}/>
                {t('gallery.title')}
            </h3>

            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                <div className="relative h-[400px] w-full rounded-xl overflow-hidden group bg-gray-100">
                    <img
                        src={getImageUrl(activeImage)}
                        alt="Tournament Main"
                        className="w-full h-full object-contain md:object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                </div>

                {images.length > 1 && (
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-hide">
                        {images.map((img, idx) => (
                            <button
                                key={img.id || idx}
                                onClick={() => setActiveImage(img.image)}
                                className={`relative h-20 w-28 flex-shrink-0 rounded-lg overflow-hidden transition-all duration-300 border ${
                                    activeImage === img.image
                                        ? 'ring-2 ring-primary-500 ring-offset-2 opacity-100 border-primary-500'
                                        : 'opacity-70 hover:opacity-100 border-gray-200'
                                }`}
                            >
                                <img
                                    src={getImageUrl(img.image)}
                                    alt={`Thumb ${idx}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- UPDATED PARTICIPANTS SECTION (TEAMS AND PLAYERS CLICKABLE) ---
const TournamentParticipantsSection = ({ joinedData, joinedUserData, t }) => {
    const navigate = useNavigate();

    const teams = joinedData?.filter(item => item.kind === 'team') || [];
    const soloFromMixed = joinedData?.filter(item => item.kind === 'user') || [];
    const directUsers = joinedUserData || [];
    const allPlayers = [...soloFromMixed, ...directUsers];
    const uniquePlayers = Array.from(new Map(allPlayers.map(item => [item.id, item])).values());

    if (teams.length === 0 && uniquePlayers.length === 0) return null;

    // Navigation handler for players
    const handlePlayerClick = (player) => {
        navigate('/players/player-profile', {
            state: { player: player }
        });
    };

    // Navigation handler for teams
    const handleTeamClick = (team) => {
        navigate('/teams/team-profile', {
            state: { team: team }
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" /> {t('participants.title') || "Participants"}
                </h3>
            </div>

            <div className="p-6 space-y-8">
                {teams.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Trophy size={14} /> {t('participants.teams') || "Teams"} ({teams.length})
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {teams.map((team) => (
                                <div
                                    key={`team-${team.id}`}
                                    onClick={() => handleTeamClick(team)} // Team Click Handler
                                    className="flex flex-col items-center p-3 rounded-xl border border-gray-100 bg-gray-50 hover:shadow-md hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer group" // Added pointer and hover
                                >
                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-white border border-gray-200 group-hover:border-blue-200 mb-2">
                                        {team.image ? (
                                            <img src={getImageUrl(team.image)} alt={team.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                                <Trophy size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 text-center line-clamp-1">{team.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {teams.length > 0 && uniquePlayers.length > 0 && <div className="h-px bg-gray-100 w-full"></div>}

                {uniquePlayers.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <User size={14} /> {t('participants.players') || "Players"} ({uniquePlayers.length})
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {uniquePlayers.map((user) => (
                                <div
                                    key={`user-${user.id}`}
                                    onClick={() => handlePlayerClick(user)}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-primary-300 hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer group"
                                >
                                    <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 border border-gray-200 group-hover:border-primary-200">
                                        {user.image ? (
                                            <img src={getImageUrl(user.image)} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                                <UserCircle size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 line-clamp-1">{user.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const TournamentInfoSection = ({ tournament, sportName, t, currentLang }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary-500" /> {t('info.title')}
                </h3>
            </div>

            <div className="p-6 space-y-8">
                <div>
                    <p className="text-gray-600 text-sm leading-7 whitespace-pre-line">
                        {tournament.description || t('info.no_description')}
                    </p>
                </div>

                <div className="w-full h-px bg-gray-100"></div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                            <Trophy size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400">{t('info.system')}</p>
                            <p className="text-sm font-semibold text-gray-900 capitalize">
                                {tournament.scoring_system?.replace('_', ' ') || t('info.standard_system')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                            <Activity size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400">{t('info.sport')}</p>
                            <p className="text-sm font-semibold text-gray-900 capitalize">
                                {sportName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700">
                            <Clock size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400">{t('info.deadline')}</p>
                            <p className="text-sm font-semibold text-gray-900">
                                {new Date(tournament.registration_deadline).toLocaleDateString(currentLang)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                            <LayoutGrid size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400">{t('info.format')}</p>
                            <p className="text-sm font-semibold text-gray-900">
                                {t('info.teams_max', { count: tournament.max_teams })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TournamentRulesSection = ({ tournament, t }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-500" /> {t('rules.title')}
                </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 text-sm border-b pb-2 border-gray-100 flex items-center gap-2">
                        <Award size={16} className="text-amber-500"/> {t('rules.prizes_title')}
                    </h4>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-gray-700 whitespace-pre-line">
                        {tournament.prizes || t('rules.no_prizes')}
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 text-sm border-b pb-2 border-gray-100 flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500"/> {t('rules.regulations_title')}
                    </h4>
                    <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                        {tournament.rules || t('rules.default_rules')}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---

const TournamentDetails = () => {
    const { t, i18n } = useTranslation('tournamentDetails');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    // Use Contact Hook
    const { handleWhatsAppClick } = useContact();

    const tournamentId = location.state?.id || location.state?.tournamentData?.id;

    const [tournament, setTournament] = useState(null);
    const [venueName, setVenueName] = useState('');
    const [venuesList, setVenuesList] = useState([]);
    const [sportsList, setSportsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // --- Fetch Data ---
    useEffect(() => {
        const fetchTournamentDetails = async () => {
            if (!tournamentId) {
                toast.error(t('messages.no_selection'));
                navigate('/tournaments');
                return;
            }

            setLoading(true);
            try {
                const response = await tournamentsService.getById(tournamentId);
                const data = response.data || response;
                setTournament(data);
                dispatch(setPageTitle(`${data.name}`));

                try {
                    const sportsRes = await venueSportsService.getAll();
                    setSportsList(sportsRes.results || []);
                } catch (sportErr) {
                    console.warn("Could not fetch sports list", sportErr);
                }

                try {
                    const venuesRes = await venuesService.getAllVenues({ page_limit: 1000 });
                    const allVenues = venuesRes.results || venuesRes || [];
                    setVenuesList(allVenues);

                    if (data.venue) {
                        const foundVenue = allVenues.find(v => v.id === data.venue);
                        if (foundVenue) {
                            setVenueName(foundVenue.translations?.[i18n.language]?.name || foundVenue.translations?.name || foundVenue.name);
                        } else {
                            setVenueName(t('card.venue_id', { id: data.venue }));
                        }
                    }
                } catch (venueErr) {
                    console.warn("Could not fetch venue details", venueErr);
                    setVenueName(t('card.venue_id', { id: data.venue }));
                }

            } catch (error) {
                console.error("Error fetching tournament:", error);
                toast.error(t('messages.load_error'));
            } finally {
                setLoading(false);
            }
        };

        fetchTournamentDetails();
    }, [tournamentId, refreshKey, dispatch, navigate, i18n.language, t]);

    const getSportName = (sportId) => {
        if (!sportId) return 'N/A';
        const sport = sportsList.find(s => s.id === sportId);
        if (sport) {
            return sport.translations?.[i18n.language]?.name || sport.translations?.en?.name || sport.name || t('info.unknown_sport');
        }
        return t('info.sport_id', { id: sportId });
    };

    const handleUpdateSuccess = () => {
        setIsEditing(false);
        setRefreshKey(prev => prev + 1);
    };

    // Handler for Contact
    const handleContactOrganizer = () => {
        if (tournament?.user?.phone) {
            handleWhatsAppClick(tournament.user.phone, `Hello ${tournament.user.name}, I have a question regarding the tournament ${tournament.name}.`);
        } else {
            toast.error("No phone number available for this organizer.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!tournament) return null;

    if (isEditing) {
        const formattedVenues = venuesList.map(v => ({
            label: v.translations?.[i18n.language]?.name || v.translations?.name || v.name,
            value: v.id
        }));

        const formattedSports = sportsList.map(s => ({
            label: s.translations?.[i18n.language]?.name || s.translations?.en?.name || s.name,
            value: s.id
        }));

        return (
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto py-6 px-4 md:px-8">
                    <TournamentsForm
                        initialData={tournament}
                        venuesList={formattedVenues}
                        sportsList={formattedSports}
                        onCancel={() => setIsEditing(false)}
                        onSuccess={handleUpdateSuccess}
                    />
                </div>
            </div>
        );
    }

    const allImages = tournament.images && Array.isArray(tournament.images) ? tournament.images : [];

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <Header
                onBack={() => navigate('/tournaments')}
                onUpdate={() => setIsEditing(true)}
                isEditing={isEditing}
                t={t}
            />

            <div className="mx-auto py-6 px-4 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column */}
                    <div className="col-span-1">
                        <div className="sticky top-6 h-fit space-y-6">
                            <TournamentProfileCard
                                tournament={tournament}
                                venueName={venueName}
                                t={t}
                                currentLang={i18n.language}
                                onWhatsApp={handleContactOrganizer}
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <TournamentGallery images={allImages} t={t} />

                        <TournamentParticipantsSection
                            joinedData={tournament.joined_data}
                            joinedUserData={tournament.joined_user_data}
                            t={t}
                        />

                        <TournamentInfoSection
                            tournament={tournament}
                            sportName={getSportName(tournament.sport)}
                            t={t}
                            currentLang={i18n.language}
                        />
                        <TournamentRulesSection tournament={tournament} t={t} />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TournamentDetails;