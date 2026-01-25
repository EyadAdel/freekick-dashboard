import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setPageTitle } from '../../features/pageTitle/pageTitleSlice.js';
import MainTable from './../../components/MainTable';
import { Eye, Pencil, Trash2, TrendingUp, Plus, Users, CheckCircle, XCircle, MapPin, Image as ImageIcon, Calendar } from 'lucide-react';
import { tournamentsService } from '../../services/tournaments/tournamentsService.js';
import { venuesService } from '../../services/venues/venuesService.js';
import { venueSportsService } from '../../services/venueSports/venueSportsService.js';
import { showConfirm } from '../../components/showConfirm.jsx';
import TournamentsForm from '../../components/tournaments/TournamentsForm.jsx';
import StatCard from './../../components/Charts/StatCards.jsx';
import { IMAGE_BASE_URL } from '../../utils/ImageBaseURL.js';
import StatusManagementSection, { StatusBadge } from '../../components/StatusManagementSection';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next'; // Import translation hook

const Tournaments = () => {
    const { t, i18n } = useTranslation('tournamentPage'); // Initialize hook
    const rowsPerPage = 10;
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(setPageTitle(t('header.title')));
    }, [dispatch, t]);

    // --- STATE MANAGEMENT ---

    // 1. Table Data (Paginated)
    const [tableData, setTableData] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // 2. Global Data (For Stats & Status Sections - Unpaginated)
    const [allTournaments, setAllTournaments] = useState([]);

    // 3. Dropdown/Aux Data
    const [venuesData, setVenuesData] = useState([]);
    const [sportsData, setSportsData] = useState([]);

    // 4. Form State
    const [showForm, setShowForm] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState(null);

    // 5. Filters
    const [activeFilters, setActiveFilters] = useState({
        globalSearch: '',
        status: 'all',
        venue: 'all'
    });

    // --- API PARAMETERS PREPARATION ---
    const apiFilters = useMemo(() => ({
        page: currentPage,
        page_limit: rowsPerPage,
        search: activeFilters.globalSearch,
        venue: activeFilters.venue === 'all' ? undefined : activeFilters.venue,
        // Convert status string to boolean string for API or undefined
        is_active: activeFilters.status === 'all' ? undefined : (activeFilters.status === 'active' ? 'true' : 'false')
    }), [currentPage, rowsPerPage, activeFilters]);

    // --- FETCH DATA FUNCTIONS ---

    // 1. Fetch Paginated Data for Table
    const fetchTableData = async () => {
        setIsLoading(true);
        try {
            const response = await tournamentsService.getAll(apiFilters);
            if (response) {
                setTableData(response.results || []);
                setTotalItems(response.count || 0);
            }
        } catch (error) {
            console.error("Failed to fetch tournaments:", error);
            // setTableData([]); // Optional: clear table on error
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Fetch Global Data (Stats & Sections) & Aux Data (Venues/Sports)
    const fetchGlobalAndAuxData = async () => {
        try {
            const [allTournamentsRes, venuesRes, sportsRes] = await Promise.all([
                tournamentsService.getAll({ page_limit: 1000 }), // Fetch large batch for stats
                venuesService.getAllVenues({ page_limit: 1000 }),
                venueSportsService.getAll()
            ]);

            // Set Global Tournaments
            if (allTournamentsRes && allTournamentsRes.results) {
                setAllTournaments(allTournamentsRes.results);
            }

            // Set Venues
            if (venuesRes && venuesRes.results) {
                setVenuesData(venuesRes.results);
            }

            // Set Sports
            const rawSports = sportsRes.results || sportsRes || [];
            if (Array.isArray(rawSports)) {
                const currentLang = i18n.language;
                const formattedSports = rawSports.map(sport => ({
                    label: sport.translations?.[currentLang]?.name || sport.name || t('common.unknown_sport'),
                    value: sport.id
                }));
                setSportsData(formattedSports);
            }

        } catch (error) {
            console.error("Failed to fetch auxiliary data:", error);
        }
    };

    // 3. Helper to refresh just the global list (e.g., after status change)
    const fetchGlobalTournamentsOnly = async () => {
        try {
            const res = await tournamentsService.getAll({ page_limit: 1000 });
            if (res && res.results) setAllTournaments(res.results);
        } catch (error) {
            console.error("Failed to refresh global list", error);
        }
    };

    // --- EFFECTS ---

    // Initial Load
    useEffect(() => {
        fetchGlobalAndAuxData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [i18n.language]); // Refetch aux data to get correct translation for sports if lang changes

    // Fetch Table Data when filters/page change
    useEffect(() => {
        fetchTableData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiFilters]);

    // --- HELPERS ---
    const getVenueName = (venueId) => {
        if (!venueId) return 'N/A';
        const venue = venuesData.find(v => v.id === venueId);
        // Prioritize translation matching current language
        return venue?.translations?.[i18n.language]?.name || venue?.translations?.name || venue?.name || t('common.venue_fallback', { id: venueId });
    };

    // --- ACTION HANDLERS ---

    const handleViewDetails = (tournament) => {
        navigate(`/tournaments/tournament-details/${tournament.id}`);
    };

    const handleCreateTournament = () => {
        setSelectedTournament(null);
        setShowForm(true);
    };

    const handleEditTournament = async (tournament) => {
        setSelectedTournament(tournament);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setSelectedTournament(null);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedTournament(null);
        fetchTableData(); // Refresh table
        fetchGlobalTournamentsOnly(); // Refresh stats/sections
    };

    const handleDeleteTournament = async (id, name) => {
        const isConfirmed = await showConfirm({
            title: t('alerts.delete_title', { name }),
            text: t('alerts.delete_text'),
            confirmButtonText: t('alerts.delete_confirm')
        });

        if (!isConfirmed) return;

        try {
            await tournamentsService.delete(id);
            if (tableData.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            } else {
                fetchTableData();
            }
            fetchGlobalTournamentsOnly();
        } catch (error) {
            console.error("Failed to delete tournament:", error);
        }
    };

    const handleStatusUpdate = async (tournament, newStatus) => {
        const actionWord = newStatus ? t('actions.activate') : t('actions.deactivate');
        // We handle lowercase dynamically for the text body, though in Arabic it might not matter as much
        const actionWordLower = actionWord.toLowerCase();

        const isConfirmed = await showConfirm({
            title: t('alerts.status_title', { action: actionWord }),
            text: t('alerts.status_text', { action: actionWordLower, name: tournament.name }),
            confirmButtonText: t('alerts.status_confirm', { action: actionWord })
        });

        if (!isConfirmed) return;

        try {
            await tournamentsService.update(tournament.id, {
                ...tournament,
                is_active: newStatus
            });
            fetchTableData();
            fetchGlobalTournamentsOnly();
        } catch (error) {
            console.error(`Failed to update tournament status:`, error);
        }
    };

    // --- FILTER & PAGINATION HANDLERS ---

    const handleFilterChange = (newFilters) => {
        setActiveFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1); // Reset to page 1 on filter change
    };

    const handleSearch = (term) => {
        setActiveFilters(prev => ({ ...prev, globalSearch: term }));
        setCurrentPage(1);
    };

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    // --- STATS & DERIVED DATA ---

    // Derived Lists from Global Data
    const activeTournaments = useMemo(() => allTournaments.filter(t => t.is_active), [allTournaments]);
    const inactiveTournaments = useMemo(() => allTournaments.filter(t => !t.is_active), [allTournaments]);

    const stats = useMemo(() => {
        const total = allTournaments.length;
        const active = activeTournaments.length;
        const inactive = inactiveTournaments.length;
        const totalTeams = allTournaments.reduce((acc, curr) => acc + (parseInt(curr.max_teams) || 0), 0);
        return { total, active, inactive, totalTeams };
    }, [allTournaments, activeTournaments, inactiveTournaments]);

    // --- RENDER FUNCTIONS FOR STATUS SECTIONS ---
    const renderTournamentIcon = (item) => (
        <span className="text-white font-bold text-sm">{item.max_teams}</span>
    );

    const renderTournamentHeader = (item) => (
        <span className="font-bold text-gray-800 text-sm line-clamp-1" title={item.name}>
            {item.name}
        </span>
    );

    const renderTournamentMeta = (item) => (
        <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
                <MapPin size={10} />
                <span className="truncate max-w-[150px]">{getVenueName(item.venue)}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
                <Calendar size={10} />
                {/* Localize date */}
                <span>{new Date(item.start_date).toLocaleDateString(i18n.language)}</span>
            </div>
        </div>
    );

    // --- COLUMNS CONFIG ---
    const ActionButtons = ({ tournament }) => (
        <div className="flex justify-end items-center gap-1 sm:gap-2">
            <button
                className="text-gray-500 hover:text-teal-600 p-1 rounded transition-colors hover:bg-gray-50"
                title={t('actions.view_details')}
                onClick={() => handleViewDetails(tournament)}
            >
                <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
                className="text-gray-500 hover:text-blue-600 p-1 rounded transition-colors hover:bg-gray-50"
                title={t('actions.edit')}
                onClick={() => handleEditTournament(tournament)}
            >
                <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
                className="text-gray-500 hover:text-red-600 p-1 rounded transition-colors hover:bg-gray-50"
                onClick={() => handleDeleteTournament(tournament.id, tournament.name || `Tournament ${tournament.id}`)}
                title={t('actions.delete')}
            >
                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
        </div>
    );

    const columns = useMemo(() => [
        {
            header: t('table.sr_no'),
            accessor: 'id',
            align: 'left',
            width: '60px',
            render: (row, index) => <div className="text-gray-600 font-medium text-sm">{row.id}</div>
        },
        {
            header: t('table.info'),
            accessor: 'name',
            align: 'left',
            render: (row) => (
                <div className="flex items-center gap-3">
                    {row.cover_image ? (
                        <img
                            src={`${IMAGE_BASE_URL}${row.cover_image}`}
                            alt={row.name}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-100 shadow-sm flex-shrink-0 bg-gray-50"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/100x100?text=No+Img';
                            }}
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-400">
                            <ImageIcon size={20} />
                        </div>
                    )}

                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 text-sm line-clamp-1" title={row.name}>{row.name}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded w-fit mt-1">
                            {t('table.code')}: {row.code}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: t('table.venues'),
            accessor: 'venue',
            align: 'left',
            render: (row) => (
                <div className="flex items-center gap-1.5 text-gray-700">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-sm font-medium">{getVenueName(row.venue)}</span>
                </div>
            )
        },
        {
            header: t('table.timeline'),
            accessor: 'start_date',
            align: 'center',
            render: (row) => (
                <div className="flex flex-col text-xs sm:text-sm text-gray-600">
                    <span className="whitespace-nowrap">{t('table.start')}: {new Date(row.start_date).toLocaleDateString(i18n.language)}</span>
                    <span className="whitespace-nowrap">{t('table.end')}: {new Date(row.end_date).toLocaleDateString(i18n.language)}</span>
                </div>
            )
        },
        {
            header: t('table.max_teams'),
            accessor: 'max_teams',
            align: 'center',
            render: (row) => (
                <div className="flex items-center justify-center gap-1 text-gray-700 font-medium">
                    <Users size={14} className="text-blue-500" />
                    <span>{row.max_teams}</span>
                </div>
            )
        },
        {
            header: t('table.entry_fee'),
            accessor: 'entry_fee',
            align: 'center',
            render: (row) => (
                <span className="font-bold text-gray-800 text-sm">
                   {t('table.currency')} {parseFloat(row.entry_fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            header: t('table.status'),
            accessor: 'is_active',
            align: 'center',
            render: (row) => <StatusBadge isActive={row.is_active} />
        },
        {
            header: t('table.actions'),
            align: 'right',
            render: (row) => <ActionButtons tournament={row} />
        }
    ], [t, i18n.language, currentPage, venuesData]);

    const topActions = useMemo(() => [
        { label: t('actions.create'), onClick: handleCreateTournament, type: 'primary', icon: <Plus size={16} /> }
    ], [t]);

    const filterConfig = useMemo(() => [
        {
            key: 'status', label: t('filters.status_label'), type: 'select',
            options: [
                { label: t('filters.status_all'), value: 'all' },
                { label: t('filters.status_active'), value: 'active' },
                { label: t('filters.status_inactive'), value: 'inactive' }
            ],
            value: activeFilters.status
        },
        // {
        //     key: 'venue', label: t('filters.venue_label'), type: 'select',
        //     options: [
        //         { label: t('filters.venue_all'), value: 'all' },
        //         ...venuesData.map(v => ({
        //             label: v.translations?.[i18n.language]?.name || v.translations?.name || v.name,
        //             value: v.id
        //         }))
        //     ],
        //     value: activeFilters.venue
        // }
    ], [t, activeFilters, venuesData, i18n.language]);

    return (
        <div className="w-full px-2 sm:px-0">
            {showForm ? (
                // SHOW ONLY FORM (Create or Edit Mode)
                <div className='my-4 sm:my-8'>
                    <TournamentsForm
                        initialData={selectedTournament}
                        venuesList={venuesData.map(v => ({
                            label: v.translations?.[i18n.language]?.name || v.translations?.name || v.name,
                            value: v.id
                        }))}
                        sportsList={sportsData}
                        onCancel={handleCancelForm}
                        onSuccess={handleFormSuccess}
                    />
                </div>
            ) : (
                // SHOW DASHBOARD
                <>
                    {/* 1. Stat Cards */}
                    <div className="grid grid-cols-4 gap-3 sm:gap-6 my-4 sm:my-8">
                        <StatCard
                            title={t('stats.total_tournaments')}
                            value={stats.total}
                            icon={TrendingUp}
                            iconColor="text-blue-600"
                        />
                        <StatCard
                            title={t('stats.active')}
                            value={stats.active}
                            icon={CheckCircle}
                            iconColor="text-green-600"
                        />
                        <StatCard
                            title={t('stats.inactive')}
                            value={stats.inactive}
                            icon={XCircle}
                            iconColor="text-red-600"
                        />
                        <StatCard
                            title={t('stats.total_capacity')}
                            value={stats.totalTeams}
                            icon={Users}
                            iconColor="text-purple-600"
                        />
                    </div>

                    {/* 2. Status Management Sections (Side by Side) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                        {/* Active List (Approved) */}
                        <StatusManagementSection
                            title={t('status_section.active_title')}
                            name={{ single: t('status_section.single_item'), group: t('status_section.group_item') }}
                            items={activeTournaments}
                            statusType="approved"
                            emptyMessage={t('status_section.empty_active')}
                            onReject={(item) => handleStatusUpdate(item, false)} // Action: Deactivate
                            onItemClick={handleViewDetails} // <--- Added Click Handler
                            rejectLabel={t('status_section.reject_btn')}
                            renderIcon={renderTournamentIcon}
                            renderHeader={renderTournamentHeader}
                            renderMeta={renderTournamentMeta}
                        />
                        {/* Inactive List (Pending Approval) */}
                        <StatusManagementSection
                            title={t('status_section.inactive_title')}
                            name={{ single: t('status_section.single_item'), group: t('status_section.group_item') }}
                            items={inactiveTournaments}
                            statusType="pending"
                            emptyMessage={t('status_section.empty_inactive')}
                            onApprove={(item) => handleStatusUpdate(item, true)} // Action: Activate
                            onItemClick={handleViewDetails} // <--- Added Click Handler
                            approveLabel={t('status_section.approve_btn')}
                            renderIcon={renderTournamentIcon}
                            renderHeader={renderTournamentHeader}
                            renderMeta={renderTournamentMeta}
                        />
                    </div>

                    {/* 3. Main Table */}
                    {isLoading && tableData.length === 0 ? (
                        <div className="p-6 sm:p-10 text-center text-gray-500 text-sm sm:text-base">{t('common.loading')}</div>
                    ) : (
                        <MainTable
                            data={tableData}
                            columns={columns}
                            filters={filterConfig}
                            searchPlaceholder={t('filters.search_placeholder')}
                            topActions={topActions}
                            currentPage={currentPage}
                            totalItems={totalItems}
                            itemsPerPage={rowsPerPage}
                            onSearch={handleSearch}
                            onFilterChange={handleFilterChange}
                            onPageChange={handlePageChange}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default Tournaments;