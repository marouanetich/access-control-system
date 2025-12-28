import React, { useEffect, useRef } from 'react';
import Slide from './Slide';
import SlideTitle from './SlideTitle';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface AgendaSlideProps {
    id: string;
    title: string;
    subtitle?: string;
    agendaItems?: {
        title: string;
        description: string;
        targetId?: string;
    }[];
    onEnter?: () => void;
    onNavigate?: (targetId: string) => void;
}

const AgendaSlide: React.FC<AgendaSlideProps> = ({ id, title, subtitle, agendaItems, onEnter, onNavigate }) => {
    const handleItemClick = (targetId?: string) => {
        if (targetId && onNavigate) {
            onNavigate(targetId);
        }
    };
    const containerRef = useRef<HTMLDivElement>(null);
    const itemsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const items = itemsRef.current?.querySelectorAll('.agenda-item');
        if (!items) return;

        gsap.fromTo(items,
            { x: -50, opacity: 0 },
            {
                x: 0,
                opacity: 1,
                duration: 0.7,
                stagger: 0.15,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: el,
                    scroller: "#presentation-container",
                    start: "top 60%",
                }
            }
        );

        // Animate checkmarks
        items.forEach((item, i) => {
            const checkmark = item.querySelector('.agenda-checkmark');
            if (checkmark) {
                gsap.fromTo(checkmark,
                    { scale: 0, rotation: -180 },
                    {
                        scale: 1,
                        rotation: 0,
                        duration: 0.5,
                        delay: i * 0.15 + 0.4,
                        ease: "back.out(1.7)",
                        scrollTrigger: {
                            trigger: el,
                            scroller: "#presentation-container",
                            start: "top 60%",
                        }
                    }
                );
            }
        });
    }, []);

    return (
        <Slide id={id} className="" onEnter={onEnter}>
            <div ref={containerRef} className="max-w-5xl w-full py-4">
                <div className="text-center mb-8">
                    {subtitle && (
                        <p className="text-xs md:text-sm font-bold tracking-widest text-blue-600 uppercase mb-2">{subtitle}</p>
                    )}
                    <SlideTitle className="!text-3xl md:!text-4xl">{title}</SlideTitle>
                </div>

                <div ref={itemsRef} className="space-y-4">
                    {agendaItems?.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => handleItemClick(item.targetId)}
                            className={`agenda-item opacity-0 flex items-start gap-4 p-5 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200 hover:border-blue-500/50 transition-all shadow-lg hover:shadow-xl group ${item.targetId ? 'cursor-pointer' : ''}`}
                        >
                            <div className="agenda-checkmark flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                                <span className="text-lg font-black">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-sm md:text-base text-slate-600">{item.description}</p>
                            </div>
                            <ArrowRight className="text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0" size={20} />
                        </div>
                    ))}
                </div>
            </div>
        </Slide>
    );
};

export default AgendaSlide;

