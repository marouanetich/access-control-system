import React, { useState, useEffect, useRef } from 'react';
import HeroSlide from './components/HeroSlide';
import IntroSplitSlide from './components/IntroSplitSlide';
import Slide from './components/Slide';
import ContentSlide from './components/ContentSlide';
import ScreenshotSlide from './components/ScreenshotSlide';
import ArchitectureSlide from './components/ArchitectureSlide';
import MetricsSlide from './components/MetricsSlide';
import ImplementationSlide from './components/ImplementationSlide';
import GridSlide from './components/GridSlide';
import HookSlide from './components/HookSlide';
import AgendaSlide from './components/AgendaSlide';
import ComparisonSlide from './components/ComparisonSlide';
import TakeawaysSlide from './components/TakeawaysSlide';
import DividerSlide from './components/DividerSlide';
import PresentationNavigation from './components/PresentationNavigation';
import SlideTitle from './components/SlideTitle';
import { slides } from './data/slides.config';
import { Code2 } from 'lucide-react';

const App: React.FC = () => {
  // State to track current theme for smooth transitions
  const [currentTheme, setCurrentTheme] = useState('bg-slide-1');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Focus the container on mount to enable arrow key navigation immediately
    containerRef.current?.focus();

    // Function to enter fullscreen
    const enterFullscreen = async () => {
      try {
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          // Safari
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          // Firefox
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          // IE/Edge
          await (element as any).msRequestFullscreen();
        }
      } catch (error) {
        // Fullscreen requires user interaction
        console.log('Fullscreen requires user interaction');
      }
    };

    // Check if we should auto-enter fullscreen (on first load/reload)
    const shouldAutoFullscreen = !sessionStorage.getItem('fullscreenPrompted');
    
    // Handler for first user interaction to enter fullscreen
    const handleFirstInteraction = async () => {
      if (shouldAutoFullscreen) {
        await enterFullscreen();
        sessionStorage.setItem('fullscreenPrompted', 'true');
        // Remove listeners after first interaction
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
      }
    };

    // Add listeners for first interaction
    if (shouldAutoFullscreen) {
      document.addEventListener('click', handleFirstInteraction, { once: true });
      document.addEventListener('keydown', handleFirstInteraction, { once: true });
    }

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const slides = containerRef.current?.querySelectorAll('section');
      if (!slides) return;

      const scrollPosition = containerRef.current?.scrollTop || 0;
      const slideHeight = window.innerHeight;

      const currentIndex = Math.round(scrollPosition / slideHeight);
      setCurrentSlideIndex(Math.min(currentIndex, slides.length - 1));
    };

    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSlideEnter = (theme: string) => {
    setCurrentTheme(theme);
  };

  const scrollToSlide = (index: number) => {
    const slides = containerRef.current?.querySelectorAll('section');
    if (slides && slides[index]) {
      slides[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentSlideIndex(index);
    }
  };

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      scrollToSlide(currentSlideIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      scrollToSlide(currentSlideIndex + 1);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'F11') {
        e.preventDefault();
        // Toggle fullscreen on F11
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlideIndex]);

  return (
    <div
      id="presentation-container"
      ref={containerRef}
      tabIndex={0}
      className={`text-slate-900 antialiased transition-all duration-[2000ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${currentTheme} h-screen overflow-y-scroll snap-y snap-mandatory outline-none`}
      role="application"
      aria-label="BIOSEC Presentation">
      <a href="#hero" className="skip-to-content">
        Aller au contenu principal
      </a>

      {slides.map((slide) => {
        const commonProps = {
          key: slide.id,
          id: slide.id,
          onEnter: () => handleSlideEnter(slide.theme),
        };

        switch (slide.type) {
          case 'hook':
            return (
              <HookSlide
                {...commonProps}
                title={slide.content.title}
                subtitle={slide.content.subtitle}
                description={slide.content.description}
                hookStatistic={slide.content.hookStatistic}
              />
            );

          case 'hero':
            return (
              <Slide key={slide.id} id={slide.id} onEnter={() => handleSlideEnter(slide.theme)} className="">
                <HeroSlide />
              </Slide>
            );

          case 'agenda':
            return (
              <AgendaSlide
                {...commonProps}
                title={slide.content.title}
                subtitle={slide.content.subtitle}
                agendaItems={slide.content.agendaItems}
                onNavigate={(targetId) => {
                  const targetIndex = slides.findIndex(s => s.id === targetId);
                  if (targetIndex !== -1) {
                    scrollToSlide(targetIndex);
                  }
                }}
              />
            );

          case 'divider':
            return (
              <DividerSlide
                {...commonProps}
                sectionTitle={slide.content.sectionTitle}
                subtitle={slide.content.subtitle}
                sectionNumber={slide.content.sectionNumber}
              />
            );

          case 'simple':
            if (slide.id === 'context') {
              return (
                <IntroSplitSlide
                  key={slide.id}
                  id={slide.id}
                  title={slide.content.title}
                  subtitle={slide.content.subtitle}
                  description={slide.content.description}
                  onEnter={() => handleSlideEnter(slide.theme)}
                />
              );
            }
            return (
              <ContentSlide
                {...commonProps}
                title={slide.content.title}
                subtitle={slide.content.subtitle}
                description={slide.content.description}
                bullets={slide.content.bullets}
              />
            );

          case 'screenshot':
            return (
              <Slide {...commonProps} className="">
                <ScreenshotSlide
                  title={slide.content.title}
                  subtitle={slide.content.subtitle}
                  description={slide.content.description}
                  imageSrc={slide.content.image?.src || ''}
                  imageAlt={slide.content.image?.alt || ''}
                  imageCaption={slide.content.image?.caption}
                  reverse={slide.content.image?.position === 'right'}
                />
              </Slide>
            );

          case 'grid':
            return (
              <GridSlide
                {...commonProps}
                title={slide.content.title}
                subtitle={slide.content.subtitle}
                gridItems={slide.content.gridItems || []}
              />
            );

          case 'tech':
            return (
              <Slide {...commonProps} className="">
                <div className="text-center mb-6">
                  <SlideTitle className="!text-3xl md:!text-4xl">{slide.content.title}</SlideTitle>
                  <p className="text-slate-500 mt-2 max-w-2xl mx-auto text-sm">{slide.content.description?.[0]}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl">
                  {slide.content.techCategories?.map((category, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200 hover:border-blue-500/50 transition-all group shadow-lg hover:shadow-xl">
                      <h3 className="text-blue-600 font-bold mb-3 tracking-wider uppercase text-xs border-b border-slate-100 pb-1.5">{category.name}</h3>
                      <ul className="space-y-2">
                        {category.items.map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-slate-600 group-hover:text-slate-900 transition-colors">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 group-hover:bg-blue-500 transition-colors" />
                            <span className="font-mono text-xs">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-12 text-slate-400 flex items-center gap-2 justify-center">
                  <Code2 size={20} />
                  <span className="font-mono text-sm">Full-Stack Biometric Security Infrastructure</span>
                </div>
              </Slide>
            );

          case 'architecture':
            return (
              <Slide {...commonProps} className="">
                <ArchitectureSlide
                  title={slide.content.title}
                  subtitle={slide.content.subtitle}
                  description={slide.content.description}
                  architecture={slide.content.architecture!}
                />
              </Slide>
            );

          case 'metrics':
            return (
              <Slide {...commonProps} className="">
                <MetricsSlide
                  title={slide.content.title}
                  subtitle={slide.content.subtitle}
                  description={slide.content.description}
                  metrics={slide.content.metrics!}
                />
              </Slide>
            );

          case 'implementation':
            return (
              <Slide {...commonProps} className="">
                <ImplementationSlide
                  title={slide.content.title}
                  subtitle={slide.content.subtitle}
                  description={slide.content.description}
                  implementation={slide.content.implementation!}
                />
              </Slide>
            );

          case 'comparison':
            return (
              <ComparisonSlide
                {...commonProps}
                title={slide.content.title}
                subtitle={slide.content.subtitle}
                comparison={slide.content.comparison}
              />
            );

          case 'takeaways':
            return (
              <TakeawaysSlide
                {...commonProps}
                title={slide.content.title}
                subtitle={slide.content.subtitle}
                takeaways={slide.content.takeaways}
              />
            );

          case 'cta':
            return (
              <Slide {...commonProps} className="">
                <div className="text-center relative z-10 py-4 max-w-4xl mx-auto">
                  <h2 className="text-4xl md:text-6xl font-black mb-4 text-slate-900 tracking-tighter">{slide.content.title}</h2>
                  <p className="text-base md:text-lg text-slate-500 mb-6">{slide.content.subtitle}</p>
                  {slide.content.description && (
                    <div className="space-y-3 mb-8 text-left">
                      {slide.content.description.map((para, i) => (
                        <p key={i} className="text-base text-slate-600">{para}</p>
                      ))}
                    </div>
                  )}
                  {slide.content.bullets && (
                    <ul className="space-y-2 mb-8 text-left max-w-2xl mx-auto">
                      {slide.content.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button className="px-8 py-3 bg-blue-600 text-white text-base md:text-lg font-bold rounded-full hover:bg-blue-700 hover:scale-105 transition-all duration-300 shadow-[0_20px_50px_rgba(37,99,235,0.3)]">
                    Démarrer la Démo
                  </button>
                </div>
              </Slide>
            );

          default:
            return null;
        }
      })}

      <PresentationNavigation
        currentSlide={currentSlideIndex}
        totalSlides={slides.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </div>
  );
};

export default App;
