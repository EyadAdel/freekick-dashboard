// src/pages/venue-data/SurfaceTypes.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch } from "react-redux";
import { setPageTitle } from "../../features/pageTitle/pageTitleSlice.js";
import MainTable from '../../components/MainTable.jsx';
import SurfaceTypesForm from '../../components/SurfaceTypes/SurfaceTypesForm.jsx';
import { surfaceTypesService } from '../../services/surfaceTypes/surfaceTypesService.js';
import { showConfirm } from '../../components/showConfirm.jsx';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { IconButton } from '@mui/material';

const SurfaceTypes = () => {
    const dispatch = useDispatch();

    // -- State Management --
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // View State (Table vs Form)
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);

    // -- Effects --
    useEffect(() => {
        dispatch(setPageTitle('Surface Types'));
        fetchData();
    }, [dispatch]);

    // -- API Actions --
    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await surfaceTypesService.getAllSurfaceTypes();
            const list = result.results || [];
            setData(list);
        } catch (error) {
            console.error("Failed to fetch surface types:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        // Trigger the SweetAlert Confirm Dialog
        const isConfirmed = await showConfirm({
            title: "Delete Surface Type?",
            text: "Are you sure you want to delete this surface type? This action cannot be undone."
        });

        if (isConfirmed) {
            try {
                await surfaceTypesService.deleteSurfaceType(id);

                // Adjust pagination if deleting last item on page
                const remainingOnPage = filteredData.length - 1;
                if (remainingOnPage === 0 && currentPage > 1) {
                    setCurrentPage(prev => prev - 1);
                }

                fetchData();
            } catch (error) {
                // Error handled in service (toasts)
            }
        }
    };

    // -- View Handlers --
    const handleCreate = () => {
        setEditItem(null);
        setShowForm(true);
    };

    const handleEdit = (item) => {
        setEditItem(item);
        setShowForm(true);
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditItem(null);
    };

    const handleFormSuccess = () => {
        fetchData();
        setShowForm(false);
        setEditItem(null);
    };

    // -- Table Configuration --
    const filteredData = data.filter(item => {
        const enName = item.translations?.en?.name?.toLowerCase() || '';
        const arName = item.translations?.ar?.name?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();

        return enName.includes(search) || arName.includes(search);
    });

    const columns = [
        {
            header: "#",
            align: 'left',
            render: (_, __, serialNumber) => <span className="text-gray-500 font-medium">{serialNumber}</span>
        },
        {
            header: "Surface Name (EN)",
            align: 'left',
            render: (row) => {
                const name = row.translations?.en?.name || '-';
                return <span className="font-medium text-secondary-600">{name}</span>;
            }
        },
        {
            header: "Surface Name (AR)",
            align: 'left',
            render: (row) => {
                const name = row.translations?.ar?.name || '-';
                return <span className="font-medium text-secondary-600">{name}</span>;
            }
        },
        {
            header: "Actions",
            align: 'right',
            render: (row) => (
                <div className="flex items-center justify-end gap-2">
                    <IconButton
                        size="small"
                        onClick={() => handleEdit(row)}
                        className="text-blue-600 hover:bg-blue-50"
                    >
                        <Edit2 size={18} />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => handleDelete(row.id)}
                        className="text-red-500 hover:bg-red-50"
                    >
                        <Trash2 size={18} />
                    </IconButton>
                </div>
            )
        }
    ];

    const topActions = [
        {
            label: (
                <div className="flex items-center gap-2">
                    <Plus size={18} />
                    <span>Add Surface Type</span>
                </div>
            ),
            type: 'primary',
            onClick: handleCreate
        }
    ];

    // -- Render --
    return (
        <div className="p-4">
            {showForm ? (
                /* --- FORM VIEW --- */
                <SurfaceTypesForm
                    initialData={editItem}
                    onCancel={handleCancelForm}
                    onSuccess={handleFormSuccess}
                />
            ) : (
                /* --- TABLE VIEW --- */
                <MainTable
                    columns={columns}
                    data={filteredData}
                    totalItems={filteredData.length}
                    searchPlaceholder="Search surface types..."
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onSearch={setSearchTerm}
                    topActions={topActions}
                    filters={[]}
                />
            )}
        </div>
    );
};

export default SurfaceTypes;