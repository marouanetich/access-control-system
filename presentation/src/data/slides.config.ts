import { ShieldAlert, Database, Activity, BarChart3, Settings, Users, ScanFace, Server, Monitor, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SlideType = 'hero' | 'simple' | 'screenshot' | 'grid' | 'tech' | 'cta' | 'architecture' | 'metrics' | 'implementation' | 'hook' | 'agenda' | 'comparison' | 'takeaways' | 'divider';

export interface SlideConfig {
    id: string;
    type: SlideType;
    theme: string; // Tailwind gradient classes
    content: {
        title: string;
        subtitle?: string;
        description?: string[]; // Paragraphs
        bullets?: string[];
        image?: {
            src: string;
            alt: string;
            caption?: string;
            position?: 'left' | 'right';
        };
        gridItems?: {
            icon: LucideIcon;
            title: string;
            desc: string;
        }[];
        techCategories?: {
            name: string;
            items: string[];
        }[];
        architecture?: {
            layers: {
                name: string;
                description: string;
                technologies: string[];
            }[];
        };
        metrics?: {
            label: string;
            value: string;
            trend?: 'up' | 'down' | 'stable';
            description: string;
        }[];
        implementation?: {
            phase: string;
            description: string;
            technologies: string[];
        }[];
        hookStatistic?: {
            value: string;
            label: string;
            description: string;
        };
        agendaItems?: {
            title: string;
            description: string;
            targetId?: string;
        }[];
        comparison?: {
            title: string;
            items: {
                feature: string;
                biosec: string | boolean;
                traditional: string | boolean;
            }[];
        };
        takeaways?: string[];
        sectionTitle?: string;
        sectionNumber?: number;
    };
}

export const slides: SlideConfig[] = [
    // 1. Hero
    {
        id: 'hero',
        type: 'hero',
        theme: 'bg-slide-1',
        content: {
            title: 'BIOSEC',
            subtitle: 'SYSTÈME D\'ACCÈS BIOMÉTRIQUE',
            description: [
                'Projet de fin de module : Sécurité Physique',
                'Présenté par : MAROUANE BOUKAR & MOHAMED-TAHA TAHIRI-EL ALAOUI',
                'Encadré par : Mme Soukayna RIFFI BOUALAM'
            ]
        }
    },
    // 2. Content Map
    {
        id: 'content-map',
        type: 'agenda',
        theme: 'bg-slide-agenda',
        content: {
            title: 'Plan de Présentation',
            subtitle: 'Structure du Projet',
            agendaItems: [
                { title: 'Vue d\'Ensemble', description: 'Architecture full-stack et composants principaux', targetId: 'overview' },
                { title: 'Modèles de Reconnaissance', description: 'Pipeline ONNX : YuNet + ArcFace', targetId: 'models' },
                { title: 'Fonctionnalités de Sécurité', description: 'Blocage 3 tentatives et anti-replay', targetId: 'security' },
                { title: 'Implémentation Backend', description: 'FastAPI, services modulaires, endpoints', targetId: 'backend' },
                { title: 'Implémentation Frontend', description: 'React, composants, polling temps réel', targetId: 'frontend' },
                { title: 'Fonctionnalités Avancées', description: 'Simulation, audit, dashboard SOC', targetId: 'features' },
                { title: 'Utilisation du Système', description: 'Guide avec captures d\'écran', targetId: 'howto-dashboard' }
            ]
        }
    },
    // 3. Project Overview (Architecture)
    {
        id: 'overview',
        type: 'architecture',
        theme: 'bg-slide-2',
        content: {
            title: 'Vue d\'Ensemble du Projet',
            subtitle: 'Architecture Full-Stack',
            description: [
                'BIOSEC est une plateforme de contrôle d\'accès biométrique avec traitement serveur-side et interface React en temps réel.'
            ],
            architecture: {
                layers: [
                    {
                        name: 'Frontend React',
                        description: 'Interface utilisateur avec Dashboard, Access Control, Threat Simulation, Security Logs. Polling temps réel et alertes audio.',
                        technologies: ['React 19', 'TypeScript', 'Vite', 'Recharts', 'Lucide Icons']
                    },
                    {
                        name: 'API Backend FastAPI',
                        description: 'Endpoints REST pour authentification, enrôlement, vérification. Gestion d\'état in-memory et services modulaires.',
                        technologies: ['FastAPI', 'Uvicorn', 'Pydantic', 'CORS']
                    },
                    {
                        name: 'Moteur Biométrique',
                        description: 'FaceService charge les modèles ONNX au démarrage. Pipeline : détection → liveness → embedding → matching 1:N.',
                        technologies: ['OpenCV', 'ONNX Runtime', 'ArcFace', 'YuNet']
                    },
                    {
                        name: 'Sécurité & Audit',
                        description: 'SystemState gère le verrouillage (3 tentatives). AuditService enregistre tous les événements avec IP source.',
                        technologies: ['SystemState', 'AuditService', 'Nonce Validation']
                    }
                ]
            }
        }
    },
    // 4. Face Recognition Models (Grid)
    {
        id: 'models',
        type: 'grid',
        theme: 'bg-slide-3',
        content: {
            title: 'Modèles de Reconnaissance Faciale',
            subtitle: 'Pipeline ONNX : YuNet + ArcFace',
            gridItems: [
                {
                    icon: ScanFace,
                    title: 'YuNet Détecteur',
                    desc: 'face_detection_yunet_2023mar.onnx - OpenCV FaceDetectorYN (320x320, score_threshold=0.75). Détecte les visages et retourne bounding boxes avec landmarks - backend/face_service.py:38'
                },
                {
                    icon: Activity,
                    title: 'ArcFace Reconnaissance',
                    desc: 'w600k_r50.onnx - ResNet50 via ONNX Runtime. Extrait embeddings 512D normalisés depuis faces alignées 112x112 - backend/face_service.py:55, 189-195'
                },
                {
                    icon: ShieldAlert,
                    title: 'Vérifications Qualité',
                    desc: 'Liveness : blur (Laplacian > 20), luminosité (40-220). Géométrie : taille >15% image, centrage, marges - backend/face_service.py:69-162'
                },
                {
                    icon: Lock,
                    title: 'Matching 1:N',
                    desc: 'Similarité cosinus entre embeddings (SIMILARITY_THRESHOLD=0.5). Recherche dans users_db pour trouver meilleur match - backend/main.py:359-369'
                }
            ]
        }
    },
    // 5. Security Features (Simple with bullets)
    {
        id: 'security',
        type: 'simple',
        theme: 'bg-slide-4',
        content: {
            title: 'Fonctionnalités de Sécurité',
            subtitle: 'Blocage après 3 Tentatives et Protection Anti-Replay',
            description: [
                'Le système implémente un mécanisme de verrouillage automatique et des protections contre les attaques par rejeu.'
            ],
            bullets: [
                'Blocage après 3 échecs : SystemState.record_failure() incrémente, trigger_lock() si failures[key] >= FAILURE_THRESHOLD (3) - backend/main.py:83-99',
                'Verrouillage global 60s : LOCK_DURATION=60s, toutes requêtes bloquées via check_system_lock() - backend/main.py:143-149',
                'Protection anti-replay : Nonces UUID par /auth/challenge, validés dans /auth/verify, supprimés après usage - backend/main.py:218-226, 324-336',
                'Détection vivacité serveur-side : Blur (Laplacian), luminosité, qualité avant matching - backend/face_service.py:69-89',
                'Tracking IP/username : system_state.record_failure(client_ip) et record_failure(username) pour détecter usurpation',
                'Audit logging : Tous événements (VERIFY_SUCCESS, VERIFY_FAIL, SYSTEM_LOCKDOWN) avec IP source - backend/audit_service.py'
            ]
        }
    },
    // 6. Backend Implementation (Tech Stack)
    {
        id: 'backend',
        type: 'tech',
        theme: 'bg-slide-5',
        content: {
            title: 'Implémentation Backend',
            subtitle: 'Stack Technique et Architecture',
            description: [
                'Le backend FastAPI est structuré en services modulaires avec gestion d\'état in-memory et endpoints REST.'
            ],
            techCategories: [
                {
                    name: 'Framework & Runtime',
                    items: ['FastAPI 0.109.0', 'Uvicorn 0.27.0', 'Python 3.9+', 'Pydantic 2.6.0']
                },
                {
                    name: 'Computer Vision',
                    items: ['OpenCV 4.9.0', 'ONNX Runtime 1.17.0', 'NumPy 1.26.3']
                },
                {
                    name: 'Services Principaux',
                    items: ['FaceService (modèles ONNX)', 'AuditService (logs)', 'SystemState (verrouillage)', 'ThreatService (simulation)']
                },
                {
                    name: 'Endpoints API',
                    items: ['/auth/challenge (nonce)', '/auth/register (création)', '/auth/enroll (enrôlement)', '/auth/verify (vérification 1:N)', '/api/status (lockout)', '/api/metrics (dashboard)']
                },
                {
                    name: 'Gestion État',
                    items: ['users_db (Dict[str, UserRecord])', 'nonces_db (Dict[str, float])', 'system_state (SystemState)', 'Nettoyage nonces expirés (>60s)']
                }
            ]
        }
    },
    // 7. Frontend Implementation (Grid)
    {
        id: 'frontend',
        type: 'grid',
        theme: 'bg-slide-6',
        content: {
            title: 'Implémentation Frontend',
            subtitle: 'Interface React avec Visualisation Temps Réel',
            gridItems: [
                {
                    icon: Monitor,
                    title: 'Stack Technique',
                    desc: 'React 19.2.3, TypeScript 5.8.2, Vite 6.2.0, Recharts 3.5.1, Lucide React - frontend/package.json'
                },
                {
                    icon: Activity,
                    title: 'Pages Principales',
                    desc: 'Dashboard (métriques), AccessControl (enrôlement/vérification), AttackSimulation, SecurityLogs - frontend/pages/'
                },
                {
                    icon: Users,
                    title: 'Composants Réutilisables',
                    desc: 'BiometricVisualizer (caméra), SystemLockdown (alerte), Layout (navigation sidebar) - frontend/components/'
                },
                {
                    icon: Server,
                    title: 'Services API',
                    desc: 'BackendAPI (appels REST vers FastAPI), MockBackend (fallback dev) - frontend/services/api.ts'
                },
                {
                    icon: BarChart3,
                    title: 'Polling Temps Réel',
                    desc: 'Dashboard poll /api/metrics (5s), /api/logs (2s), /api/status (1s) pour lockout - frontend/pages/Dashboard.tsx:34-44'
                },
                {
                    icon: ShieldAlert,
                    title: 'Alertes Audio',
                    desc: 'Web Audio API déclenché lors verrouillage (oscillateur 440Hz) - frontend/App.tsx:40-111'
                }
            ]
        }
    },
    // 8. Additional Features (Grid)
    {
        id: 'features',
        type: 'grid',
        theme: 'bg-slide-11',
        content: {
            title: 'Fonctionnalités Additionnelles',
            subtitle: 'Simulation, Audit, et Dashboard SOC',
            gridItems: [
                { 
                    icon: Activity, 
                    title: "Moteur de Simulation", 
                    desc: "ThreatService exécute 6 types d'attaques (Replay, Tampering, Brute Force, Threshold Manipulation, Unauthorized Enrollment, Session Hijacking) - backend/threat_service.py" 
                },
                { 
                    icon: BarChart3, 
                    title: "Dashboard Métriques", 
                    desc: "Visualisation Recharts : total_auths_1h, access_denied_24h, active_threats, timeline événements - frontend/pages/Dashboard.tsx" 
                },
                { 
                    icon: Database, 
                    title: "Journal d'Audit", 
                    desc: "Logs immuables LogEntry (eventType, severity, sourceIp, timestamp ISO 8601), limit 1000 entrées - backend/audit_service.py:22-43" 
                },
                { 
                    icon: ShieldAlert, 
                    title: "Gestion Multi-Rôles", 
                    desc: "UserRecord avec rôles (USER, ADMIN, SECURITY_ENGINEER), contrôle d'accès basé sur rôles dans endpoints" 
                },
                { 
                    icon: Settings, 
                    title: "Configuration Dynamique", 
                    desc: "Seuil similarité ajustable (SIMILARITY_THRESHOLD=0.5), durée verrouillage configurable (LOCK_DURATION=60s)" 
                },
                { 
                    icon: Users, 
                    title: "Enrôlement Sécurisé", 
                    desc: "/auth/enroll vérifie liveness, empêche écrasement (embedding déjà présent), valide qualité géométrique - backend/main.py:252-304" 
                }
            ]
        }
    },
    // 9. How to Use - Dashboard Screenshot
    {
        id: 'howto-dashboard',
        type: 'screenshot',
        theme: 'bg-slide-7',
        content: {
            title: 'Utilisation : Dashboard',
            subtitle: 'Vue d\'Ensemble des Métriques',
            description: [
                'Le Dashboard affiche les métriques de sécurité en temps réel avec graphiques interactifs et timeline des événements.',
                'Navigation : Clic sur "Overview" dans la sidebar pour accéder aux statistiques globales.'
            ],
            image: {
                src: '/assets/01_dashboard.png',
                alt: 'Dashboard BIOSEC avec métriques',
                caption: 'Dashboard montrant total_auths_1h, access_denied_24h, active_threats, et timeline d\'événements (frontend/pages/Dashboard.tsx)',
                position: 'left'
            }
        }
    },
    // 10. How to Use - Access Control Screenshot
    {
        id: 'howto-access',
        type: 'screenshot',
        theme: 'bg-slide-8',
        content: {
            title: 'Utilisation : Contrôle d\'Accès',
            subtitle: 'Enrôlement et Vérification Faciale',
            description: [
                'Page Access Control permet l\'enrôlement de nouveaux utilisateurs et la vérification faciale en temps réel.',
                'Flux : 1) Register (créer identité), 2) Enroll (capturer visage), 3) Verify (authentification) - frontend/pages/AccessControl.tsx'
            ],
            image: {
                src: '/assets/02_access_control.png',
                alt: 'Interface Contrôle d\'Accès',
                caption: 'Interface d\'enrôlement et vérification avec caméra, visualisation biométrique, et feedback en temps réel',
                position: 'right'
            }
        }
    },
    // 11. How to Use - Threat Simulation Screenshot
    {
        id: 'howto-threats',
        type: 'screenshot',
        theme: 'bg-slide-9',
        content: {
            title: 'Utilisation : Simulation de Menaces',
            subtitle: 'Test de Résilience',
            description: [
                'Le moteur de simulation permet d\'émuler différents types d\'attaques pour tester les défenses du système.',
                'Sélection : Type d\'attaque (Replay, Tampering, Brute Force, etc.), utilisateur cible, niveau sécurité (LOW/HIGH) - frontend/pages/AttackSimulation.tsx'
            ],
            image: {
                src: '/assets/03_threat_sim.png',
                alt: 'Interface Simulation de Menaces',
                caption: 'Interface de simulation avec sélection d\'attaque, profils de sécurité, et résultats de test (backend/threat_service.py)',
                position: 'left'
            }
        }
    },
    // 12. How to Use - Audit Logs Screenshot
    {
        id: 'howto-logs',
        type: 'screenshot',
        theme: 'bg-slide-10',
        content: {
            title: 'Utilisation : Journal d\'Audit',
            subtitle: 'Traçabilité Complète',
            description: [
                'Le journal d\'audit enregistre tous les événements de sécurité avec timestamp, sévérité, IP source, et détails.',
                'Filtrage : Par type d\'événement, sévérité (INFO, WARNING, CRITICAL), utilisateur, période - frontend/pages/SecurityLogs.tsx'
            ],
            image: {
                src: '/assets/04_audit_logs.png',
                alt: 'Interface Journal d\'Audit',
                caption: 'Journal d\'audit avec événements signés cryptographiquement, filtres avancés, et export (backend/audit_service.py)',
                position: 'right'
            }
        }
    },
    // 13. CTA
    {
        id: 'cta',
        type: 'cta',
        theme: 'bg-slide-17',
        content: {
            title: 'Démonstration',
            subtitle: 'Code Source et Documentation',
            description: [
                'Le projet est disponible avec documentation complète et instructions de déploiement.'
            ],
            bullets: [
                'Repository GitHub : https://github.com/marouanetich/access-control-system',
                'Documentation : README.md avec instructions backend/frontend',
                'Modèles ONNX requis : face_detection_yunet_2023mar.onnx, w600k_r50.onnx',
                'Stack validée : Python 3.9+, Node.js 18+, FastAPI, React 19'
            ]
        }
    }
];
