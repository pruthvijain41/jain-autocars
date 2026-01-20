import React, { useRef, useEffect, useState } from 'react';

const ScrollSection = ({ children, className = "", height = "300vh", title = null }) => {
    const sectionRef = useRef(null);
    const trackRef = useRef(null);
    const [translateX, setTranslateX] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (!sectionRef.current || !trackRef.current) return;

            const section = sectionRef.current;
            const track = trackRef.current;

            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const windowHeight = window.innerHeight;
            const scrollTop = window.scrollY;

            // Calculate start and end points for the scroll effect
            const start = sectionTop;
            const end = sectionTop + sectionHeight - windowHeight;

            if (scrollTop >= start && scrollTop <= end) {
                const scrolled = scrollTop - start;
                const maxScroll = end - start;
                const percentage = scrolled / maxScroll;

                const trackWidth = track.scrollWidth;
                const windowWidth = window.innerWidth;
                // Add some padding to the end of the scroll
                const maxTranslate = trackWidth - windowWidth + (windowWidth < 768 ? 48 : 100);

                if (maxTranslate > 0) {
                    setTranslateX(percentage * maxTranslate);
                }
            } else if (scrollTop < start) {
                setTranslateX(0);
            } else if (scrollTop > end) {
                const trackWidth = track.scrollWidth;
                const windowWidth = window.innerWidth;
                const maxTranslate = trackWidth - windowWidth + (windowWidth < 768 ? 48 : 100);
                if (maxTranslate > 0) {
                    setTranslateX(maxTranslate);
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll);

        // Initial calculation
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    return (
        <div ref={sectionRef} className={`relative ${className}`} style={{ height }}>
            <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
                {title && (
                    <div className="px-6 md:px-12 mb-12 md:mb-20 max-w-7xl mx-auto w-full z-10">
                        {title}
                    </div>
                )}
                <div
                    ref={trackRef}
                    className="flex gap-6 md:gap-12 px-6 md:px-12 will-change-transform transition-transform duration-75 ease-out items-center"
                    style={{ transform: `translateX(-${translateX}px)` }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ScrollSection;
