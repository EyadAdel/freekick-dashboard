import React, { useState } from 'react';

const SoccerKickToggle = ({ isCollapsed, currentLanguage = 'en' }) => {
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <svg
                viewBox="0 0 100 60"
                className="w-full h-full transition-all duration-500"
                style={{
                    transform: currentLanguage === "rtl" ? "scaleX(-1)" : "scaleX(1)"
                }}
            >
                {/* Player figure */}
                <g className={`transition-all duration-500 ${isCollapsed ? 'translate-x-0' : '-translate-x-2'}`}>
                    {/* Head */}
                    <circle
                        cx="20"
                        cy="20"
                        r="8"
                        fill="currentColor"
                        className="opacity-90"
                    />

                    {/* Body */}
                    <path
                        d={isCollapsed ? "M 20 30 L 23 42" : "M 20 30 L 20 42"}
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="transition-all duration-500"
                    />

                    {/* Arms */}
                    <path
                        d={isCollapsed ? "M 20 32 L 14 36" : "M 20 32 L 15 38"}
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="transition-all duration-500"
                    />
                    <path
                        d={isCollapsed ? "M 20 32 L 26 28" : "M 20 32 L 25 30"}
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="transition-all duration-500"
                    />

                    {/* Standing leg */}
                    <path
                        d={isCollapsed ? "M 23 42 L 20 54" : "M 20 42 L 18 54"}
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="transition-all duration-500"
                    />

                    {/* Kicking leg */}
                    <path
                        d={isCollapsed ? "M 23 42 L 38 40" : "M 20 42 L 24 52"}
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="transition-all duration-500"
                    />
                </g>

                {/* Dashed trajectory line - from kick to ball */}
                <path
                    d={isCollapsed ? "M 40 40 L 80 30" : "M 30 45 L 80 30"}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                    strokeDasharray="3,2"
                    className="transition-all duration-500 opacity-50"
                />

                {/* Soccer ball at the end */}
                <g className="transition-all duration-300">
                    <circle
                        cx="82"
                        cy="30"
                        r="6"
                        fill="currentColor"
                        className="opacity-90"
                    />
                    {/* Pentagon on ball */}
                    <path
                        d="M 82 27 L 84 28.5 L 83.5 31 L 80.5 31 L 80 28.5 Z"
                        fill="white"
                        opacity="0.7"
                    />
                </g>

                {/* Vertical sidebar line */}
                <rect
                    x="92"
                    y="15"
                    width="3"
                    height="35"
                    fill="currentColor"
                    rx="1.5"
                    className="opacity-60"
                />

                {/* Motion effects when kicking */}
                {isCollapsed && (
                    <>
                        <path
                            d="M 38 36 Q 42 34 46 36"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            fill="none"
                            opacity="0.3"
                        />
                        <path
                            d="M 40 42 Q 44 40 48 42"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            fill="none"
                            opacity="0.25"
                        />
                    </>
                )}
            </svg>
        </div>
    );
};
export  default SoccerKickToggle