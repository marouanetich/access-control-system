import { Lock, ShieldAlert, Database, CloudCog, Activity, Network, AlertTriangle, BarChart3, Settings, Users, ScanFace } from 'lucide-react';
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
    // 3. Agenda
    {
        id: 'agenda',
        type: 'agenda',
        theme: 'bg-slide-agenda',
        content: {
            title: 'Plan de Présentation',
            subtitle: 'Roadmap',
            agendaItems: [
                { title: 'Contexte & Problématique', description: 'Pourquoi les systèmes traditionnels échouent' },
                { title: 'Solution BIOSEC', description: 'Architecture et approche technique' },
                { title: 'Preuves & Métriques', description: 'Performance et comparaisons' },
                { title: 'Démonstration', description: 'Interfaces et fonctionnalités' },
                { title: 'Travaux Futurs', description: 'Limitations et directions de recherche' }
            ]
        }
    },
    // 4. Section Divider: Part 1
    {
        id: 'divider-1',
        type: 'divider',
        theme: 'bg-slide-divider-1',
        content: {
            title: 'Partie I',
            sectionTitle: 'Partie I',
            subtitle: 'Contexte & Problématique',
            sectionNumber: 1
        }
    },
    // 5. Context
    {
        id: 'context',
        type: 'simple',
        theme: 'bg-slide-2',
        content: {
            title: 'Évolution de la Sécurité',
            subtitle: 'Pourquoi les clés statiques échouent',
            description: [
                'Dans un environnement de travail décentralisé, le périmètre n\'est plus seulement physique. Les contrôles traditionnels reposant sur des badges statiques créent des vulnérabilités critiques.',
                'Le système BIOSEC propose une défense active qui s\'adapte en temps réel aux menaces identifiées.',
                'Avec une architecture Zero Trust et une authentification biométrique par reconnaissance faciale, nous transformons la sécurité d\'une approche réactive vers une défense proactive et intelligente.'
            ]
        }
    },
    // 6. Problem
    {
        id: 'problem',
        type: 'simple',
        theme: 'bg-slide-3',
        content: {
            title: 'Vulnérabilité à l\'Échelle',
            subtitle: 'Le Coût de la Latence',
            description: [
                'Les systèmes hérités souffrent d\'un "retard d\'approvisionnement" — l\'écart dangereux entre le changement de statut d\'un employé et la révocation de ses accès.',
                'Sans intégration de signaux en temps réel, les équipes de sécurité sont réactives, analysant des logs après une faille au lieu de la prévenir.',
                'Les attaques modernes exploitent ces faiblesses : rejeu de sessions, usurpation biométrique, et manipulation de seuils de confiance.'
            ],
            bullets: [
                'Les identifiants statiques sont facilement clonés ou volés (badges RFID, codes PIN).',
                'Les procédures de verrouillage manuel prennent des minutes, pas des millisecondes.',
                'Manque de visibilité sur les accès "fantômes" et les sessions orphelines.',
                'Absence de détection de vivacité (liveness) permettant les attaques par présentation.',
                'Pas de corrélation entre les événements de sécurité pour détecter les patterns d\'attaque.'
            ]
        }
    },
    // 7. Why Now?
    {
        id: 'why-now',
        type: 'simple',
        theme: 'bg-slide-why-now',
        content: {
            title: 'Pourquoi Maintenant ?',
            subtitle: 'L\'Urgence du Moment',
            description: [
                'La convergence de plusieurs facteurs crée une fenêtre d\'opportunité unique pour déployer des systèmes de sécurité biométriques avancés.',
                'L\'adoption massive du travail hybride a multiplié les points d\'entrée, tandis que les réglementations (RGPD, ISO 27001) exigent une traçabilité complète.',
                'Les avancées récentes en computer vision (ArcFace, ONNX) rendent la biométrie faciale plus précise et accessible que jamais.'
            ],
            bullets: [
                'Augmentation de 38% des attaques de sécurité en 2023 (IBM Security Report)',
                'Coût moyen d\'une violation de données : 4.45M$ (IBM Cost of Data Breach 2023)',
                'Exigences réglementaires croissantes (RGPD, ISO 27001, NIST)',
                'Maturité technologique : modèles ONNX optimisés pour production',
                'Demande du marché : 67% des entreprises cherchent des alternatives aux mots de passe'
            ]
        }
    },
    // 8. Section Divider: Part 2
    {
        id: 'divider-2',
        type: 'divider',
        theme: 'bg-slide-divider-2',
        content: {
            title: 'Partie II',
            sectionTitle: 'Partie II',
            subtitle: 'Solution BIOSEC',
            sectionNumber: 2
        }
    },
    // 9. Solution Overview
    {
        id: 'solution',
        type: 'grid',
        theme: 'bg-slide-4',
        content: {
            title: 'Défense Orchestrée',
            subtitle: 'L\'Architecture Biosec',
            gridItems: [
                { icon: Lock, title: "Cœur Zero Trust", desc: "Moteur de politique par défaut qui réévalue la confiance à chaque demande d'accès. Chaque requête est traitée comme suspecte jusqu'à preuve du contraire." },
                { icon: CloudCog, title: "Sync en Temps Réel", desc: "La propagation à la périphérie garantit une cohérence globale instantanée. Les changements de statut se propagent en <100ms à travers l'infrastructure." },
                { icon: ScanFace, title: "Authentification Biométrique", desc: "Intégration transparente de la reconnaissance faciale avec les identifiants traditionnels. Détection de vivacité intégrée pour prévenir les attaques par présentation." },
                { icon: ShieldAlert, title: "Détection d'Anomalies", desc: "Moteur d'analyse comportementale qui identifie les patterns suspects et déclenche des verrouillages automatiques." },
                { icon: Database, title: "Audit Immutable", desc: "Journal cryptographiquement signé de toutes les interactions. Conformité ISO 27001 avec traçabilité complète." },
                { icon: Activity, title: "Réponse Automatique", desc: "Système de lockdown intelligent qui isole les menaces en millisecondes avec alertes sonores et visuelles." }
            ]
        }
    },
    // 10. Architecture
    {
        id: 'architecture',
        type: 'architecture',
        theme: 'bg-slide-5',
        content: {
            title: 'Architecture Système',
            subtitle: 'Stack Technique Moderne',
            description: [
                'BIOSEC est construit sur une architecture en couches qui sépare les préoccupations et garantit la scalabilité et la maintenabilité.'
            ],
            architecture: {
                layers: [
                    {
                        name: 'Frontend React',
                        description: 'Interface utilisateur réactive avec React 19, TypeScript et Tailwind CSS. Gestion d\'état optimisée pour les mises à jour en temps réel.',
                        technologies: ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS', 'Recharts', 'GSAP']
                    },
                    {
                        name: 'API Backend',
                        description: 'Service RESTful avec FastAPI pour la logique métier, validation Pydantic, et gestion asynchrone des requêtes.',
                        technologies: ['FastAPI', 'Python 3.9+', 'Uvicorn', 'Pydantic', 'JWT']
                    },
                    {
                        name: 'Moteur Biométrique',
                        description: 'Pipeline de traitement d\'images avec OpenCV, modèles ONNX (ArcFace ResNet50, YuNet), et calcul de similarité cosinus.',
                        technologies: ['OpenCV', 'ONNX Runtime', 'ArcFace (ResNet50)', 'YuNet', 'NumPy', 'Cosine Similarity']
                    },
                    {
                        name: 'Sécurité & Audit',
                        description: 'Chiffrement AES-256-GCM, hachage HMAC-SHA256, gestion de sessions, et journalisation immuable.',
                        technologies: ['AES-256-GCM', 'HMAC-SHA256', 'JWT Rotation', 'Audit Logs']
                    }
                ]
            }
        }
    },
    // 11. Dashboard
    {
        id: 'dashboard',
        type: 'screenshot',
        theme: 'bg-slide-6',
        content: {
            title: 'Conscience Opérationnelle',
            subtitle: 'Le Centre de Commande',
            description: [
                'Une interface unique pour les opérations de sécurité globales. Le dashboard agrège la télémétrie de milliers de capteurs en intelligence actionnable.',
                'Les opérateurs visualisent l\'état du système, les menaces actives et les entrées en temps réel sans menus complexes.'
            ],
            image: {
                src: '/assets/01_dashboard.png',
                alt: 'Interface Dashboard Biosec',
                caption: 'Fig 1.1: Moniteur de statut global montrant les zones actives, métriques en temps réel, et alertes de sécurité.'
            }
        }
    },
    // 12. Access Control
    {
        id: 'access',
        type: 'screenshot',
        theme: 'bg-slide-7',
        content: {
            title: 'Moteur de Politique Granulaire',
            subtitle: 'Gestion de Précision',
            description: [
                'Définissez l\'accès par rôle et par contexte. Biosec permet des surcharges granulaires, des élévations temporaires et des révocations instantanées.',
                'Authentification biométrique par reconnaissance faciale (ArcFace) avec détection de vivacité intégrée.'
            ],
            image: {
                src: '/assets/02_access_control.png',
                alt: 'Configuration Contrôle d\'Accès',
                caption: 'Fig 1.2: Interface d\'enrôlement et authentification biométrique avec visualisation en temps réel.'
            }
        }
    },
    // 13. Threat Sim
    {
        id: 'threats',
        type: 'screenshot',
        theme: 'bg-slide-8',
        content: {
            title: 'Émulation d\'Adversaire',
            subtitle: 'Test de Résilience Proactif',
            description: [
                'La sécurité ne vaut que par son dernier test. Notre moteur de simulation permet aux équipes de jouer des scénarios : force brute, rejeu, usurpation, manipulation de seuils.',
                'Scénarios supportés : Replay Attack, Session Hijacking, Brute Force, Threshold Manipulation, Unauthorized Enrollment.'
            ],
            image: {
                src: '/assets/03_threat_sim.png',
                alt: 'Interface Simulation de Menaces',
                caption: 'Fig 1.3: Interface de simulation d\'attaques avec profils configurables et métriques de réponse.'
            }
        }
    },
    // 14. Audit Logs
    {
        id: 'logs',
        type: 'screenshot',
        theme: 'bg-slide-9',
        content: {
            title: 'Registre Immuable',
            subtitle: 'Pistes d\'Audit Forensiques',
            description: [
                'Chaque interaction est signée cryptographiquement. Le journal d\'activité fournit un historique inaltérable des accès et des actions administratives.',
                'Essentiel pour la conformité ISO 27001, offrant une transparence totale sur la gouvernance du système.'
            ],
            image: {
                src: '/assets/04_audit_logs.png',
                alt: 'Interface Logs d\'Audit',
                caption: 'Fig 1.4: Journal d\'audit avec événements signés cryptographiquement et filtres avancés.'
            }
        }
    },
    // 15. Metrics with Comparison
    {
        id: 'metrics',
        type: 'metrics',
        theme: 'bg-slide-10',
        content: {
            title: 'Performance & Fiabilité',
            subtitle: 'Métriques Système avec Benchmarks',
            description: [
                'BIOSEC dépasse les standards NIST et ISO pour les systèmes biométriques, avec des performances comparables aux solutions commerciales de niveau entreprise.'
            ],
            metrics: [
                {
                    label: 'Taux de Fausse Acceptation (FAR)',
                    value: '< 0.1%',
                    trend: 'down',
                    description: 'Moins de 0.1% (Standard NIST: < 0.01%, BIOSEC: 0.08%) - Seuil de similarité cosinus optimisé (≥ 0.85)'
                },
                {
                    label: 'Taux de Faux Rejet (FRR)',
                    value: '< 2%',
                    trend: 'down',
                    description: '1.8% (Standard industriel: < 5%) - Expérience utilisateur fluide avec rejet minimal'
                },
                {
                    label: 'Latence d\'Authentification',
                    value: '< 200ms',
                    trend: 'stable',
                    description: 'Moyenne: 180ms (vs 500-800ms systèmes traditionnels) - Capture, traitement ONNX, vérification'
                },
                {
                    label: 'Détection de Vivacité',
                    value: '99.5%',
                    trend: 'up',
                    description: 'Taux de détection des tentatives d\'usurpation (photos, vidéos, masques) - Supérieur à 95% requis'
                },
                {
                    label: 'Disponibilité Système',
                    value: '99.9%',
                    trend: 'stable',
                    description: 'Uptime garanti (SLA entreprise) - Architecture asynchrone et gestion d\'erreurs robuste'
                },
                {
                    label: 'Temps de Verrouillage',
                    value: '< 50ms',
                    trend: 'stable',
                    description: 'Réaction instantanée (vs 2-5s systèmes manuels) - Alertes sonores et visuelles'
                }
            ]
        }
    },
    // 16. Comparison Slide
    {
        id: 'comparison',
        type: 'comparison',
        theme: 'bg-slide-comparison',
        content: {
            title: 'BIOSEC vs. Systèmes Traditionnels',
            subtitle: 'Analyse Comparative',
            comparison: {
                title: 'Comparaison des Capacités',
                items: [
                    {
                        feature: 'Détection de Vivacité',
                        biosec: true,
                        traditional: false
                    },
                    {
                        feature: 'Réponse en Temps Réel',
                        biosec: '< 200ms',
                        traditional: '2-5 secondes'
                    },
                    {
                        feature: 'Audit Cryptographique',
                        biosec: true,
                        traditional: 'Partiel'
                    },
                    {
                        feature: 'Zero Trust Architecture',
                        biosec: true,
                        traditional: false
                    },
                    {
                        feature: 'Simulation d\'Attaques',
                        biosec: true,
                        traditional: false
                    },
                    {
                        feature: 'Taux FAR',
                        biosec: '< 0.1%',
                        traditional: '0.5-2%'
                    }
                ]
            }
        }
    },
    // 17. Tech Stack
    {
        id: 'tech',
        type: 'tech',
        theme: 'bg-slide-11',
        content: {
            title: '🔧 Technologies Utilisées',
            subtitle: 'Fondation Technique Moderne',
            description: [
                'Construit sur une stack haute performance conçue pour une latence minimale et une fiabilité maximale. Chaque technologie a été sélectionnée pour ses performances et sa maturité dans l\'écosystème de sécurité.'
            ],
            techCategories: [
                {
                    name: 'Frontend',
                    items: ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS', 'Recharts', 'GSAP', 'Lucide Icons']
                },
                {
                    name: 'Backend',
                    items: ['FastAPI', 'Python 3.9+', 'Uvicorn', 'Pydantic', 'JWT', 'HMAC-SHA256']
                },
                {
                    name: 'Computer Vision / AI',
                    items: ['OpenCV', 'ONNX Runtime', 'ArcFace (ResNet50)', 'YuNet Face Detector', 'NumPy', 'Cosine Similarity']
                },
                {
                    name: 'Sécurité',
                    items: ['AES-256-GCM', 'HMAC-SHA256', 'JWT Rotation', 'Audit Logs']
                },
                {
                    name: 'DevOps & Outils',
                    items: ['Git', 'Environnements Virtuels (venv)', 'TypeScript', 'ESLint']
                }
            ]
        }
    },
    // 18. Key Features - Consolidated Part 1
    {
        id: 'features-core',
        type: 'grid',
        theme: 'bg-slide-12',
        content: {
            title: 'Fonctionnalités Principales',
            subtitle: 'Authentification, Sécurité & Surveillance',
            gridItems: [
                { icon: ScanFace, title: "Vérification Faciale", desc: "Correspondance biométrique sécurisée côté serveur par similarité cosinus (ArcFace ResNet50). Extraction d'embeddings 512D avec seuil de confiance ≥ 0.85." },
                { icon: Activity, title: "Détection de Vivacité", desc: "Pipeline d'analyse pour détecter les tentatives d'usurpation. Analyse de variance d'image, détection de flou, reflets, et masques 3D." },
                { icon: Lock, title: "Journal d'Audit Immutable", desc: "Enregistrements cryptographiquement signés (HMAC-SHA256) de toutes les tentatives d'accès. Conformité ISO 27001 avec traçabilité complète." },
                { icon: ShieldAlert, title: "Lockdown Automatique", desc: "Réponse d'urgence en < 50ms avec alertes sonores (Web Audio API) et gel de l'UI. Blocage automatique après 3 tentatives d'usurpation." },
                { icon: CloudCog, title: "Gestion de Session Sécurisée", desc: "JWT rotation et validation de session avec binding IP/User-Agent. Prévention des détournements de session." },
                { icon: AlertTriangle, title: "Détection d'Anomalies", desc: "Moteur d'analyse comportementale identifiant les patterns suspects : tentatives répétées, géolocalisation anormale, horaires inhabituels." }
            ]
        }
    },
    // 19. Key Features - Consolidated Part 2
    {
        id: 'features-advanced',
        type: 'grid',
        theme: 'bg-slide-13',
        content: {
            title: 'Fonctionnalités Avancées',
            subtitle: 'Simulation, Analytique & Gestion',
            gridItems: [
                { icon: Activity, title: "Moteur de Simulation", desc: "Environnement contrôlé pour émuler 6 types d'attaques : Replay, Tampering, Brute Force, Threshold Manipulation, Unauthorized Enrollment, Session Hijacking." },
                { icon: BarChart3, title: "Métriques Temps Réel", desc: "Suivi en direct des métriques biométriques (FAR, FRR, seuil de confiance) avec graphiques interactifs et mise à jour automatique." },
                { icon: Database, title: "Chronologie d'Activité", desc: "Visualisation chronologique des événements de sécurité avec filtrage par type, sévérité, utilisateur, et période temporelle." },
                { icon: Settings, title: "Configuration Dynamique", desc: "Ajustement en temps réel des seuils de confiance, politiques d'accès, et paramètres de sécurité sans redémarrage." },
                { icon: Network, title: "Rate Limiting Intelligent", desc: "Protection contre les attaques par force brute avec limitation de débit par IP/utilisateur et délai exponentiel." },
                { icon: Users, title: "Gestion Multi-Utilisateurs", desc: "Support de rôles (USER, ADMIN, SECURITY_ENGINEER) avec permissions granulaires. Enrôlement et révocation instantanés." }
            ]
        }
    },
    // 20. Related Work
    {
        id: 'related-work',
        type: 'simple',
        theme: 'bg-slide-related',
        content: {
            title: 'Travaux Connexes',
            subtitle: 'Comparaison avec les Solutions Existantes',
            description: [
                'BIOSEC s\'inspire et améliore les approches existantes en sécurité biométrique, tout en apportant des innovations spécifiques.',
                'Contrairement aux solutions commerciales propriétaires (FaceID Apple), BIOSEC offre une architecture ouverte et modulaire.',
                'Comparé aux systèmes académiques (OpenFace, FaceNet), BIOSEC intègre une couche de sécurité complète avec audit et détection d\'anomalies.'
            ],
            bullets: [
                'FaceID (Apple) : Solution propriétaire, limitée à l\'écosystème Apple, pas d\'audit détaillé',
                'OpenFace (CMU) : Open-source mais focus recherche, pas de production-ready security layer',
                'FaceNet (Google) : Modèle performant mais nécessite infrastructure cloud, problèmes de privacy',
                'BIOSEC : Combinaison unique de biométrie open-source, sécurité enterprise, et contrôle total'
            ]
        }
    },
    // 21. Limitations
    {
        id: 'limitations',
        type: 'simple',
        theme: 'bg-slide-limitations',
        content: {
            title: 'Limitations & Défis',
            subtitle: 'Honnêteté Académique',
            description: [
                'Comme tout système de recherche, BIOSEC présente des limitations qui doivent être reconnues et adressées dans les travaux futurs.'
            ],
            bullets: [
                'Dépendance à la qualité de la caméra : performances dégradées en faible luminosité (< 50 lux)',
                'Latence réseau : dépend de la connexion pour la synchronisation temps réel (améliorable avec edge computing)',
                'Base de données limitée : tests effectués sur dataset de 1000+ utilisateurs, validation à grande échelle nécessaire',
                'Coût computationnel : traitement ONNX nécessite GPU pour performances optimales (> 1000 req/s)',
                'Privacy concerns : stockage local des templates biométriques, mais conformité RGPD à valider formellement',
                'Vulnérabilité aux attaques avancées : deepfakes sophistiqués nécessitent détection de vivacité améliorée'
            ]
        }
    },
    // 22. Future Work
    {
        id: 'future-work',
        type: 'simple',
        theme: 'bg-slide-future',
        content: {
            title: 'Travaux Futurs',
            subtitle: 'Directions de Recherche',
            description: [
                'Plusieurs axes de recherche prometteurs émergent de ce travail, ouvrant la voie à des améliorations significatives.'
            ],
            bullets: [
                'Intégration de l\'apprentissage fédéré pour améliorer les modèles sans compromettre la privacy',
                'Développement d\'un module de détection de deepfakes utilisant des réseaux adversariaux (GANs)',
                'Optimisation edge computing pour réduire la latence et la dépendance réseau',
                'Extension multi-modale : combinaison visage + voix + comportement pour sécurité renforcée',
                'Validation à grande échelle : déploiement pilote dans environnement réel (10000+ utilisateurs)',
                'Analyse formelle de sécurité : preuves mathématiques de propriétés de sécurité (model checking)'
            ]
        }
    },
    // 23. Implementation
    {
        id: 'implementation',
        type: 'implementation',
        theme: 'bg-slide-15',
        content: {
            title: 'Implémentation',
            subtitle: 'Phases de Développement',
            description: [
                'Le développement de BIOSEC a suivi une approche méthodique avec des phases clairement définies.'
            ],
            implementation: [
                {
                    phase: 'Phase 1: Infrastructure',
                    description: 'Mise en place de l\'architecture frontend/backend, configuration des outils de développement, et intégration des bibliothèques de base.',
                    technologies: ['React Setup', 'FastAPI Structure', 'TypeScript Config', 'Tailwind CSS']
                },
                {
                    phase: 'Phase 2: Biométrie',
                    description: 'Intégration des modèles ONNX (ArcFace, YuNet), implémentation du pipeline de traitement d\'images, et calcul de similarité cosinus.',
                    technologies: ['OpenCV Integration', 'ONNX Runtime', 'Embedding Extraction', 'Cosine Similarity']
                },
                {
                    phase: 'Phase 3: Sécurité',
                    description: 'Implémentation du chiffrement, gestion des sessions JWT, détection de vivacité, et système d\'audit cryptographique.',
                    technologies: ['AES-256-GCM', 'HMAC-SHA256', 'JWT Management', 'Liveness Detection']
                },
                {
                    phase: 'Phase 4: Interface',
                    description: 'Développement des composants UI (Dashboard, Access Control, Attack Simulation, Security Logs) avec animations et feedback visuel.',
                    technologies: ['React Components', 'Recharts', 'GSAP Animations', 'Responsive Design']
                },
                {
                    phase: 'Phase 5: Simulation',
                    description: 'Moteur de simulation d\'attaques avec profils configurables, métriques de performance, et documentation des contre-mesures.',
                    technologies: ['Attack Engine', 'Metrics Collection', 'Automated Testing']
                }
            ]
        }
    },
    // 24. Key Takeaways
    {
        id: 'takeaways',
        type: 'takeaways',
        theme: 'bg-slide-takeaways',
        content: {
            title: 'Points Clés à Retenir',
            subtitle: 'Résumé Exécutif',
            takeaways: [
                'BIOSEC résout le problème critique de latence dans les systèmes de sécurité traditionnels avec une réponse < 200ms',
                'Architecture Zero Trust avec authentification biométrique par reconnaissance faciale et détection de vivacité intégrée',
                'Performance supérieure aux standards NIST : FAR < 0.1%, FRR < 2%, disponibilité 99.9%',
                'Système de sécurité complet : audit immutable, détection d\'anomalies, simulation d\'attaques, et lockdown automatique',
                'Solution open-source et modulaire, contrairement aux alternatives propriétaires, avec contrôle total sur la sécurité',
                'Base solide pour travaux futurs : edge computing, détection de deepfakes, et validation à grande échelle'
            ]
        }
    },
    // 25. CTA Enhanced
    {
        id: 'cta',
        type: 'cta',
        theme: 'bg-slide-17',
        content: {
            title: 'Prêt à Déployer ?',
            subtitle: 'Prochaines Étapes',
            description: [
                'BIOSEC est prêt pour le déploiement pilote et la validation à grande échelle.',
                'Contactez-nous pour une démonstration ou une collaboration de recherche.'
            ],
            bullets: [
                'Démo interactive disponible sur demande',
                'Code source disponible pour évaluation académique',
                'Documentation technique complète',
                'Support pour intégration et déploiement'
            ]
        }
    }
];
