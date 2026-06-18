import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
         HeadingLevel, AlignmentType, LevelFormat, BorderStyle, WidthType,
         ShadingType, Footer, PageNumber } from 'docx'
import { writeFileSync } from 'fs'

const bullet = (text) => new Paragraph({
  numbering: { reference: 'bullets', level: 0 },
  children: [new TextRun({ text, font: 'Arial', size: 22 })],
})
const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children: [new TextRun({ text, font: 'Arial', size: 32, bold: true })],
})
const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children: [new TextRun({ text, font: 'Arial', size: 26, bold: true })],
})
const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  children: [new TextRun({ text, font: 'Arial', size: 24, bold: true })],
})
const p = (text) => new Paragraph({
  children: [new TextRun({ text, font: 'Arial', size: 22 })],
  spacing: { after: 120 },
})
const pMono = (text) => new Paragraph({
  children: [new TextRun({ text, font: 'Courier New', size: 20 })],
  spacing: { after: 80 },
})
const space = () => new Paragraph({ children: [new TextRun('')] })
const rule = (color) => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color, space: 4 } },
  spacing: { after: 280 },
  children: [],
})

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
const borders = { top: border, bottom: border, left: border, right: border }
const headerBorder = { style: BorderStyle.SINGLE, size: 1, color: '999999' }
const headerBorders = { top: headerBorder, bottom: headerBorder, left: headerBorder, right: headerBorder }

const cell = (text, width, bold = false, shading = null) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  borders,
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  ...(shading ? { shading: { fill: shading, type: ShadingType.CLEAR } } : {}),
  children: [new Paragraph({ children: [new TextRun({ text, font: 'Arial', size: 20, bold })] })],
})

const rangsTable = new Table({
  width: { size: 9026, type: WidthType.DXA },
  columnWidths: [2400, 1200, 5426],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ width: { size: 2400, type: WidthType.DXA }, borders: headerBorders, margins: { top: 80, bottom: 80, left: 120, right: 120 }, shading: { fill: '1e40af', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Rang', font: 'Arial', size: 20, bold: true, color: 'FFFFFF' })] })] }),
        new TableCell({ width: { size: 1200, type: WidthType.DXA }, borders: headerBorders, margins: { top: 80, bottom: 80, left: 120, right: 120 }, shading: { fill: '1e40af', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Privilège', font: 'Arial', size: 20, bold: true, color: 'FFFFFF' })] })] }),
        new TableCell({ width: { size: 5426, type: WidthType.DXA }, borders: headerBorders, margins: { top: 80, bottom: 80, left: 120, right: 120 }, shading: { fill: '1e40af', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Capacités clés', font: 'Arial', size: 20, bold: true, color: 'FFFFFF' })] })] }),
      ],
    }),
    new TableRow({ children: [cell('Visiteur', 2400), cell('50', 1200), cell('Voir fiches membres publiques, galerie, stats', 5426)] }),
    new TableRow({ children: [cell('Aspirant', 2400, false, 'F8F9FF'), cell('100', 1200, false, 'F8F9FF'), cell('Accès au site complet en lecture', 5426, false, 'F8F9FF')] }),
    new TableRow({ children: [cell('Consacré', 2400), cell('150', 1200), cell("S'inscrire aux événements, commenter", 5426)] }),
    new TableRow({ children: [cell('Gardien', 2400, false, 'F8F9FF'), cell('300', 1200, false, 'F8F9FF'), cell('Approuver les retraits logistique, toggle recrutement', 5426, false, 'F8F9FF')] }),
    new TableRow({ children: [cell('Inquisiteur', 2400), cell('400', 1200), cell('Toutes les actions membres', 5426)] }),
    new TableRow({ children: [cell('Maître Inquisiteur', 2400, false, 'F8F9FF'), cell('600', 1200, false, 'F8F9FF'), cell("Créer des opérations, événements, canaux, commandement", 5426, false, 'F8F9FF')] }),
    new TableRow({ children: [cell('Sage', 2400, true), cell('1000', 1200, true), cell('Accès complet + panel Administration', 5426, true)] }),
  ],
})

const varsTable = new Table({
  width: { size: 9026, type: WidthType.DXA },
  columnWidths: [3600, 5426],
  rows: [
    new TableRow({ tableHeader: true, children: [
      new TableCell({ width: { size: 3600, type: WidthType.DXA }, borders: headerBorders, margins: { top: 80, bottom: 80, left: 120, right: 120 }, shading: { fill: '7c3aed', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Variable', font: 'Courier New', size: 20, bold: true, color: 'FFFFFF' })] })] }),
      new TableCell({ width: { size: 5426, type: WidthType.DXA }, borders: headerBorders, margins: { top: 80, bottom: 80, left: 120, right: 120 }, shading: { fill: '7c3aed', type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Usage', font: 'Arial', size: 20, bold: true, color: 'FFFFFF' })] })] }),
    ]}),
    ...([
      ['NEXT_PUBLIC_SUPABASE_URL', 'URL du projet Supabase'],
      ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Clé publique (navigateur)'],
      ['SUPABASE_SERVICE_ROLE_KEY', 'Clé service — server-only, ne jamais exposer'],
      ['ICS_HMAC_SECRET', 'Secret tokens calendrier ICS'],
      ['MFA_DEVICE_SECRET', 'Secret cookies trusted device MFA'],
      ['DISCORD_BOT_TOKEN', 'Token bot Discord (sync événements)'],
      ['DISCORD_GUILD_ID', 'ID du serveur Discord'],
      ['DISCORD_WEBHOOK_SECRET', 'Secret webhook Make.com → site'],
      ['NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'Clé Cloudflare Turnstile (captcha)'],
    ]).map(([name, desc], i) => new TableRow({ children: [
      new TableCell({ width: { size: 3600, type: WidthType.DXA }, borders, margins: { top: 80, bottom: 80, left: 120, right: 120 }, ...(i % 2 === 0 ? { shading: { fill: 'F5F3FF', type: ShadingType.CLEAR } } : {}), children: [new Paragraph({ children: [new TextRun({ text: name, font: 'Courier New', size: 18, bold: true })] })] }),
      new TableCell({ width: { size: 5426, type: WidthType.DXA }, borders, margins: { top: 80, bottom: 80, left: 120, right: 120 }, ...(i % 2 === 0 ? { shading: { fill: 'F5F3FF', type: ShadingType.CLEAR } } : {}), children: [new Paragraph({ children: [new TextRun({ text: desc, font: 'Arial', size: 20 })] })] }),
    ]})),
  ],
})

const doc = new Document({
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, font: 'Arial', color: '1a1a2e' }, paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, font: 'Arial', color: '7c3aed' }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, font: 'Arial', color: '374151' }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ],
  },
  sections: [{
    properties: {
      page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: 'INQFR — Guide Administrateur · Page ', font: 'Arial', size: 18, color: '888888' }),
          new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: '888888' }),
        ],
      })] }),
    },
    children: [
      // TITRE
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 480, after: 120 },
        children: [new TextRun({ text: 'INQFR — Guide Administrateur', font: 'Arial', size: 48, bold: true, color: '1a1a2e' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: 'Ordre des Inquisiteurs · Réservé aux Sages et Maîtres Inquisiteurs', font: 'Arial', size: 24, color: '555555', italics: true })],
      }),
      rule('dc2626'),

      // 1. NIVEAUX D'ACCÈS
      h1("1. Niveaux d'accès"),
      p("Le site utilise un système de privilèges basé sur les rangs. Toutes les vérifications sont effectuées côté serveur via la fonction get_my_privilege() en base de données."),
      space(),
      rangsTable,
      space(),

      // 2. PANEL ADMIN
      h1('2. Panel d\'administration (Sage uniquement)'),
      p('Accès : Section "Administration" en bas de la sidebar, visible uniquement pour les Sages.'),
      space(),

      h3('Candidatures — Pipeline Kanban'),
      p('URL : /admin/candidatures'),
      p('Vue Kanban avec trois colonnes :'),
      bullet('Reçu : nouvelles candidatures du formulaire public'),
      bullet('En discussion : candidatures en cours d\'évaluation par le Conseil'),
      bullet('Accepté / Refusé : décisions finales'),
      p('Actions : déplacer une candidature entre colonnes par glisser-déposer, lire le message de motivation.'),
      space(),

      h3('Galerie'),
      p('URL : /admin/galerie'),
      p('Upload d\'images dans la galerie publique du site (Supabase Storage). Formats : JPG, PNG, WebP.'),
      space(),

      h3('Avatars'),
      p('URL : /admin/avatars'),
      p('Validation des photos de profil soumises par les membres. Les avatars en attente apparaissent ici pour approbation ou refus.'),
      space(),

      h3('Activité'),
      p('URL : /admin/activite'),
      p('Journal d\'activité global : liste chronologique de toutes les actions effectuées sur le site.'),
      space(),

      h3('Points'),
      p('URL : /admin/points'),
      p('Audit de toutes les attributions de points : qui a attribué quoi, à qui, quand, et pour quelle raison. Filtre par membre possible.'),
      space(),

      h3('Journal de guerre'),
      p('URL : /admin/journal'),
      p("Gestion des comptes-rendus d'opérations rédigés après chaque mission. Les entrées publiées apparaissent sur la landing publique."),
      space(),

      h3('Backlog & Historique'),
      p('URL : /backlog.html (nouvel onglet)'),
      p('Document de suivi du développement : historique de toutes les fonctionnalités et corrections depuis le lancement, et liste des fonctionnalités planifiées.'),
      space(),

      // 3. COMMANDEMENT
      h1('3. Commandement (Maître Inquisiteur+)'),
      p('Accès : Section "Commandement" au-dessus de l\'Administration dans la sidebar.'),
      space(),
      h3('Promotions'),
      p('URL : /admin/promotions'),
      p('Historique de toutes les promotions. Les MI+ peuvent promouvoir ou rétrograder des membres depuis la fiche membre (bouton "Modifier la progression").'),
      space(),

      // 4. MEMBRES
      h1('4. Gestion des membres'),
      h2('Fiche membre'),
      p('Accès : /membres/[username]'),
      space(),
      p('Les Sages voient sur chaque fiche :'),
      bullet('Fiche de progression (niveau d\'activité, spécialité, formations reçues)'),
      bullet('Notes Sage (privées, visibles uniquement par les Sages)'),
      bullet('Historique complet des points (avec l\'auteur de chaque attribution)'),
      bullet('Historique des promotions'),
      space(),
      p('Actions disponibles :'),
      bullet('Modifier la progression (activité, formations, notes)'),
      bullet('Attribuer des points (positifs ou négatifs)'),
      bullet('Promouvoir / rétrograder le membre'),
      h2('Attribuer des points'),
      p('Depuis la fiche membre → bouton "Attribuer des points" :'),
      bullet('Choisir la raison (participation opération, événement, rapport, bonus manuel, malus…)'),
      bullet('Préciser un détail optionnel'),
      bullet('Valider — les points sont crédités instantanément et tracés dans l\'audit'),
      space(),

      // 5. ÉVÉNEMENTS & OPS
      h1('5. Événements et opérations'),
      h2('Créer un événement (MI+)'),
      p('Page /evenements → bouton "+ Nouvel événement"'),
      p('Champs : titre, description, date/heure, type, lieu in-game, image, visibilité (rang minimum).'),
      p('Option "Envoyer sur Discord" : crée automatiquement un Scheduled Event dans le serveur Discord via le bot.'),
      h2('Créer une opération (MI+)'),
      p('Page /operations → bouton "+ Nouvelle opération"'),
      p('Champs : titre, description, date, briefing, rôles disponibles (slots), statut initial.'),
      h2('Gérer le butin (Loot panel)'),
      p("Après une opération terminée, depuis la fiche d'opération → onglet \"Butin\" :"),
      bullet('Saisir les gains (crédits, items)'),
      bullet('Distribuer équitablement entre les participants'),
      bullet("L'historique apparaît sur la fiche de chaque membre concerné"),
      space(),

      // 6. RECRUTEMENT
      h1('6. Recrutement'),
      p('Le toggle recrutement (ouvert/fermé) est accessible depuis le tableau de bord par les Gardiens+.'),
      p("Quand le recrutement est ouvert, le formulaire public /recrutement est actif. Les candidatures arrivent dans le Kanban /admin/candidatures."),
      space(),

      // 7. LOGISTIQUE
      h1('7. Logistique (Gardien+)'),
      p("Les Gardiens et plus peuvent approuver les demandes de retrait de matériel depuis la page /logistique."),
      p("Chaque demande affiche : l'item demandé, la quantité, le demandeur, la raison. Actions : Approuver ou Refuser."),
      space(),

      // 8. ENV VARS
      h1('8. Variables d\'environnement et déploiement'),
      p('Le site tourne sur Vercel, connecté à Supabase. Variables critiques :'),
      space(),
      varsTable,
      space(),
      h2('Rotation des clés Supabase'),
      p('En cas de fuite suspectée ou de départ d\'un membre :'),
      new Paragraph({ numbering: { reference: 'numbers', level: 0 }, children: [new TextRun({ text: 'Régénérer dans Supabase Dashboard → Settings → API', font: 'Arial', size: 22 })] }),
      new Paragraph({ numbering: { reference: 'numbers', level: 0 }, children: [new TextRun({ text: 'Mettre à jour dans Vercel → Settings → Environment Variables', font: 'Arial', size: 22 })] }),
      new Paragraph({ numbering: { reference: 'numbers', level: 0 }, children: [new TextRun({ text: 'Redéployer : Vercel Dashboard → Redeploy (without cache)', font: 'Arial', size: 22 })] }),
      new Paragraph({ numbering: { reference: 'numbers', level: 0 }, children: [new TextRun({ text: 'Mettre à jour .env.local localement', font: 'Arial', size: 22 })] }),
      space(),

      // 9. MIGRATIONS
      h1('9. Base de données — Migrations'),
      p('Les migrations SQL sont dans supabase/migrations/, numérotées de 001 à 043. Prochaine : 044.'),
      p('Pour appliquer : pnpm supabase db push'),
      space(),
      p('Dernières migrations importantes :'),
      bullet('039 — Colonne "En discussion" pour le Kanban candidatures'),
      bullet('040 — Table member_availability (disponibilités membres)'),
      bullet('041 — Table member_badges (badges et achievements)'),
      bullet('042 — Table war_journal (journal de guerre)'),
      bullet('043 — Table operation_loot (système de butin)'),
      space(),

      // 10. SÉCURITÉ
      h1('10. Sécurité'),
      p('Points validés :'),
      bullet('RLS (Row Level Security) activé sur toutes les tables via get_my_privilege()'),
      bullet('MFA TOTP disponible pour tous — recommandé pour les comptes Sage'),
      bullet('CSP strict avec nonce par requête (Content Security Policy)'),
      bullet('Export RGPD disponible pour chaque membre'),
      bullet('Audit log de toutes les attributions de points'),
      bullet('Tokens ICS signés par HMAC-SHA256 (stateless)'),
      bullet('Cookies MFA trusted device signés HMAC-SHA256'),
      space(),
      p('En cas de suspicion de fuite de clés : voir Section 8 (rotation des clés).'),
    ],
  }],
})

Packer.toBuffer(doc).then(buf => {
  writeFileSync('INQFR_Guide_Admin.docx', buf)
  console.log('Guide Admin OK')
}).catch(e => { console.error('ERREUR:', e.message); process.exit(1) })
