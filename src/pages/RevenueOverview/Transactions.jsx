import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MainTable from "../../components/MainTable.jsx";
import { FaFilePdf } from "react-icons/fa";
import analyticsService from "../../services/analyticsService.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import TransactionReceipt from "../../components/common/TransactionReceipt.jsx";
import logo from "../../assets/logo.svg";

function Transactions(props) {
    const [transactions, setTransactions] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [generatingPDFId, setGeneratingPDFId] = useState(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [pdfError, setPdfError] = useState(null);
    const printRef = useRef();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 10;

    // Sort state
    const [sortConfig, setSortConfig] = useState({
        key: 'created_at',
        direction: 'desc'
    });

    // Active filters
    const [activeFilters, setActiveFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const { t,i18n } = useTranslation(['transactions', 'common']);

    const fetchTransactions = async () => {
        try {
            setTableLoading(true);

            const params = {
                page: currentPage,
                page_limit: itemsPerPage,
                ordering: sortConfig.direction === 'desc' ? `-${sortConfig.key}` : sortConfig.key,
            };

            if (searchTerm) {
                params.search = searchTerm;
            }

            Object.entries(activeFilters).forEach(([key, value]) => {
                if (value !== '' && value !== undefined) {
                    params[key] = value;
                }
            });

            const response = await analyticsService.getStaffActions(params);

            setTransactions(response.results || []);
            setTotalCount(response.count || 0);
        } catch (err) {
            console.error('Error fetching transactions:', err);
        } finally {
            setTableLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [currentPage, sortConfig, activeFilters, searchTerm]);

    // Generate PDF when transaction is selected
    useEffect(() => {
        if (selectedTransaction && printRef.current) {
            generatePDF();
        }
    }, [selectedTransaction]);

    const handleDownloadReceipt = (transaction) => {
        setPdfError(null);
        setGeneratingPDFId(transaction.id);
        setSelectedTransaction(transaction);
    };

    // Handle search
    const handleSearch = (search) => {
        setSearchTerm(search);
        setCurrentPage(1);
    };

    // Handle filter changes
    const handleFilterChange = (filters) => {
        setActiveFilters(filters);
        setCurrentPage(1);
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Handle sort
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key: key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format amount
    const formatAmount = (amount) => {
        if (!amount && amount !== 0) return 'N/A';
        return `${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Get currency symbol based on language
    const getCurrencySymbol = () => {
        const lang = i18n.language;
        return lang === 'ar' ? 'د.إ' : 'AED';
    };

    // Table columns configuration
    const columns = [
        // {
        //     header: t('transactions:table.columns.id'),
        //     accessor: 'id',
        //     align: 'left',
        //     sortable: true,
        //     sortKey: 'id',
        //     render: (row) => (
        //         <span className="font-semibold">
        //             #{row.id}
        //         </span>
        //     )
        // },
        {
            header: t('transactions:table.columns.description'),
            accessor: 'description',
            align: 'left'
        },
        {
            header: t('transactions:table.columns.amount'),
            accessor: 'amount',
            align: 'right',
            sortable: true,
            sortKey: 'amount',
            render: (row) => {
                const formattedAmount = formatAmount(row.amount);
                const currencySymbol = getCurrencySymbol();
                return (
                    <span className={`font-semibold ${
                        row.kind === 'addition' ? 'text-green-600' : 'text-red-600'
                    }`}>
                        {row.kind === 'addition' ? '+' : '-'} {currencySymbol} {formattedAmount}
                        {/*{row.amount}*/}
                    </span>
                );
            }
        },
        {
            header: t('transactions:table.columns.type'),
            accessor: 'kind',
            align: 'center',
            sortable: true,
            sortKey: 'kind',
            render: (row) => (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    row.kind === 'addition'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                }`}>
                    {row.kind === 'addition' ? t('transactions:types.credit') : t('transactions:types.debit')}
                </span>
            )
        },
        {
            header: t('transactions:table.columns.bookingAction'),
            accessor: 'booking_action',
            align: 'center',
            render: (row) => row.booking_action || 'N/A'
        },
        {
            header: t('transactions:table.columns.date'),
            accessor: 'created_at',
            align: 'left',
            sortable: true,
            sortKey: 'created_at',
            render: (row) => formatDate(row.created_at)
        },
        {
            header: t('transactions:table.columns.receipt'),
            align: 'center',
            sortable: false,
            render: (row) => (
                <button
                    onClick={() => handleDownloadReceipt(row)}
                    disabled={isGeneratingPDF && generatingPDFId === row.id}
                    className={`px-3 py-2 gap-[2px] flex items-center rounded-full text-xs text-white transition-colors ${
                        isGeneratingPDF && generatingPDFId === row.id
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-primary-500 bg-opacity-80'
                    }`}
                >
                    <FaFilePdf size={'12'} />
                    {isGeneratingPDF && generatingPDFId === row.id
                        ? t('transactions:table.actions.generatingPDF')
                        : t('transactions:table.actions.printPDF')
                    }
                </button>
            )
        },
    ];

    // Filter configurations
    const filterConfigs = [
        {
            type: 'select',
            key: 'kind',
            label: t('transactions:filters.transactionType'),
            options: [
                { value: 'add', label: t('transactions:types.credit') },
                { value: 'deduct', label: t('transactions:types.debit') }
            ]
        },
        {
            type: 'number',
            key: 'amount',
            label: t('transactions:filters.exactAmount'),
        },
        {
            type: 'number',
            key: 'amount__gte',
            label: t('transactions:filters.minAmount'),
        },
        {
            type: 'number',
            key: 'amount__lte',
            label: t('transactions:filters.maxAmount'),
        },
    ];

    const generatePDF = async () => {
        try {
            setIsGeneratingPDF(true);

            // Wait a bit for the component to render
            await new Promise(resolve => setTimeout(resolve, 100));

            const element = printRef.current;

            // Generate canvas from the element
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');

            // Calculate PDF dimensions
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            let heightLeft = imgHeight;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add additional pages if needed
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Download the PDF
            pdf.save(`Transaction_${selectedTransaction.id}_Receipt.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            setPdfError(t('transactions:messages.pdfFailed'));
        } finally {
            setIsGeneratingPDF(false);
            setGeneratingPDFId(null);
            setSelectedTransaction(null);
        }
    };

    return (
        <div>
            {pdfError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    <p className="font-semibold">{pdfError}</p>
                </div>
            )}

            {selectedTransaction && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <TransactionReceipt
                        ref={printRef}
                        transaction={selectedTransaction}
                        logo={logo}
                    />
                </div>
            )}

            <div className="mt-8 bg-white p-5 rounded-lg lg:mt-10">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                        {t('transactions:title')}
                    </h2>
                </div>

                <MainTable
                    columns={columns}
                    data={transactions}
                    searchPlaceholder={t('transactions:searchPlaceholder')}
                    filters={filterConfigs}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalCount}
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    onPageChange={handlePageChange}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    loading={tableLoading}
                    noDataMessage={t('transactions:noData')}
                    paginationTexts={{
                        showing: t('transactions:pagination.showing'),
                        to: t('transactions:pagination.to'),
                        of: t('transactions:pagination.of'),
                        results: t('transactions:pagination.results'),
                        previous: t('transactions:pagination.previous'),
                        next: t('transactions:pagination.next')
                    }}
                />
            </div>
        </div>
    );
}

export default Transactions;