import React from 'react';
import logoSrc from '../../assets/logo.svg'
const LogoLoader = ({
                        size = 80,
                        className = '',
                    }) => {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className="relative" style={{ width: size, height: size }}>
                {/* Outer pulse ring */}
                <div className="absolute inset-0 rounded-full bg-primary-500 opacity-20 animate-ping" />

                {/* Rotating ring */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full rounded-full border-4 border-transparent border-t-primary-500 border-r-primary-500 animate-spin" />
                </div>

                {/* Your actual logo image */}
                <div className="absolute inset-0 flex items-center justify-center p-3">
                    <img
                        src={logoSrc}
                        alt="Loading..."
                        className="w-full h-full object-contain animate-pulse"
                        style={{ animationDuration: '2s' }}
                    />
                </div>

                {/* Bottom glow effect */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-2 bg-primary-500 opacity-30 blur-md rounded-full animate-pulse" />
            </div>
        </div>
    );
};
export default LogoLoader
