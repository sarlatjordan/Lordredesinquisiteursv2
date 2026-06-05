-- ─── Seed data INQFR (données de démonstration) ──────────────────────────────
-- IMPORTANT: Exécuter APRÈS avoir créé au moins un compte utilisateur via Supabase Auth
-- Remplacer les UUIDs par de vrais IDs d'utilisateurs

-- Profils exemple (à adapter avec de vrais auth.uid())
-- INSERT INTO public.profiles ...

-- Événements de démonstration (ne nécessitent pas de created_by réel)
INSERT INTO public.events (id, title, description, type, status, start_at, end_at, location) VALUES
  (
    gen_random_uuid(),
    'Opération Aube Noire',
    'Raid coordonné sur un convoi Vanduul. Tous les pilotes de combat sont requis. Briefing 15min avant le départ.',
    'operation',
    'planifie',
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '2 days' + INTERVAL '3 hours',
    'Système Tiber — Point de ralliement : Station Archon'
  ),
  (
    gen_random_uuid(),
    'Réunion mensuelle INQFR',
    'Compte-rendu des activités du mois, vote sur les nouvelles recrues, annonces importantes.',
    'reunion',
    'planifie',
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '5 days' + INTERVAL '1 hour 30 minutes',
    'Discord INQFR — Canal vocal Salle de commandement'
  ),
  (
    gen_random_uuid(),
    'Formation combat spatial — Niveau 1',
    'Session de formation pour les nouveaux membres. Manœuvres de base, gestion du bouclier, tir en mouvement.',
    'formation',
    'planifie',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days' + INTERVAL '2 hours',
    'Système Stanton — Zone d entraînement'
  ),
  (
    gen_random_uuid(),
    'Exploration Pyro — Expédition première',
    'Première expédition officielle dans le système Pyro. Vaisseaux d exploration requis. Danger élevé.',
    'operation',
    'planifie',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '16 days',
    'Système Pyro'
  );

-- Ressources Wiki de démonstration
INSERT INTO public.org_resources (title, slug, content, category, is_published) VALUES
  (
    'Règlement de l Ordre',
    'reglement-ordre',
    '# Règlement de l Ordre des Inquisiteurs

## Article 1 — Respect et camaraderie
Tout membre se doit de respecter ses camarades et les membres d autres organisations.

## Article 2 — Participation
La participation aux événements officiels est fortement encouragée.

## Article 3 — Communication
Le Discord est le canal de communication principal. Sa présence est obligatoire.

## Article 4 — Recrutement
Tout membre peut proposer un candidat. L admission est soumise au vote des Officiers.',
    'Reglement',
    true
  ),
  (
    'Guide du débutant Star Citizen',
    'guide-debutant',
    '# Guide du débutant

## Premiers pas dans le verse
Bienvenue dans Star Citizen ! Ce guide vous aidera à prendre en main le jeu.

## Interface de vol
- `W/S` : Accélération / Décélération
- `A/D` : Tangage latéral
- `Q/E` : Roulis

## Combat
Gardez vos boucliers actifs et maintenez la distance optimale selon votre armement.',
    'Guides',
    true
  );
