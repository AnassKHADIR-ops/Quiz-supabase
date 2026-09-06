/**
 * Données statiques de repli pour la Passerelle Bac → Prépa.
 * Source de référence : https://anasskhadir.com/concours-dentree-en-premiere-annee/
 */

export const PASSERELLE_BAC_DATA = {
  categories: [
    { id: "analyse", label: "📈 Analyse & Probabilités" },
    { id: "algebre", label: "🔢 Algèbre & Géométrie" },
    { id: "sujets", label: "📋 Sujets des Concours" },
  ],
  themes: [
    /* 1. ANALYSE */
    {
      id: "analyse",
      categorie: "analyse",
      titre: "Analyse et Probabilités",
      meta: "Fonctions, limites, suites, intégrales à bornes variables, Gamma, équations fonctionnelles…",
      icon: "📈",
      iconClass: "ti-analyse",
      items: [
        {
          id: "analyse-1",
          label: "Exercice n°1 : Dérivabilité d'une intégrale à bornes variables",
          enonce: "https://drive.google.com/file/d/18MDvmsV2LhuClSh9Rs9T9JNRCVKIkQ3J/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1F6Rtmdg2epsx2TYGXA9WrNQn4YFmW7fg/view?usp=sharing",
          video: "https://www.youtube.com/watch?v=I7I_CBaSOI8",
        },
        {
          id: "analyse-2",
          label: "Exercice n°2 : Dérivabilité & Intégrales",
          enonce: "https://drive.google.com/file/d/18MDvmsV2LhuClSh9Rs9T9JNRCVKIkQ3J/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1F6Rtmdg2epsx2TYGXA9WrNQn4YFmW7fg/view?usp=sharing",
          video: "https://www.youtube.com/watch?v=tUQt7vEvltc&t",
        },
        {
          id: "analyse-3",
          label: "Problème : Densité et équations fonctionnelles",
          enonce: "https://drive.google.com/file/d/18MDvmsV2LhuClSh9Rs9T9JNRCVKIkQ3J/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1F6Rtmdg2epsx2TYGXA9WrNQn4YFmW7fg/view?usp=sharing",
          video: "https://youtu.be/C0KZLiwRNFA?si=UvoJIQi8pfgpp6fd",
        },
        {
          id: "analyse-4",
          label: "Problème : Fonction exponentielle, Hölder & Irrationalité de e",
          enonce: "https://drive.google.com/file/d/1CJp-59RTw5FRYhFPIf1PS5c7cx7-qMgD/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1HqvGzUgpoI_8A6GW5x0QQgSL-2ZtTZs0/view?usp=sharing",
          video: "https://youtu.be/EOVaj8JsTSc?si=jri2C8WjzcmduS5l",
        },
        {
          id: "analyse-5",
          label: "Exercice : Fonction partie entière et Théorème du point fixe",
          enonce: "https://drive.google.com/file/d/1f1NOPrD6o44PiSs6g_Rr0J_bE0MrOdQf/view?usp=drive_link",
          correction: "https://drive.google.com/file/d/1HqvGzUgpoI_8A6GW5x0QQgSL-2ZtTZs0/view?usp=sharing",
          video: "https://youtu.be/wlFfyR00eYs?si=w7R6kzN7yE7XaWnw",
        },
        {
          id: "analyse-6",
          label: "Exercice 2 : Fonction, Suite récurrente & Équation fonctionnelle",
          enonce: "https://drive.google.com/file/d/1qhiu5IlBaQN424_XMTjM4mfAp6rA4Ypn/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1YgwNKhEKsU_hRTf4Tt9hG77Lr64bSZni/view?usp=sharing",
          video: "https://youtu.be/Nrpqfw0KG-g",
        },
        {
          id: "analyse-7",
          label: "Exercice 3 : Limites & logarithme",
          enonce: "https://drive.google.com/file/d/1qhiu5IlBaQN424_XMTjM4mfAp6rA4Ypn/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1YgwNKhEKsU_hRTf4Tt9hG77Lr64bSZni/view?usp=sharing",
          video: "https://youtu.be/n9P3DrpeMnA",
        },
        {
          id: "analyse-8",
          label: "Exercice 15 : Récurrence & Inégalité Exponentielle | Transition Bac → CPGE MPSI",
          enonce: "https://drive.google.com/file/d/1qhiu5IlBaQN424_XMTjM4mfAp6rA4Ypn/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1YgwNKhEKsU_hRTf4Tt9hG77Lr64bSZni/view?usp=sharing",
          video: "https://youtu.be/8CkjYI5dr2g",
        },
        {
          id: "analyse-9",
          label: "Exercice 14 : Préparation Concours LYDEX | Niveau MPSI pas à pas",
          enonce: "https://drive.google.com/file/d/1qhiu5IlBaQN424_XMTjM4mfAp6rA4Ypn/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1YgwNKhEKsU_hRTf4Tt9hG77Lr64bSZni/view?usp=sharing",
          video: "https://youtu.be/QUneD87cJCw",
        },
        {
          id: "analyse-10",
          label: "Transition Sup → Spé | Maîtriser la fonction Gamma Γ | MPSI • PCSI • TSI",
          enonce: "https://drive.google.com/file/d/1XyAPKmUY95SzUeZQ_3aVQa4addsWo-pJ/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1u89mFPNP8qfhjc4S4PIQuuwqBHxn31PL/view?usp=sharing",
          video: "https://youtu.be/rawCPGARZ04",
        },
        {
          id: "analyse-11",
          label: "Exercice 1 : Les suites de Schwob | Concours CPGE-LYMED",
          enonce: "https://drive.google.com/file/d/1Ud1USWzLKpPeyZwWg26GD3vzIU8pxmF7/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1ZXh59ri904_nTDeV0Z8HaiKXrUdcuDaq/view?usp=sharing",
          video: "https://youtu.be/n2AY9Coxd2Q",
        },
        {
          id: "analyse-12",
          label: "Exercice 2 : Convergence d'une suite complexe | CPGE-LYMED",
          enonce: "https://drive.google.com/file/d/1Ud1USWzLKpPeyZwWg26GD3vzIU8pxmF7/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1ZXh59ri904_nTDeV0Z8HaiKXrUdcuDaq/view?usp=sharing",
          video: "https://youtu.be/3Sb7SirpR0w",
        },
        {
          id: "analyse-13",
          label: "Exercice 3 : Convergence d'une suite définie par une intégrale | CPGE-LYMED",
          enonce: "https://drive.google.com/file/d/1Ud1USWzLKpPeyZwWg26GD3vzIU8pxmF7/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1ZXh59ri904_nTDeV0Z8HaiKXrUdcuDaq/view?usp=sharing",
          video: "https://youtu.be/vWoNOjCi45Q",
        },
      ],
    },

    /* 2. ALGÈBRE */
    {
      id: "algebre",
      categorie: "algebre",
      titre: "Algèbre, Arithmétique et Géométrie",
      meta: "Polynômes, matrices, valuation p-adique, nombres complexes, Möbius…",
      icon: "🔢",
      iconClass: "ti-algebre",
      items: [
        {
          id: "algebre-1",
          label: "Exercice n°3 : Diagonalisation de matrices 2×2 | Calcul de Aⁿ",
          enonce: "https://drive.google.com/file/d/18MDvmsV2LhuClSh9Rs9T9JNRCVKIkQ3J/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1F6Rtmdg2epsx2TYGXA9WrNQn4YFmW7fg/view?usp=sharing",
          video: "https://www.youtube.com/watch?v=hdbPYZxUhRY",
        },
        {
          id: "algebre-2",
          label: "Exercice n°4 : Valuation p-adique & Formule de Legendre | Arithmétique",
          enonce: "https://drive.google.com/file/d/18MDvmsV2LhuClSh9Rs9T9JNRCVKIkQ3J/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1F6Rtmdg2epsx2TYGXA9WrNQn4YFmW7fg/view?usp=sharing",
          video: "https://www.youtube.com/watch?v=bb0GH8pT7Ls",
        },
        {
          id: "algebre-3",
          label: "Problème : Diviseurs, Somme des diviseurs & Nombres parfaits",
          enonce: "https://drive.google.com/file/d/1CJp-59RTw5FRYhFPIf1PS5c7cx7-qMgD/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1HqvGzUgpoI_8A6GW5x0QQgSL-2ZtTZs0/view?usp=sharing",
          video: "https://youtu.be/SdbcY43XS7s?si=Sv0biw7TpL8TJuJN",
        },
        {
          id: "algebre-4",
          label: "Concours LYDEX Voie 2 : Nombres Complexes, Bijection & Transformation de Möbius",
          enonce: "https://drive.google.com/file/d/1f1NOPrD6o44PiSs6g_Rr0J_bE0MrOdQf/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1HqvGzUgpoI_8A6GW5x0QQgSL-2ZtTZs0/view?usp=sharing",
          video: "https://youtu.be/QX93jMVoOKw?si=jnArx5PW5ZUWMzsC",
        },
        {
          id: "algebre-5",
          label: "Exercice 4 : Arithmétique – Valuation 2-adique expliquée | CPGE-LYMED",
          enonce: "https://drive.google.com/file/d/1Ud1USWzLKpPeyZwWg26GD3vzIU8pxmF7/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1ZXh59ri904_nTDeV0Z8HaiKXrUdcuDaq/view?usp=sharing",
          video: "https://youtu.be/weApO8QHt7s",
        },
      ],
    },

    /* 3. SUJETS OFFICIELS */
    {
      id: "sujets",
      categorie: "sujets",
      titre: "Sujets & Annales Officielles des Concours",
      meta: "Annales officielles d'entrée en 1ère année CPGE (LYDEX, LYMED, Al Zahrawi)",
      icon: "📋",
      iconClass: "ti-annales",
      items: [
        {
          id: "sujets-1",
          label: "CONCOURS D'ENTRÉE MPSI AL ZAHRAWI — Sujet 1 (Complet)",
          enonce: "https://drive.google.com/file/d/18MDvmsV2LhuClSh9Rs9T9JNRCVKIkQ3J/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1J2czmwXYBmFT8uI8rSP4n_r77nDF2cfn/view?usp=sharing",
          video: [
            "https://youtu.be/I7I_CBaSOI8?si=pp4172Nrcr-JsVF2",
            "https://youtu.be/tUQt7vEvltc?si=tjyAelgRqftC0l4I",
            "https://youtu.be/hdbPYZxUhRY?si=G-cR5SwQZnTKsJAi",
            "https://youtu.be/bb0GH8pT7Ls?si=eLhddtfYUdvo_Y8-",
            "https://youtu.be/C0KZLiwRNFA?si=UvoJIQi8pfgpp6fd",
          ],
        },
        {
          id: "sujets-2",
          label: "Polycopié de Transition Terminale → CPGE MPSI (Collectif d’élèves)",
          enonce: "https://drive.google.com/file/d/1rRfZFCJxrlUrOvDABg_wv-fgHx6ToJFy/view?usp=sharing",
        },
        {
          id: "sujets-3",
          label: "CONCOURS D'ENTRÉE MPSI AL ZAHRAWI — Sujet 2",
          enonce: "https://drive.google.com/file/d/1CJp-59RTw5FRYhFPIf1PS5c7cx7-qMgD/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1HqvGzUgpoI_8A6GW5x0QQgSL-2ZtTZs0/view?usp=sharing",
          video: [
            "https://youtu.be/SdbcY43XS7s?si=iUUAkVgwHMmYw93W",
            "https://youtu.be/EOVaj8JsTSc?si=QotSu98rVbmjfHVJ",
          ],
        },
        {
          id: "sujets-4",
          label: "CONCOURS D'ENTRÉE MPSI LYDEX (Benguerir) — Voie 2",
          enonce: "https://drive.google.com/file/d/1f1NOPrD6o44PiSs6g_Rr0J_bE0MrOdQf/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1HqvGzUgpoI_8A6GW5x0QQgSL-2ZtTZs0/view?usp=sharing",
          video: [
            "https://youtu.be/QX93jMVoOKw?si=cYuUetXjXcZDdpUO",
            "https://youtu.be/wlFfyR00eYs?si=p9JWD9Cq8qOAwvo8",
          ],
        },
        {
          id: "sujets-5",
          label: "CONCOURS D'ENTRÉE MPSI AL ZAHRAWI — Sujet 3",
          enonce: "https://drive.google.com/file/d/1XyAPKmUY95SzUeZQ_3aVQa4addsWo-pJ/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1ZB8BAzj9-2Apwij7b4g-i_1XPHdqtYpi/view?usp=sharing",
        },
        {
          id: "sujets-6",
          label: "Concours d'Admission CPGE-LYMED (Tétouan) — Session 2025",
          enonce: "https://drive.google.com/file/d/1Ud1USWzLKpPeyZwWg26GD3vzIU8pxmF7/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1ZXh59ri904_nTDeV0Z8HaiKXrUdcuDaq/view?usp=sharing",
        },
        {
          id: "sujets-7",
          label: "Fiche d'entraînement Concours MPSI LYDEX Voie 2 (Sujet 1)",
          enonce: "https://drive.google.com/file/d/1qhiu5IlBaQN424_XMTjM4mfAp6rA4Ypn/view?usp=sharing",
          correction: "https://drive.google.com/file/d/1DdgS4jIxgf8HAOMyyCtTlJISjxE3kEB0/view?usp=sharing",
        },
        {
          id: "sujets-8",
          label: "Recueil de fiches de préparation Concours MPSI LYDEX Voie 2",
          enonce: "https://drive.google.com/file/d/1IExdaeXE2tCjWCToJUxMpwx7jHgp-f9f/view?usp=sharing",
        },
      ],
    },
  ],
};
