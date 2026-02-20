/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#C4A475",
                "primary-hover": "#b08d5b",
                "background-light": "#F2DEDE",
                "background-dark": "#1c1917",
                "paper-light": "#FDFBF7",
                "paper-dark": "#292524",
                "accent-pink-light": "#F9E4E1",
                "accent-pink-dark": "#44403c",
                "footer-light": "#FBF8F1",
                "footer-dark": "#1f1d18",
            },
            fontFamily: {
                display: ["Playfair Display", "serif"],
                body: ["Lato", "sans-serif"],
                script: ["Great Vibes", "cursive"],
            },
        },
    },
    plugins: [],
}
