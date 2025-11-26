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
                    500: '#00bfbf',
                    600: '#00a6a6',
                    700: '#008c8c',
                },
                secondary: {
                    500: '#6366f1',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}