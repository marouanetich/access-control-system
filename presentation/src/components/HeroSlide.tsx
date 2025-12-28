import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ShieldCheck, Lock, ScanFace, Database, Activity, Code2, Server, Monitor } from 'lucide-react';

const HeroSlide: React.FC = () => {
    const leftRef = useRef<HTMLDivElement>(null);
    const rightRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const iconRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

        // Left section entry
        tl.fromTo(leftRef.current?.children || [],
            { x: -80, opacity: 0 },
            { x: 0, opacity: 1, duration: 1, stagger: 0.12 },
            0
        );

        // Right section entry
        tl.fromTo(rightRef.current?.children || [],
            { x: 80, opacity: 0 },
            { x: 0, opacity: 1, duration: 1, stagger: 0.12 },
            0.15
        );

        // Icon animation
        if (iconRef.current) {
            gsap.fromTo(iconRef.current,
                { scale: 0, rotation: -180, opacity: 0 },
                { scale: 1, rotation: 0, opacity: 1, duration: 1.2, ease: "back.out(1.7)", delay: 0.3 }
            );
        }

        // Title animation
        if (titleRef.current) {
            gsap.fromTo(titleRef.current,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.5 }
            );
        }

        // Features animation
        if (featuresRef.current) {
            gsap.fromTo(featuresRef.current.children,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power2.out", delay: 0.8 }
            );
        }

        // Subtle icon float
        if (iconRef.current) {
            gsap.to(iconRef.current, {
                y: 10,
                rotation: 3,
                duration: 4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }

    }, []);

    return (
        <div className="overflow-hidden relative font-sans w-full h-full flex items-center justify-center">
            {/* Enhanced Background with Gradient */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20"></div>
                <div className="absolute top-[-15%] left-[-5%] w-[50%] h-[50%] bg-blue-400/8 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-15%] right-[-5%] w-[50%] h-[50%] bg-indigo-400/8 blur-[120px] rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-gradient-to-r from-blue-200/5 to-purple-200/5 blur-[100px] rounded-full"></div>
            </div>

            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* LEFT SECTION: Project Info */}
                    <div ref={leftRef} className="space-y-8">
                        {/* Project Badge */}
                        <div className="opacity-0">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 text-blue-700 font-bold tracking-wider text-xs uppercase shadow-sm">
                                <Code2 size={14} />
                                Projet de Sécurité Physique
                            </span>
                        </div>

                        {/* Institution */}
                        <div className="opacity-0 space-y-1">
                            <p className="text-slate-500 text-sm font-medium">Faculté des Sciences</p>
                            <p className="text-slate-900 text-xl font-semibold">Moulay Ismaïl Meknès</p>
                        </div>

                        {/* Contributors Section */}
                        <div className="opacity-0 space-y-6 pt-4">
                            <div>
                                <p className="text-blue-600/70 text-xs font-bold tracking-[0.3em] uppercase mb-4">Réalisé par</p>
                                <div className="space-y-3">
                                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                                        MAROUANE<br />ABOUKAR
                                    </h2>
                                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] italic">
                                        MOHAMED-TAHA<br />TAHIRI-EL ALAOUI
                                    </h2>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-200/60">
                                <p className="text-blue-600/70 text-xs font-bold tracking-[0.3em] uppercase mb-3">Encadré par</p>
                                <p className="text-xl md:text-2xl font-bold text-blue-600 italic">
                                    Mme Soukayna RIFFI BOUALAM
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SECTION: Brand & Features */}
                    <div ref={rightRef} className="flex flex-col items-center lg:items-start space-y-8">
                        {/* Icon */}
                        <div ref={iconRef} className="relative opacity-0">
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 blur-2xl rounded-full animate-pulse"></div>
                            <div className="relative p-8 rounded-3xl bg-white/95 border-2 border-slate-200/50 shadow-2xl backdrop-blur-xl">
                                <ShieldCheck size={72} className="text-blue-600 drop-shadow-[0_0_30px_rgba(59,130,246,0.4)]" />
                            </div>
                        </div>

                        {/* Title */}
                        <div ref={titleRef} className="text-center lg:text-left opacity-0 space-y-3">
                            <h1 className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none">
                                <span className="bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-blue-700 to-indigo-700">
                                    BIOSEC
                                </span>
                            </h1>
                            <div className="flex items-center gap-3 justify-center lg:justify-start">
                                <div className="h-1 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
                                <p className="text-sm md:text-base font-semibold tracking-[0.2em] text-blue-600 uppercase">
                                    Système Biométrique
                                </p>
                            </div>
                        </div>

                        {/* Feature Pills */}
                        <div ref={featuresRef} className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full opacity-0">
                            <div className="group px-4 py-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 hover:border-blue-400 transition-all shadow-sm hover:shadow-md flex flex-col items-center gap-2">
                                <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                                    <ScanFace size={20} className="text-blue-600" />
                                </div>
                                <span className="text-xs font-bold text-blue-700 text-center">Reconnaissance<br />Faciale</span>
                            </div>
                            <div className="group px-4 py-3 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/50 hover:border-indigo-400 transition-all shadow-sm hover:shadow-md flex flex-col items-center gap-2">
                                <div className="p-2 rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                                    <Lock size={20} className="text-indigo-600" />
                                </div>
                                <span className="text-xs font-bold text-indigo-700 text-center">Sécurité<br />Avancée</span>
                            </div>
                            <div className="group px-4 py-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50 hover:border-purple-400 transition-all shadow-sm hover:shadow-md flex flex-col items-center gap-2">
                                <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                                    <Database size={20} className="text-purple-600" />
                                </div>
                                <span className="text-xs font-bold text-purple-700 text-center">Audit<br />Immutable</span>
                            </div>
                        </div>

                        {/* Tech Stack */}
                        <div className="opacity-0 px-5 py-3 rounded-xl bg-slate-50/80 border border-slate-200/50 backdrop-blur-sm shadow-sm">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2 text-center">Stack Technique</p>
                            <div className="flex items-center justify-center gap-4 text-sm font-mono text-slate-700">
                                <div className="flex items-center gap-2">
                                    <Server size={14} className="text-blue-600" />
                                    <span>FastAPI</span>
                                </div>
                                <span className="text-slate-300">•</span>
                                <div className="flex items-center gap-2">
                                    <Monitor size={14} className="text-indigo-600" />
                                    <span>React 19</span>
                                </div>
                                <span className="text-slate-300">•</span>
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-purple-600" />
                                    <span>ONNX</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default HeroSlide;
