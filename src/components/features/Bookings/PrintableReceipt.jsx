// components/features/Bookings/PrintableReceipt.jsx
import React from 'react';
import {Mail, MapPin, Phone} from "lucide-react";

const PrintableReceipt = React.forwardRef(({ booking, logo }, ref) => {
    if (!booking) {
        return <div>No booking data available</div>;
    }

    const totalAmount = parseFloat(booking.total_price || 0);
    const addonsTotal = booking.booking_addons?.reduce((sum, addon) => {
        return sum + (parseFloat(addon.addon_info?.price || 0) * addon.quantity);
    }, 0) || 0;
    const pitchTotal = totalAmount - addonsTotal;

    const totalCollected = parseFloat(booking.total_collected_amount || 0);
    const totalPending = parseFloat(booking.total_pending_amount || 0);

    const formatDate = (dateTime) => {
        if (!dateTime) return 'N/A';
        const date = new Date(dateTime);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC'  // Add this line
        });
    };

    const formatTime = (dateTime) => {
        if (!dateTime) return 'N/A';
        const date = new Date(dateTime);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'UTC'  // Add this line

        });
    };

    const containerStyle = {
        width: '800px',
        backgroundColor: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1f2937'
    };

    const headerStyle = {
        padding: '10px 20px 10px',
        borderBottom: '4px solid #00bfbf'
    };

    const headerContentStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    };

    const logoContainerStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    };

    const logoStyle = {
        height: '45px',
        marginTop:'20px',
        marginLeft:'10px'
    };

    const brandNameStyle = {
        fontSize: '40px',
        fontWeight: '600',
        color: '#00bfbf',
        letterSpacing: '-0.5px'
    };

    const headerRightStyle = {
        textAlign: 'right'
    };

    const invoiceTitleStyle = {
        fontSize: '13px',
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: '8px',
        letterSpacing: '0.5px'
    };

    const invoiceNumberStyle = {
        fontSize: '24px',
        color: '#111827',
        marginBottom: '8px',
        fontWeight: '700'
    };

    const invoiceDateStyle = {
        fontSize: '13px',
        color: '#6b7280'
    };

    const contentStyle = {
        padding: '10px 20px'
    };

    const billingSectionStyle = {
        marginBottom: '0px'
    };

    const sectionTitleStyle = {
        fontSize: '12px',
        fontWeight: '500',
        color: '#374151',
        display:'flex',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '10px'
    };

    const infoBoxStyle = {
        padding: '0',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        maxWidth: '100%'
    };

    const venueDetailsStyle = {
        fontSize: '14px',
        color: '#6b7280',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        padding:'10px',
        maxWidth: '100%',
        height:'fit-content'
    };

    const venueNameStyle = {
        fontSize: '15px',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '8px'
    };

    const bookingInfoStyle = {
        padding: '20px 10px',
        borderTop: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '20px',
        backgroundColor:'#e6f7f7'
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        alignItems: 'start'
    };

    const venueWrapperStyle = {
        minWidth: '0'
    };

    const bookingGridStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '24px',
        fontSize: '14px'
    };

    const labelStyle = {
        color: '#6b7280',
        marginBottom: '6px',
        fontSize: '12px',
        fontWeight: '500'
    };

    const valueStyle = {
        fontWeight: '600',
        color: '#111827',
        fontSize: '14px'
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '13px',
        marginBottom: '30px'
    };

    const tableHeaderStyle = {
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb'
    };

    const tableCellStyle = {
        padding: '12px 16px',
        textAlign: 'left',
        fontWeight: '600',
        color: '#374151',
        fontSize: '12px'
    };

    const tableBodyCellStyle = {
        padding: '16px',
        borderBottom: '1px solid #f3f4f6'
    };

    const statusBadgeStyle = (status) => ({
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        backgroundColor: status === 'completed' ? '#ecfdf5' :
            status === 'pending' ? '#fef3c7' : '#f3f4f6',
        color: status === 'completed' ? '#065f46' :
            status === 'pending' ? '#92400e' : '#374151'
    });

    const paymentGridStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '20px',
        marginBottom: '30px'
    };

    const paymentCardStyle = (bgColor, borderColor) => ({
        padding: '20px',
        backgroundColor: bgColor,
        borderRadius: '6px',
        border: `1px solid ${borderColor}`
    });

    const paymentHeaderStyle = {
        marginBottom: '8px'
    };

    const paymentTitleStyle = (color) => ({
        fontSize: '12px',
        fontWeight: '500',
        color: '#6b7280',
        marginBottom: '4px'
    });

    const paymentAmountStyle = (color) => ({
        fontSize: '24px',
        fontWeight: '700',
        color: color
    });

    const footerStyle = {
        padding: '30px 60px',
        backgroundColor: '#f9fafb',
        borderTop: '1px solid #e5e7eb'
    };

    const footerContentStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#6b7280'
    };

    const iconStyle = {
        width: '14px',
        height: '14px',
        color: '#9ca3af',
        flexShrink: '0',
        marginRight: '8px',
        marginTop: '2px',
    };

    const venueLineStyle = {
        display: 'flex',
        alignItems: 'flex-start',
        marginBottom: '8px',
        lineHeight: '1.4'
    };

    return (
        <div ref={ref} data-booking-id={booking.id} style={containerStyle}>
            {/* HEADER SECTION */}
            <div data-pdf-section="header" style={headerStyle}>
                <div style={headerContentStyle}>
                    <div style={logoContainerStyle}>
                        {logo && (
                            <img src={logo} alt="Logo" style={logoStyle} />
                        )}
                        <div style={brandNameStyle}>
                            FREE KICK
                        </div>
                    </div>
                    <div style={headerRightStyle}>
                        <div style={invoiceTitleStyle}>
                            ORDER SUMMARY
                        </div>
                        <div style={invoiceNumberStyle}>
                            #{String(booking.id).padStart(7, '0')}
                        </div>
                        <div style={invoiceDateStyle}>
                            {formatDate(booking.created_at)}
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT SECTION */}
            <div data-pdf-section="content" style={contentStyle}>
                {/* Billing Information */}
                <div data-pdf-break="billing" style={billingSectionStyle}>
                    <div style={gridStyle}>
                        {/* Venue Information */}
                        <div style={venueWrapperStyle}>
                            <div style={sectionTitleStyle}>
                                Venue Information
                            </div>
                            <div style={infoBoxStyle}>
                                <div style={venueNameStyle}>
                                    {booking.venue_info?.translations?.name || 'No venue information available'}
                                </div>
                                <div style={venueDetailsStyle}>
                                    {/* Format address with line breaks */}
                                    {(() => {
                                        const address = booking.venue_info?.translations?.address || 'Address not available';
                                        const formattedAddress = address.replace(/,/g, ',\n');
                                        return formattedAddress.split('\n').map((line, index) => (
                                            <div key={index} style={venueLineStyle}>
                                                <MapPin style={iconStyle} />
                                                <span>{line.trim()}</span>
                                            </div>
                                        ));
                                    })()}
                                    {booking.venue_info?.phone_number && (
                                        <div style={venueLineStyle}>
                                            <Phone style={iconStyle} />
                                            <span>{booking.venue_info.phone_number}</span>
                                        </div>
                                    )}
                                    {booking.venue_info?.email && (
                                        <div style={venueLineStyle}>
                                            <Mail style={iconStyle} />
                                            <span>{booking.venue_info.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div style={venueWrapperStyle}>
                            <div style={sectionTitleStyle}>
                                Customer
                            </div>
                            <div style={infoBoxStyle}>
                                <div style={venueNameStyle}>
                                    {booking.user_info?.name || 'Customer'}
                                </div>
                                <div style={venueDetailsStyle}>
                                    <div style={venueLineStyle}>
                                        <Phone style={iconStyle} />
                                        <span>{booking.user_info?.phone || 'Not provided'}</span>
                                    </div>
                                    {booking.user_info?.email && (
                                        <div style={venueLineStyle}>
                                            <Mail style={iconStyle} />
                                            <span>{booking.user_info.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Booking Information */}
                <div data-pdf-break="booking-info" style={bookingInfoStyle}>
                    <div style={{...sectionTitleStyle, marginBottom: '8px', justifyContent: 'space-between', alignItems: 'center'}}>
                        Booking Details
                        <span style={{
                            display: 'inline-block',
                            padding: '1px 1px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: booking.last_update === 'confirmed' ? '#065f46' :
                                booking.last_update === 'pending' ? '#92400e' :
                                    booking.last_update === 'cancelled' ? '#991b1b' : '#1e40af'
                        }}>
                            {(booking.last_update || 'PENDING').toUpperCase()}
                        </span>
                    </div>
                    <div style={bookingGridStyle}>
                        <div>
                            <div style={labelStyle}>Date</div>
                            <div style={valueStyle}>{formatDate(booking.start_time)}</div>
                        </div>
                        <div>
                            <div style={labelStyle}>Time</div>
                            <div style={valueStyle}>
                                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                            </div>
                        </div>
                        <div>
                            <div style={labelStyle}>Type</div>
                            <div style={valueStyle}>Online Booking</div>
                        </div>
                        <div>
                            <div style={labelStyle}>Payment</div>
                            <div style={valueStyle}>
                                {booking.split_payment ? 'Split Payment' : 'Full Payment'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Summary Table */}
                {booking.booking_action && booking.booking_action.length > 0 && (
                    <div data-pdf-break="payment-summary" style={{ marginBottom: '40px' }}>
                        <div style={sectionTitleStyle}>
                            Payment Breakdown
                        </div>
                        <table style={tableStyle}>
                            <thead>
                            <tr style={tableHeaderStyle}>
                                <th style={{ ...tableCellStyle, textAlign: 'left' }}>Player</th>
                                <th style={{ ...tableCellStyle, textAlign: 'right', width: '100px' }}>Subscription</th>
                                <th style={{ ...tableCellStyle, textAlign: 'right', width: '80px' }}>Fees</th>
                                <th style={{ ...tableCellStyle, textAlign: 'right', width: '90px' }}>Discount</th>
                                <th style={{ ...tableCellStyle, textAlign: 'right', width: '120px' }}>Total</th>
                            </tr>
                            </thead>
                            <tbody>
                            {booking.booking_action.map((action, idx) => (
                                <tr key={idx}>
                                    <td style={{ ...tableBodyCellStyle, textAlign: 'left' }}>
                                        <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                                            {action.user?.name ? action.user.name.split(' ').slice(0, 2).join(' ') : 'Player'}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                            {action.user?.phone || ''}
                                        </div>
                                    </td>
                                    <td style={{ ...tableBodyCellStyle, textAlign: 'right', color: '#6b7280' }}>
                                        {(parseFloat(action.amount || 0) - parseFloat(action.fees || 0) - parseFloat(action.discounted_amount || 0)).toFixed(2)} AED
                                    </td>
                                    <td style={{ ...tableBodyCellStyle, textAlign: 'right', color: '#10b981', fontWeight: '600' }}>
                                        +{parseFloat(action.fees || 0).toFixed(2)}
                                    </td>
                                    <td style={{ ...tableBodyCellStyle, textAlign: 'right', color: '#ef4444', fontWeight: '600' }}>
                                        -{parseFloat(action.discounted_amount || 0).toFixed(2)}
                                    </td>
                                    <td style={{ ...tableBodyCellStyle, textAlign: 'right' }}>
                                        <div style={{ fontWeight: '700', color: '#111827', marginBottom: '6px' }}>
                                            {parseFloat(action.amount || 0).toFixed(2)} AED
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <span style={statusBadgeStyle(action.status)}>
                                                {action.status}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Payment Status Summary */}
                <div data-pdf-break="payment-status" style={{ marginBottom: '40px' }}>
                    <div style={paymentGridStyle}>
                        <div style={paymentCardStyle('#b3e6e6', '#b3e6e6')}>
                            <div style={paymentHeaderStyle}>
                                <div style={paymentTitleStyle('#374151')}>Total price</div>
                            </div>
                            <div style={paymentAmountStyle('#111827')}>
                                {totalAmount.toFixed(2)} AED
                            </div>
                        </div>
                        <div style={paymentCardStyle('#ecfdf5', '#d1fae5')}>
                            <div style={paymentHeaderStyle}>
                                <div style={paymentTitleStyle('#065f46')}>Collected</div>
                            </div>
                            <div style={paymentAmountStyle('#065f46')}>
                                {totalCollected.toFixed(2)} AED
                            </div>
                        </div>

                        <div style={paymentCardStyle('#fef3c7', 'rgba(253,230,138,0.16)')}>
                            <div style={paymentHeaderStyle}>
                                <div style={paymentTitleStyle('#92400e')}>Pending</div>
                            </div>
                            <div style={paymentAmountStyle('#92400e')}>
                                {totalPending.toFixed(2)} AED
                            </div>
                        </div>


                    </div>
                </div>
            </div>

            {/* FOOTER SECTION */}
            <div data-pdf-section="footer" style={footerStyle}>
                <div style={footerContentStyle}>
                    <div>Last updated {formatDate(booking.updated_at)}</div>
                    <div>Thank you for your business</div>
                </div>
            </div>
        </div>
    );
});

PrintableReceipt.displayName = 'PrintableReceipt';

export default PrintableReceipt;