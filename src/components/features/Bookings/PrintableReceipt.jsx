// components/features/Bookings/PrintableReceipt.jsx
import React from 'react';

const PrintableReceipt = React.forwardRef(({ booking, logo }, ref) => {
    if (!booking) {
        return <div>No booking data available</div>;
    }

    const totalAmount = parseFloat(booking.total_price || 0);
    const addonsTotal = booking.booking_addons?.reduce((sum, addon) => {
        return sum + (parseFloat(addon.addon_info?.price || 0) * addon.quantity);
    }, 0) || 0;
    const pitchTotal = totalAmount - addonsTotal;

    const formatDate = (dateTime) => {
        if (!dateTime) return 'N/A';
        const date = new Date(dateTime);
        return date.toLocaleDateString('en-US', {
            month: 'long',
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

    return (
        <div ref={ref} data-booking-id={booking.id} style={{ width: '800px', backgroundColor: 'white', fontFamily: 'Arial, sans-serif' }}>
            {/* HEADER SECTION - Repeats on each page */}
            <div data-pdf-section="header" style={{ padding: '10px 20px 10px', borderBottom: '4px solid #14b8a6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {logo && (
                            <img src={logo} alt="Logo" style={{ height: '45px',marginTop:'20px' }} />
                        )}
                        <div style={{ fontSize: '35px', fontWeight: '700', color: '#14b8a6', letterSpacing: '1px' }}>
                            FREE KICK
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                            INVOICE
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '5px' }}>
                            Invoice #: <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                {String(booking.id).padStart(7, '0')}
                            </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Date: {formatDate(new Date())}
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT SECTION */}
            <div data-pdf-section="content" style={{ padding: '40px 50px 0' }}>
                {/* Billing Information */}
                <div data-pdf-break="billing" style={{ marginBottom: '35px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#14b8a6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                                Invoice From
                            </div>
                            <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>
                                    {booking.venue_info?.translations?.name || 'Sports Venues'}
                                </div>
                                <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8' }}>
                                    <div>{booking.venue_info?.translations?.address || 'Address not available'}</div>
                                    <div style={{ marginTop: '5px' }}>
                                        Phone: {booking.venue_info?.phone_number || 'N/A'}
                                    </div>
                                    <div>Email: {booking.venue_info?.owner_info?.email || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#14b8a6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                                Invoice To
                            </div>
                            <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>
                                    {booking.user_info?.name || 'Customer'}
                                </div>
                                <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8' }}>
                                    <div>Email: {booking.user_info?.email || 'Not provided'}</div>
                                    <div>Phone: {booking.user_info?.phone || 'Not provided'}</div>
                                    <div style={{ marginTop: '10px' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 12px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            backgroundColor: booking.status === 'confirmed' ? '#dcfce7' :
                                                booking.status === 'pending' ? '#fef3c7' :
                                                    booking.status === 'cancelled' ? '#fee2e2' : '#dbeafe',
                                            color: booking.status === 'confirmed' ? '#166534' :
                                                booking.status === 'pending' ? '#854d0e' :
                                                    booking.status === 'cancelled' ? '#991b1b' : '#1e40af'
                                        }}>
                                            {booking.status?.toUpperCase() || 'PENDING'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Booking Information */}
                <div data-pdf-break="booking-info" style={{ marginBottom: '35px' }}>
                    <div style={{ padding: '25px', backgroundColor: '#f0fdfa', borderRadius: '8px', border: '1px solid #99f6e4' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#14b8a6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>
                            Booking Information
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '13px' }}>
                            <div>
                                <div style={{ color: '#64748b', marginBottom: '5px' }}>Booking Date</div>
                                <div style={{ fontWeight: '600', color: '#1e293b' }}>{formatDate(booking.start_time)}</div>
                            </div>
                            <div>
                                <div style={{ color: '#64748b', marginBottom: '5px' }}>Time Slot</div>
                                <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                    {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: '#64748b', marginBottom: '5px' }}>Venue</div>
                                <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                    {booking.venue_info?.translations?.name || 'N/A'}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: '#64748b', marginBottom: '5px' }}>Pitch</div>
                                <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                    {booking.pitch?.translations?.name || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div data-pdf-break="table" style={{ marginBottom: '35px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                        <tr style={{ backgroundColor: '#14b8a6', color: 'white' }}>
                            <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Description
                            </th>
                            <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', width: '80px' }}>
                                Qty
                            </th>
                            <th style={{ padding: '15px', textAlign: 'right', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', width: '110px' }}>
                                Unit Price
                            </th>
                            <th style={{ padding: '15px', textAlign: 'right', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', width: '110px' }}>
                                Amount
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '16px 15px' }}>
                                <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                                    {booking.pitch?.translations?.name || 'Pitch Booking'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                    {booking.venue_info?.translations?.name || 'Venues'}
                                </div>
                            </td>
                            <td style={{ padding: '16px 15px', textAlign: 'center', color: '#475569' }}>1</td>
                            <td style={{ padding: '16px 15px', textAlign: 'right', color: '#475569' }}>
                                {pitchTotal.toFixed(2)} AED
                            </td>
                            <td style={{ padding: '16px 15px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                                {pitchTotal.toFixed(2)} AED
                            </td>
                        </tr>

                        {booking.booking_addons?.map((addon, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '16px 15px' }}>
                                    <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                                        {addon.addon_info?.addon?.translations?.name || 'Add-on'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Additional Service</div>
                                </td>
                                <td style={{ padding: '16px 15px', textAlign: 'center', color: '#475569' }}>
                                    {addon.quantity}
                                </td>
                                <td style={{ padding: '16px 15px', textAlign: 'right', color: '#475569' }}>
                                    {parseFloat(addon.addon_info?.price || 0).toFixed(2)} AED
                                </td>
                                <td style={{ padding: '16px 15px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                                    {(parseFloat(addon.addon_info?.price || 0) * addon.quantity).toFixed(2)} AED
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Total Section */}
                <div data-pdf-break="totals" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
                    <div style={{ width: '350px' }}>
                        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                            <span style={{ color: '#64748b' }}>Subtotal</span>
                            <span style={{ fontWeight: '600', color: '#475569' }}>{totalAmount.toFixed(2)} AED</span>
                        </div>
                        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                            <span style={{ color: '#64748b' }}>Tax (0%)</span>
                            <span style={{ fontWeight: '600', color: '#475569' }}>0.00 AED</span>
                        </div>
                        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                            <span style={{ color: '#64748b' }}>Discount</span>
                            <span style={{ fontWeight: '600', color: '#475569' }}>0.00 AED</span>
                        </div>
                        <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#14b8a6', borderRadius: '8px', marginTop: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>Total Amount</span>
                            <span style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>
                                {totalAmount.toFixed(2)} AED
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER SECTION - Appears only at the end */}
            <div data-pdf-section="footer" style={{ padding: '30px 50px' }}>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#94a3b8' }}>
                    <div>Invoice generated on {formatDate(new Date())}</div>
                    <div>{booking.venue_info?.translations?.name || 'FREE KICK'}</div>
                </div>
            </div>
        </div>
    );
});

PrintableReceipt.displayName = 'PrintableReceipt';

export default PrintableReceipt;