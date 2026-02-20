export default function Logo({ className = 'h-24' }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 600 300"
            className={className}
            style={{ backgroundColor: '#fceceb' }}
        >
            <defs>
                <style>{`
                    .logo-text-color { fill: #2C2728; }
                    .logo-di-text {
                        font-family: 'Playfair Display', serif;
                        font-size: 140px;
                        font-weight: 700;
                        letter-spacing: -4px;
                    }
                    .logo-moda-text {
                        font-family: 'Great Vibes', cursive;
                        font-size: 80px;
                        fill: #2C2728;
                    }
                    .logo-group-di {
                        opacity: 0;
                        transform: translateY(-30px);
                        animation: logoFadeInPosition 1.5s ease-out forwards;
                    }
                    .logo-folhinha {
                        opacity: 0;
                        animation: logoFadeIn 1s ease-out forwards;
                        animation-delay: 0.8s;
                    }
                    .logo-group-moda {
                        clip-path: inset(0 100% 0 0);
                        opacity: 0;
                        animation: logoRevealWrite 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                        animation-delay: 1s;
                    }
                    @keyframes logoFadeInPosition {
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    @keyframes logoRevealWrite {
                        to {
                            opacity: 1;
                            clip-path: inset(0 -20% 0 0);
                        }
                    }
                    @keyframes logoFadeIn {
                        to { opacity: 1; }
                    }
                `}</style>
            </defs>

            <rect width="100%" height="100%" fill="#fceceb" />

            <g transform="translate(300, 150)">
                <g className="logo-group-di">
                    <text x="45" y="10" textAnchor="end" className="logo-text-color logo-di-text">Di</text>
                    <path
                        className="logo-text-color logo-folhinha"
                        d="M 145,5 C 145,5 155,15 155,25 C 155,35 145,45 145,45 C 145,45 135,35 135,25 C 135,15 145,5 145,5 Z"
                        transform="translate(-85, -95) scale(0.9)"
                    />
                </g>

                <g className="logo-group-moda">
                    <text x="0" y="90" textAnchor="middle" className="logo-moda-text">Moda Íntima</text>
                </g>
            </g>
        </svg>
    )
}
