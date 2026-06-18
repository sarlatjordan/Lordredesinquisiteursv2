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
const p = (text) => new Paragraph({
  children: [new TextRun({ text, font: 'Arial', size: 22 })],
  spacing: { after: 120 },
})
const space = () => new Paragraph({ children: [new TextRun('')] })
const rule = (color) => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color, space: 4 } },
  spacing: { after: 280 },
  children: [],
})

const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
    }],
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: '1a1a2e' },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: '1e40af' },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
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
          new TextRun({ text: 'INQFR — Guide du Membre · Page ', font: 'Arial', size: 18, color: '888888' }),
          new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: '888888' }),
        ],
      })] }),
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 480, after: 120 },
        children: [new TextRun({ text: 'INQFR — Guide du Membre', font: 'Arial', size: 48, bold: true, color: '1a1a2e' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: 'Ordre des Inquisiteurs · QG numérique interne', font: 'Arial', size: 24, color: '555555', italics: true })],
      }),
      rule('1e40af'),

      h1('1. Bienvenue'),
      p("INQFR est le quartier général numérique privé de l'Ordre des Inquisiteurs, une organisation Star Citizen. Ce site est accessible uniquement aux membres invités. Il centralise tout ce dont tu as besoin : événements, flotte, opérations, messagerie et suivi de ta progression."),
      space(),

      h1('2. Connexion & Compte'),
      h2('Se connecter'),
      p('Tu peux te connecter de trois façons :'),
      bullet('Email + mot de passe : saisir ton adresse et ton mot de passe sur la page /login'),
      bullet('Google : bouton "Continuer avec Google" — connecte ton compte Google'),
      bullet('Discord : bouton "Continuer avec Discord" — connecte ton compte Discord'),
      space(),
      p('Tu peux aussi utiliser un magic link (lien de connexion envoyé par email, sans mot de passe).'),
      h2('Double authentification (MFA)'),
      p('Si activée par les Sages, tu devras valider un code à 6 chiffres depuis Google Authenticator ou Authy à chaque connexion (sauf si tu as coché "Se souvenir de cet appareil").'),
      p('Pour activer la MFA : Profil → Sécurité → Activer la double authentification.'),
      space(),

      h1('3. Navigation'),
      p('Le site est organisé en sidebar (barre gauche) avec des groupes pliables :'),
      space(),
      bullet('Tableau de bord — Accueil, statistiques, activité récente'),
      bullet('Messages — Messagerie temps réel par canal'),
      space(),
      p('Combat & Missions :'),
      bullet('Événements — Calendrier mois/semaine/liste, inscriptions'),
      bullet('Opérations — Missions org, briefings, rôles'),
      space(),
      p('Org :'),
      bullet('Membres — Fiches membres, classement des points'),
      bullet('Partenariats — Alliances, neutres, ennemis'),
      space(),
      p('Ressources internes :'),
      bullet("Flotte — Vaisseaux de l'org et personnels"),
      bullet("Logistique — Inventaire de l'org, dépôts et retraits"),
      bullet('Carte — Carte stellaire des 22 systèmes SC'),
      space(),
      p('Références :'),
      bullet('Wiki — Documentation interne markdown'),
      space(),
      p('En haut à droite : barre de recherche globale (membres, ressources, opérations, événements).'),
      space(),

      h1('4. Profil'),
      h2('Modifier son profil'),
      p('Accès : clic sur "Profil" en bas de la sidebar.'),
      space(),
      p('Tu peux modifier :'),
      bullet("Pseudo d'affichage et handle Star Citizen"),
      bullet('Photo de profil : depuis ton PC (JPG/PNG/WebP, 2 Mo max) ou par URL'),
      bullet("Biographie : avec barre d'outils (titres, gras, italique, souligné), rendu formaté sur ta fiche membre"),
      bullet('Mot de passe'),
      h2('Rang et progression'),
      p('Ton rang détermine ce que tu peux voir et faire sur le site :'),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 160, after: 160 },
        children: [new TextRun({ text: 'Visiteur → Aspirant → Consacré → Gardien → Inquisiteur → Maître Inquisiteur → Sage', font: 'Arial', size: 20, bold: true, color: '1e40af' })],
      }),
      p("Chaque rang a un parcours initiatique avec 5 étapes à valider. Complète les étapes pour gagner des points et progresser. Certaines étapes se valident automatiquement (ex : assister à ta première opération), d'autres sont à réclamer manuellement via le bouton \"Réclamer\" sur le tableau de bord."),
      h2('Badges'),
      p("Des badges se débloquent automatiquement au fil de ton activité : première opération, 5 événements assistés, premier rapport déposé…"),
      space(),

      h1('5. Événements'),
      p('La page Événements affiche un calendrier avec trois vues :'),
      bullet('Mois : vue mensuelle classique'),
      bullet('Semaine : vue hebdomadaire détaillée'),
      bullet('Liste : liste chronologique des prochains événements'),
      space(),
      p('Cliquer sur un événement ouvre sa fiche complète (description, heure, lieu in-game, inscrits).'),
      p("Pour s'inscrire : ouvrir la fiche et cliquer \"S'inscrire\". Tu recevras une notification avant le début."),
      space(),
      p("Abonnement calendrier : dans Profil → Calendrier ICS, tu peux générer un lien d'abonnement à coller dans Google Agenda ou Apple Calendar pour voir les événements INQFR directement dans ton calendrier personnel."),
      space(),

      h1('6. Flotte'),
      p("La page Flotte affiche tous les vaisseaux de l'organisation et les tiens sur une même grille triée de A à Z."),
      space(),
      p('Filtres disponibles :'),
      bullet('Par type de vaisseau'),
      bullet('Par pilote (sélecteur déroulant)'),
      bullet('Vaisseaux corpo uniquement'),
      space(),
      p('Tu peux ajouter un vaisseau personnel en cliquant "+ Ajouter". Le modèle est sélectionnable depuis la base RSI (250+ modèles). Tu peux éditer le nom de ton vaisseau directement depuis la carte (clic inline).'),
      space(),

      h1('7. Opérations'),
      p('Les opérations sont des missions organisées par le commandement (Maître Inquisiteur+).'),
      space(),
      p('Chaque opération a :'),
      bullet('Un briefing et un débrief'),
      bullet('Des slots de rôle (tank, support, DPS, etc.)'),
      bullet('Un statut : Planifiée → En cours → Terminée / Annulée'),
      space(),
      p("Pour rejoindre une opération : ouvrir la fiche et s'inscrire dans un slot disponible."),
      p("Après une opération terminée, un résumé (Journal de guerre) peut être rédigé par le commandement — consultable sur la page d'accueil publique du site."),
      space(),

      h1('8. Messagerie'),
      p('La page Messages donne accès aux canaux de discussion temps réel.'),
      p("Les messages s'affichent instantanément pour tous les membres connectés. La création de canaux est réservée aux Maîtres Inquisiteurs et plus."),
      space(),

      h1('9. Logistique'),
      p("La page Logistique affiche l'inventaire de l'organisation."),
      space(),
      p('Tu peux :'),
      bullet('Déposer du matériel (ajout de stock)'),
      bullet('Retirer du matériel (demande validée par un Gardien+)'),
      space(),
      p("Certains retraits nécessitent une approbation du commandement avant d'être effectifs."),
      space(),

      h1('10. Disponibilité'),
      p("Dans ton profil (onglet Disponibilités), tu peux renseigner tes créneaux disponibles dans la semaine. La page Opérations affiche en temps réel combien de membres sont disponibles pour chaque créneau, ce qui aide le commandement à planifier les missions."),
      space(),

      h1('11. Données personnelles (RGPD)'),
      p("Depuis Profil → Données personnelles, tu peux télécharger l'ensemble de tes données (profil, points, promotions, inscriptions, messages) au format JSON."),
    ],
  }],
})

Packer.toBuffer(doc).then(buf => {
  writeFileSync('INQFR_Guide_Membre.docx', buf)
  console.log('Guide Membre OK')
}).catch(e => { console.error('ERREUR:', e.message); process.exit(1) })
