import { useState } from 'react';
import { useBookings } from '../../../hooks/useBookings';
import Card from '../../common/Card.jsx';
// import Button from '../../common/Button/Button';

const BookingList = () => {
    // Use custom hook to get bookings data
    const { bookings, isLoading, updateFilters } = useBookings();

    // Local component state
    const [searchTerm, setSearchTerm] = useState('');

    // Event handler
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        updateFilters({ search: value });
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <Card title="Bookings">
            <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search bookings..."
                className="mb-4 px-4 py-2 border rounded"
            />

            <div className="space-y-4">
                {bookings.map(booking => (
                    <div key={booking.id} className="p-4 border rounded">
                        <h3>{booking.venueName}</h3>
                        <p>{booking.date}</p>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default BookingList;
