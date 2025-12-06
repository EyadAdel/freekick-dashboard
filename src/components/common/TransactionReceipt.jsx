// components/features/Transactions/TransactionReceipt.jsx
import React from 'react';

const TransactionReceipt = React.forwardRef(({ transaction, logo }, ref) => {
    if (!transaction) {
        return <div>No transaction data available</div>;
    }

    const formatDate = (dateTime) => {
        if (!dateTime) return 'N/A';
        const date = new Date(dateTime);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (dateTime) => {
        if (!dateTime) return 'N/A';
        const date = new Date(dateTime);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const amount = parseFloat(transaction.amount || 0);
    const isCredit = transaction.kind === 'addition';

    return (
        <div
            ref={ref}
            data-transaction-id={transaction.id}
            style={{
                width: '800px',
                minHeight: '1050px',
                backgroundColor: 'white',
                fontFamily: 'Arial, sans-serif',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* MAIN CONTENT WRAPPER */}
            <div style={{ flex: '1', paddingBottom: '80px' }}>
                {/* HEADER */}
                <div style={{
                    padding: '20px 25px',
                    borderBottom: '3px solid #14b8a6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                }}>
                    {/* Logo and Company Name */}
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '8px' ,alignItems:'center' ,justifyContent:'center' }}>
                        {logo && (
                            <img src={logo} alt="Logo" style={{
                               width:'35px',
                                height:'35px',
                                marginTop:'15px'
                            }}  />
                        )}
                        <div style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            color: '#14b8a6',
                            letterSpacing: '0.5px'
                        }}>
                            FREE KICK
                        </div>

                    </div>

                    {/* Receipt Info */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#1e293b',
                            marginBottom: '15px'
                        }}>
                            TRANSACTION RECEIPT
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.8' }}>
                            <div>
                                <span style={{ fontWeight: '600' }}>Receipt #:</span> {String(transaction.id).padStart(7, '0')}
                            </div>
                            <div>
                                <span style={{ fontWeight: '600' }}>Date:</span> {formatDate(transaction.created_at)}
                            </div>
                            <div>
                                <span style={{ fontWeight: '600' }}>Time:</span> {formatTime(transaction.created_at)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* TRANSACTION DETAILS */}
                <div style={{ padding: '40px 60px' }}>
                    {/* Info Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '30px',
                        marginBottom: '40px',
                        padding: '25px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div>
                            <div style={{
                                fontSize: '10px',
                                fontWeight: '600',
                                color: '#64748b',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '8px'
                            }}>
                                Staff ID
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                                #{transaction.staff}
                            </div>
                        </div>
                        <div>
                            <div style={{
                                fontSize: '10px',
                                fontWeight: '600',
                                color: '#64748b',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '8px'
                            }}>
                                Booking Action
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                                #{transaction.booking_action || 'N/A'}
                            </div>
                        </div>
                        <div>
                            <div style={{
                                fontSize: '10px',
                                fontWeight: '600',
                                color: '#64748b',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '8px'
                            }}>
                                Type
                            </div>
                            <div>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '5px 12px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: isCredit ? '#166534' : '#991b1b'
                                }}>
                                    {isCredit ? 'CREDIT' : 'DEBIT'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '12px'
                        }}>
                            Description
                        </div>
                        <div style={{
                            padding: '20px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            fontSize: '13px',
                            color: '#475569',
                            lineHeight: '1.6'
                        }}>
                            {transaction.description || 'No description available'}
                        </div>
                    </div>

                    {/* Amount Section */}
                    <div style={{
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}>
                        {/* Table Header */}
                        <div style={{
                            backgroundColor: '#f1f5f9',
                            padding: '15px 25px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid #e2e8f0'
                        }}>
                            <div style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                color: '#475569',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Transaction Details
                            </div>
                            <div style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                color: '#475569',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Amount
                            </div>
                        </div>

                        {/* Amount Row */}
                        <div style={{
                            padding: '20px 25px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: 'white'
                        }}>
                            <div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#1e293b',
                                    marginBottom: '4px'
                                }}>
                                    Transaction #{transaction.id}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                    {isCredit ? 'Credit Transaction' : 'Debit Transaction'}
                                </div>
                            </div>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: isCredit ? '#166534' : '#991b1b'
                            }}>
                                {isCredit ? '+' : '-'} {amount.toFixed(2)} AED
                            </div>
                        </div>


                    </div>
                </div>
            </div>

            {/* FOOTER - ALWAYS AT BOTTOM */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '20px 60px',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: 'white'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '10px',
                    color: '#94a3b8'
                }}>
                    <div>
                        © {new Date().getFullYear()} FREE KICK. All rights reserved.
                    </div>
                    <div>
                        Generated: {formatDate(new Date())} at {formatTime(new Date())}
                    </div>
                </div>
            </div>
        </div>
    );
});

TransactionReceipt.displayName = 'TransactionReceipt';

export default TransactionReceipt;