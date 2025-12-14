import React, { useState } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

// Mock data: Represents the height of the bars in the histogram
const histogramData = [5, 12, 25, 40, 60, 85, 45, 30, 20, 10, 5, 2];
const MIN = 0;
const MAX = 1500;

const PriceRangeSlider = () => {
    // State for the slider range [min, max]
    const [range, setRange] = useState([200, 1000]);

    // Calculate which bar corresponds to which price
    // (Simplified logic for demonstration)
    const isBarActive = (index) => {
        const step = (MAX - MIN) / histogramData.length;
        const barMin = MIN + (index * step);
        const barMax = barMin + step;

        // Check if the bar overlaps with the selected range
        return barMax >= range[0] && barMin <= range[1];
    };

    return (
        <div style={{ width: '300px', padding: '20px', fontFamily: 'Arial' }}>

            <h3>Price Range</h3>
            <p>Nightly prices including fees and taxes</p>

            {/* 1. The Histogram */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                height: '50px',
                gap: '2px',
                marginBottom: '-10px' // Pull slider up to overlap slightly
            }}>
                {histogramData.map((height, index) => (
                    <div
                        key={index}
                        style={{
                            height: `${height}%`,
                            width: '100%',
                            backgroundColor: isBarActive(index) ? '#008489' : '#e4e4e4', // Green if active, Gray if not
                            borderRadius: '2px 2px 0 0',
                            transition: 'background-color 0.3s'
                        }}
                    />
                ))}
            </div>

            {/* 2. The Slider */}
            <Slider
                range
                min={MIN}
                max={MAX}
                value={range}
                onChange={setRange}
                trackStyle={[{ backgroundColor: 'transparent' }]} // Hide default track to use histogram colors
                railStyle={{ backgroundColor: '#e4e4e4', height: 2 }}
                handleStyle={[
                    { borderColor: '#008489', backgroundColor: '#fff', opacity: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
                    { borderColor: '#008489', backgroundColor: '#fff', opacity: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }
                ]}
            />

            {/* 3. Inputs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <div style={{ border: '1px solid #ccc', borderRadius: '20px', padding: '5px 15px' }}>
                    <span style={{ fontSize: '12px', color: '#777' }}>Minimum</span>
                    <div style={{ fontWeight: 'bold' }}>$ {range[0]}</div>
                </div>
                <div style={{ border: '1px solid #ccc', borderRadius: '20px', padding: '5px 15px' }}>
                    <span style={{ fontSize: '12px', color: '#777' }}>Maximum</span>
                    <div style={{ fontWeight: 'bold' }}>$ {range[1]}+</div>
                </div>
            </div>
        </div>
    );
};

export default PriceRangeSlider;