/**
 * Utilitaires pour la génération de messages et d'emails d'adhésion (Gmail & Mailto)
 * Expéditeur : anass.khadir@usmba.ac.ma
 * WhatsApp : +212659041407
 * Tarif annuel : 500 DH / an
 */

export const PROF_INFO = {
  name: "Professeur Anass KHADIR",
  email: "anass.khadir@usmba.ac.ma",
  phone: "06 59 04 14 07",
  phoneIntl: "+212659041407",
  whatsappUrl: "https://wa.me/212659041407",
  platformUrl: "https://quiz.anasskhadir.com",
  siteUrl: "https://anasskhadir.com",
  annualPrice: "500 DH / an",
};

export const EMAIL_TEMPLATES = {
  adhesion: {
    id: "adhesion",
    title: "Offre d'adhésion annuelle (500 DH/an)",
    getSubject: (name) => `🎓 Votre accès à la plateforme CPGE Maths — Professeur Anass Khadir`,
    getBody: (name) => {
      const salutation = name ? `Bonjour ${name},` : "Bonjour,";
      return `${salutation}

J'ai bien reçu votre inscription sur notre plateforme d'excellence en Mathématiques CPGE (${PROF_INFO.platformUrl}).

Pour vous accompagner efficacement vers la réussite de vos concours (CNC Maroc, Mines-Ponts, Centrale-Supélec, CCINP, X-ENS), notre Espace Membre privé met à votre disposition l'ensemble de nos ressources pédagogiques exclusives :

📌 Ce que comprend votre adhésion annuelle :
• Séances de cours en direct & Replays vidéo intégraux de chaque séance.
• Polycopiés de cours officiels, résumés de méthodes et fiches de synthèse en PDF haute résolution.
• Devoirs Libres (DL) et Travaux Dirigés (TD) accompagnés de corrections détaillées pas à pas.
• Annales officielles ciblées et corrigées des concours marocains et français.
• Quizz interactifs avec analyse des réponses pour tester votre niveau en continu.
• Suivi personnalisé et conseils méthodologiques pour optimiser votre classement.

💰 Tarif d'adhésion annuelle :
L'accès illimité pour toute l'année scolaire est fixé au tarif préférentiel de ${PROF_INFO.annualPrice} (soit environ 41 DH/mois pour un accompagnement d'excellence complet).

📱 Comment activer votre compte dès aujourd'hui ?
Pour finaliser votre inscription et activer immédiatement votre accès complet à l'Espace Membre, je vous invite à me contacter directement sur WhatsApp :
👉 WhatsApp direct : ${PROF_INFO.whatsappUrl}
👉 Téléphone / WhatsApp : ${PROF_INFO.phone}

N'hésitez pas à m'écrire, je reste à votre entière disposition pour répondre à vos questions et vous guider dans votre préparation.

Excellente continuation et à très bientôt,

Bien cordialement,

${PROF_INFO.name}
Enseignant-chercheur en Mathématiques CPGE
Email : ${PROF_INFO.email}
Tél / WhatsApp : ${PROF_INFO.phone}
Site web : ${PROF_INFO.siteUrl}
Plateforme : ${PROF_INFO.platformUrl}`;
    },
  },

  rappel: {
    id: "rappel",
    title: "Rappel d'inscription en attente",
    getSubject: (name) => `🔔 Finalisation de votre inscription CPGE Maths — Prof. Anass Khadir`,
    getBody: (name) => {
      const salutation = name ? `Bonjour ${name},` : "Bonjour,";
      return `${salutation}

Votre compte sur notre plateforme de Mathématiques CPGE (${PROF_INFO.platformUrl}) est actuellement en attente d'approbation.

Pour rappel, l'Espace Membre privé vous donne un accès illimité à l'intégralité de nos cours, replays vidéo des séances en direct, supports PDF téléchargeables et corrections détaillées des concours (CNC, Mines, Centrale, CCINP, X-ENS) au tarif annuel de ${PROF_INFO.annualPrice}.

Si vous souhaitez débloquer vos accès dès maintenant, écrivez-moi directement sur WhatsApp pour activer votre compte :
👉 WhatsApp : ${PROF_INFO.whatsappUrl} (${PROF_INFO.phone})

Bien cordialement,

${PROF_INFO.name}
Email : ${PROF_INFO.email}
Tél / WhatsApp : ${PROF_INFO.phone}`;
    },
  },

  reactivation: {
    id: "reactivation",
    title: "Proposition de réactivation / renouvellement",
    getSubject: (name) => `✨ Réactivation de votre compte CPGE Maths — Prof. Anass Khadir`,
    getBody: (name) => {
      const salutation = name ? `Bonjour ${name},` : "Bonjour,";
      return `${salutation}

Je vous contacte concernant votre compte sur notre plateforme de Mathématiques CPGE (${PROF_INFO.platformUrl}).

De nouvelles séances en direct, des replays vidéo et de nouvelles fiches de concours ont été ajoutés récemment à l'Espace Membre.

Si vous souhaitez renouveler ou réactiver votre accès complet (${PROF_INFO.annualPrice}), contactez-moi directement sur WhatsApp pour débloquer votre compte sans délai :
👉 WhatsApp : ${PROF_INFO.whatsappUrl} (${PROF_INFO.phone})

Bien cordialement,

${PROF_INFO.name}
Email : ${PROF_INFO.email}`;
    },
  },

  quiz_submission: {
    id: "quiz_submission",
    title: "Invitation suite à un test / QCM",
    getSubject: (name) => `📊 Suite à votre test sur la plateforme CPGE Maths — Prof. Anass Khadir`,
    getBody: (name) => {
      const salutation = name ? `Bonjour ${name},` : "Bonjour,";
      return `${salutation}

J'ai bien noté votre participation à nos tests d'évaluation sur notre plateforme CPGE (${PROF_INFO.platformUrl}).

Pour approfondir les notions et maximiser vos chances aux concours (CNC, CCINP, Mines, Centrale), vous pouvez rejoindre notre Espace Membre complet (${PROF_INFO.annualPrice}) comprenant toutes les séances de cours live, les replays vidéo intégraux, les polycopiés PDF et les annales corrigées pas à pas.

N'hésitez pas à m'écrire sur WhatsApp pour en savoir plus et activer vos accès :
👉 WhatsApp : ${PROF_INFO.whatsappUrl} (${PROF_INFO.phone})

Bien cordialement,

${PROF_INFO.name}
Email : ${PROF_INFO.email}`;
    },
  },
};

/**
 * Construit l'URL officielle de composition Gmail Web
 */
export function buildGmailComposeUrl({ to, subject, body }) {
  const params = new URLSearchParams();
  params.set("view", "cm");
  params.set("fs", "1");
  if (to) params.set("to", to);
  if (subject) params.set("su", subject);
  if (body) params.set("body", body);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/**
 * Construit l'URL de protocole standard mailto:
 */
export function buildMailtoUrl({ to, subject, body }) {
  const encTo = encodeURIComponent(to || "");
  const encSubject = encodeURIComponent(subject || "");
  const encBody = encodeURIComponent(body || "");
  return `mailto:${encTo}?subject=${encSubject}&body=${encBody}`;
}

/**
 * Ouvre directement l'interface de composition Gmail Web dans un nouvel onglet
 */
export function openGmailDirectly({ to, subject, body }) {
  const url = buildGmailComposeUrl({ to, subject, body });
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Ouvre le client de messagerie par défaut (Outlook, Apple Mail, etc.)
 */
export function openMailtoDirectly({ to, subject, body }) {
  const url = buildMailtoUrl({ to, subject, body });
  window.location.href = url;
}
