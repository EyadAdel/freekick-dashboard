// tailwind.config.js
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#e6f7f7',
                    100: '#b3e6e6',
                    300:'#2ACEF2',
                    500: '#00bfbf',
                    600: '#00a6a6',
                    700: '#008c8c',
                },
                secondary: {
                    600: '#21406E',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'float-slow': 'float 8s ease-in-out infinite',
                'float-slower': 'float 12s ease-in-out infinite',
                'float-slowest': 'float 16s ease-in-out infinite',
                'avatar-float-slow': 'avatarFloat 3s ease-in-out infinite',
                'avatar-float-slower': 'avatarFloat 3s ease-in-out infinite 1s',
                'avatar-float-slowest': 'avatarFloat 3s ease-in-out infinite .5s',
            },
            keyframes: {
                float: {
                    '0%, 100%': {
                        transform: 'translateY(0) translateX(0) scale(1)',
                    },
                    '33%': {
                        transform: 'translateY(-20px) translateX(10px) scale(1.05)',
                    },
                    '66%': {
                        transform: 'translateY(10px) translateX(-15px) scale(0.95)',
                    },
                },
                avatarFloat: {
                    '0%, 100%': {
                        transform: 'translateY(0)',
                    },
                    '50%': {
                        transform: 'translateY(-8px)',
                    },
                }
            },
        },
    },
    plugins: [],
}