import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, HelpCircle, X, Maximize, Minimize } from 'lucide-react';
import gsap from 'gsap';

interface PresentationNavigationProps {
    currentSlide: number;
    totalSlides: number;
    onPrevious: () => void;
    onNext: () => void;
}

const PresentationNavigation: React.FC<PresentationNavigationProps> = ({
    currentSlide,
    totalSlides,
    onPrevious,
    onNext
}) => {
    const [showHelp, setShowHelp] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        setProgress((currentSlide / totalSlides) * 100);
    }, [currentSlide, totalSlides]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                const element = document.documentElement;
                if (element.requestFullscreen) {
                    await element.requestFullscreen();
                } else if ((element as any).webkitRequestFullscreen) {
                    await (element as any).webkitRequestFullscreen();
                } else if ((element as any).mozRequestFullScreen) {
                    await (element as any).mozRequestFullScreen();
                } else if ((element as any).msRequestFullscreen) {
                    await (element as any).msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    await (document as any).webkitExitFullscreen();
                } else if ((document as any).mozCancelFullScreen) {
                    await (document as any).mozCancelFullScreen();
                } else if ((document as any).msExitFullscreen) {
                    await (document as any).msExitFullscreen();
                }
            }
        } catch (error) {
            console.error('Error toggling fullscreen:', error);
        }
    };

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === '?') {
                setShowHelp(!showHelp);
            } else if (e.key === 'Escape') {
                setShowHelp(false);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [showHelp]);

    return (
        <>
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200/50 z-50">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Navigation Controls */}
            <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
                <button
                    onClick={onPrevious}
                    disabled={currentSlide === 0}
                    className="p-3 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg hover:bg-white hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous slide"
                >
                    <ChevronUp size={20} className="text-slate-700" />
                </button>
                <div className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg text-center">
                    <span className="text-xs font-bold text-slate-700">
                        {currentSlide + 1} / {totalSlides}
                    </span>
                </div>
                <button
                    onClick={onNext}
                    disabled={currentSlide === totalSlides - 1}
                    className="p-3 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg hover:bg-white hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next slide"
                >
                    <ChevronDown size={20} className="text-slate-700" />
                </button>
            </div>

            {/* Help Overlay */}
            {showHelp && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-8">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative">
                        <button
                            onClick={() => setShowHelp(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
                            aria-label="Close help"
                        >
                            <X size={20} className="text-slate-600" />
                        </button>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Raccourcis Clavier</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                <span className="text-slate-700">Précédent</span>
                                <kbd className="px-3 py-1 bg-white border border-slate-200 rounded text-sm font-mono">↑</kbd>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                <span className="text-slate-700">Suivant</span>
                                <kbd className="px-3 py-1 bg-white border border-slate-200 rounded text-sm font-mono">↓</kbd>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                <span className="text-slate-700">Aide</span>
                                <kbd className="px-3 py-1 bg-white border border-slate-200 rounded text-sm font-mono">?</kbd>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                <span className="text-slate-700">Fermer l'aide</span>
                                <kbd className="px-3 py-1 bg-white border border-slate-200 rounded text-sm font-mono">Esc</kbd>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                <span className="text-slate-700">Plein écran</span>
                                <kbd className="px-3 py-1 bg-white border border-slate-200 rounded text-sm font-mono">F11</kbd>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Help Button */}
            <button
                onClick={() => setShowHelp(true)}
                className="fixed bottom-8 left-8 p-3 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg hover:bg-white hover:scale-110 transition-all z-50"
                aria-label="Show help"
            >
                <HelpCircle size={20} className="text-slate-700" />
            </button>

            {/* Fullscreen Toggle Button */}
            <button
                onClick={toggleFullscreen}
                className="fixed top-8 right-8 p-3 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg hover:bg-white hover:scale-110 transition-all z-50"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
                {isFullscreen ? (
                    <Minimize size={20} className="text-slate-700" />
                ) : (
                    <Maximize size={20} className="text-slate-700" />
                )}
            </button>
        </>
    );
};

export default PresentationNavigation;

