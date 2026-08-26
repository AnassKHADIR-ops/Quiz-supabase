import { INITIAL_CHAPTERS } from "./chaptersData.js";

export const CPGE_CURRICULUM = {
  annee1: {
    id: "annee-1",
    titre: "1ère Année Classes Préparatoires (Sup)",
    description: "Programme officiel de première année pour consolider vos bases et acquérir les méthodes mathématiques rigoureuses.",
    branches: [
      {
        id: "tsi1",
        nom: "TSI 1",
        label: "Filière TSI 1ère Année",
        badge: "Technologique",
        icon: "T",
        chapitres: INITIAL_CHAPTERS
      },
      {
        id: "mpsi",
        nom: "MPSI",
        label: "Maths, Physique & Sciences de l'Ingénieur",
        badge: "Théorique & Fondamental",
        icon: "∑",
        chapitres: [
          {
            id: "mpsi-1",
            n: 1,
            titre: "Vocabulaire ensembliste, Logique & Raisonnements",
            cat: "algebre",
            badge: "Fondations",
            description: "Quantificateurs, récurrences fortes, relations d'équivalence et applications injectives/surjectives.",
            fiche_url: "https://drive.google.com/file/d/14p5mq_yxJqDasYcXNCglRc016HuNNw3M/view?usp=sharing",
            enonce_url: "https://drive.google.com/file/d/1Zy5WClguDAGXKTcH0gsBfDWes0twhGpL/view?usp=sharing",
            correction_url: "https://drive.google.com/file/d/1mz7emSAwMvTbU_gj0J6HJZSk5ejhcveB/view?usp=sharing",
            video_url: "https://www.youtube.com/watch?v=rawCPGARZ04",
            video_duration: "45 min"
          },
          {
            id: "mpsi-2",
            n: 2,
            titre: "Nombres complexes & Trigonométrie",
            cat: "algebre",
            badge: "Algèbre",
            description: "Formules d'Euler et de Moivre, racines n-ièmes de l'unité, géométrie euclidienne plane et similitudes.",
            fiche_url: "https://drive.google.com/file/d/1OuO-2h5nZwik2nktS8pcwZEkNPhLsRKT/view?usp=sharing",
            enonce_url: "https://drive.google.com/file/d/1E6Kb4Lpm6OHaV2szdY04gKvVmA32pWg5/view?usp=sharing",
            correction_url: "https://drive.google.com/file/d/13RN-WPd1YMvbg6TWL4D8-wXht02Iar3b/view?usp=sharing",
            video_url: "https://youtu.be/8EXSXe7i_KQ",
            video_duration: "38 min"
          },
          {
            id: "mpsi-3",
            n: 3,
            titre: "Polynômes à une indéterminée & Fractions rationnelles",
            cat: "algebre",
            badge: "Algèbre",
            description: "Division euclidienne, racines et multiplicité, relations coefficients-racines, décomposition en éléments simples.",
            fiche_url: null,
            enonce_url: "https://drive.google.com/file/d/1uoXUkzQNY1aUeLwy39AbqolqAhmv5Eie/view?usp=sharing",
            correction_url: "https://drive.google.com/file/d/1AfvinK-vBBn0gvVsCCkJyFhoY8uTsBdV/view?usp=sharing",
            video_url: "https://youtu.be/wrS32nCwmR4",
            video_duration: "52 min"
          },
          {
            id: "mpsi-4",
            n: 4,
            titre: "Espaces vectoriels & Applications linéaires",
            cat: "algebre",
            badge: "Pilier Sup",
            description: "Sous-espaces vectoriels, sommes directes, théorème du rang, bases et dimension finie.",
            fiche_url: "https://drive.google.com/file/d/14p5mq_yxJqDasYcXNCglRc016HuNNw3M/view?usp=sharing",
            enonce_url: "https://drive.google.com/file/d/1Zy5WClguDAGXKTcH0gsBfDWes0twhGpL/view?usp=sharing",
            correction_url: "https://drive.google.com/file/d/1mCPWqCNIB3Mzw2uueuAMCbdFKIO94NGc/view?usp=sharing",
            video_url: "https://drive.google.com/file/d/1CD93AzmoWJgJvGjVp2AsIBmP8Iyb3j4Q/view?usp=sharing",
            video_duration: "65 min"
          },
          {
            id: "mpsi-5",
            n: 5,
            titre: "Calcul matriciel & Systèmes linéaires",
            cat: "algebre",
            badge: "Calcul",
            description: "Matrices d'applications linéaires, changement de base, inversibilité et algorithme du pivot de Gauss.",
            fiche_url: null,
            enonce_url: "https://drive.google.com/file/d/1_201-3ajlM3S46X50a6Ld-_2o_qPN7w5/view?usp=sharing",
            correction_url: "https://drive.google.com/file/d/1RECaFZG5edDfNNEckHzyJTRRt_iYy3w0/view?usp=sharing",
            video_url: "https://www.youtube.com/watch?v=-2LJGMON7Cw",
            video_duration: "40 min"
          },
          {
            id: "mpsi-6",
            n: 6,
            titre: "Déterminants & Formes multilinéaires",
            cat: "algebre",
            badge: "Algèbre",
            description: "Propriétés du déterminant, comatrice, calculs par blocs et déterminants classiques (Vandermonde, circulantes).",
            fiche_url: "https://drive.google.com/file/d/1OuO-2h5nZwik2nktS8pcwZEkNPhLsRKT/view?usp=sharing",
            enonce_url: "https://drive.google.com/file/d/1E6Kb4Lpm6OHaV2szdY04gKvVmA32pWg5/view?usp=sharing",
            correction_url: "https://drive.google.com/file/d/13RN-WPd1YMvbg6TWL4D8-wXht02Iar3b/view?usp=sharing",
            video_url: "https://youtu.be/8EXSXe7i_KQ",
            video_duration: "48 min"
          },
          {
            id: "mpsi-7",
            n: 7,
            titre: "Suites réelles & complexes",
            cat: "analyse",
            badge: "Analyse",
            description: "Théorèmes de convergence monotone, suites adjacentes, théorème de Bolzano-Weierstrass et suites récurrentes.",
            fiche_url: "https://drive.google.com/file/d/1qSDn8RmZD0wneRHG8aOWGCkq_sqWErsT/view?usp=sharing",
            enonce_url: "https://drive.google.com/file/d/1n1zUz9wwZvOP1kzMp87ptg7Ir_Ha5zcT/view?usp=sharing",
            correction_url: "https://drive.google.com/file/d/1GLWuEzAi5ZVX8e_vVYfKFidv2TA7Vnfn/view?usp=sharing",
            video_url: "https://youtu.be/v2JkFvxiiFg",
            video_duration: "50 min"
          },
          {
            id: "mpsi-8",
            n: 8,
            titre: "Limites, Continuité & Fonctions réelles",
            cat: "analyse",
            badge: "Analyse",
            description: "Théorème des valeurs intermédiaires, théorème des bornes atteintes, continuité uniforme et homéomorphismes.",
            fiche_url: null,
            enonce_url: "https://drive.google.com/file/d/1A9AYWRPgKhj1c-fp1VWJuipRlHRpaANm/view?usp=sharing",
            correction_url: "https://drive.google.com/file/d/1kPL2Oe8aZTLwPkssKJOMGRxWfy2wGS8h/view?usp=sharing",
            video_url: "https://youtu.be/rawCPGARZ04",
            video_duration: "42 min"
          },
          {
            id: "mpsi-9",
            n: 9,
            titre: "Intégration sur un segment & Formules de Taylor",
            cat: "analyse",
            badge: "Pilier Analyse",
            description: "Intégrale de Riemann, sommes de Riemann, intégration par parties, changements de variable et inégalité de Taylor-Lagrange.",
            fiche_url: "https://drive.google.com/file/d/1KHTrCFgCFXOjYtew6_2xWm6jiKSjkYdc/view?usp=sharing",
            enonce_url: "https://drive.google.com/file/d/1HjTf9KEc5jAiFkbRpNkFNJmkzxdLg92e/view?usp=sharing",
            correction_url: "https://drive.google.com/file/d/1uIbE36LoFvYh7zyi9m5U3W2fBWEDPM92/view?usp=sharing",
            video_url: "https://youtu.be/VNkWUwhJT2g",
            video_duration: "55 min"
          },
          {
            id: "mpsi-10",
            n: 10,
            titre: "Probabilités sur un univers fini",
            cat: "proba",
            badge: "Probabilités",
            description: "Espaces probabilisés finis, conditionnement, formule des probabilités totales, formule de Bayes et variables aléatoires.",
            fiche_url: "https://drive.google.com/file/d/1B3zEjKJe1GjlZ0hZKjR4ASSZ0TD1yuLg/view?usp=sharing",
            enonce_url: "https://drive.google.com/file/d/1QLm_IpukDR3ukj95ys5-sz63Pw9-Ovbs/view?usp=sharing",
            correction_url: "https://drive.google.com/file/d/1csPA7_aR1XGZq-mVLbdQVsqzWMpridYD/view?usp=sharing",
            video_url: null,
            video_duration: null
          }
        ]
      },
      {
        id: "pcsi",
        nom: "PCSI",
        label: "Physique, Chimie & Sciences de l'Ingénieur",
        badge: "Sciences Appliquées",
        icon: "∫",
        chapitres: [
          {
            id: "pcsi-1",
            n: 1,
            titre: "Espaces vectoriels & Algèbre linéaire",
            cat: "algebre",
            badge: "Algèbre",
            description: "Structure vectorielle, sous-espaces, bases et calculs des dimensions en PCSI.",
            fiche_url: "https://drive.google.com/file/d/14p5mq_yxJqDasYcXNCglRc016HuNNw3M/view?usp=sharing",
            enonce_url: "https://drive.google.com/file/d/1Zy5WClguDAGXKTcH0gsBfDWes0twhGpL/view?usp=sharing",
            correction_url: "https://drive.google.com/file/d/1mz7emSAwMvTbU_gj0J6HJZSk5ejhcveB/view?usp=sharing",
            video_url: null,
            video_duration: null
          },
          {
            id: "pcsi-2",
            n: 2,
            titre: "Calcul matriciel & Systèmes linéaires",
            cat: "algebre",
            badge: "Algèbre",
            description: "Matrices, déterminants d'ordre 2 et 3, inversions et résolution des circuits et systèmes couplés.",
            fiche_url: null,
            enonce_url: "https://drive.google.com/file/d/1_201-3ajlM3S46X50a6Ld-_2o_qPN7w5/view?usp=sharing",
            correction_url: null,
            video_url: "https://youtu.be/Sp4sGLjFKz4",
            video_duration: "30 min"
          },
          {
            id: "pcsi-3",
            n: 3,
            titre: "Intégration & Équations différentielles",
            cat: "analyse",
            badge: "Analyse",
            description: "Équations linéaires d'ordre 1 et 2 à coefficients constants avec second membre physique.",
            fiche_url: "https://drive.google.com/file/d/1KHTrCFgCFXOjYtew6_2xWm6jiKSjkYdc/view?usp=sharing",
            enonce_url: "https://drive.google.com/file/d/1HjTf9KEc5jAiFkbRpNkFNJmkzxdLg92e/view?usp=sharing",
            correction_url: null,
            video_url: "https://youtu.be/VNkWUwhJT2g",
            video_duration: "45 min"
          },
          {
            id: "pcsi-4",
            n: 4,
            titre: "Produit scalaire & Espaces euclidiens",
            cat: "algebre",
            badge: "Géométrie",
            description: "Inégalité de Cauchy-Schwarz, orthogonalité, projection orthogonale et distance.",
            fiche_url: "https://drive.google.com/file/d/1bRrvkojc9E-MZiYS35LArTJi44bln8Zy/view?usp=sharing",
            enonce_url: "https://drive.google.com/file/d/1y2rzX5UjsgidvbRc_2UWSvsljljpV83X/view?usp=sharing",
            correction_url: null,
            video_url: "https://youtu.be/1FsyIs3b584",
            video_duration: "40 min"
          }
        ]
      },
      {
        id: "ecs1",
        nom: "ECS 1",
        label: "Économique & Commerciale Option Scientifique (1ère Année)",
        badge: "Économique & Maths",
        icon: "E",
        chapitres: [
          {
            id: "ecs1-1",
            n: 1,
            titre: "Algèbre linéaire & Calcul matriciel",
            cat: "algebre",
            badge: "Algèbre",
            description: "Opérations matricielles, puissances de matrices, inversion et projecteurs.",
            fiche_url: "https://drive.google.com/file/d/14p5mq_yxJqDasYcXNCglRc016HuNNw3M/view?usp=sharing",
            enonce_url: "https://drive.google.com/file/d/1Zy5WClguDAGXKTcH0gsBfDWes0twhGpL/view?usp=sharing",
            correction_url: "https://drive.google.com/file/d/1mz7emSAwMvTbU_gj0J6HJZSk5ejhcveB/view?usp=sharing",
            video_url: "https://youtu.be/0Mdd_ZLeN3U",
            video_duration: "55 min"
          },
          {
            id: "ecs1-2",
            n: 2,
            titre: "Suites numériques & Modèles de croissance",
            cat: "analyse",
            badge: "Analyse",
            description: "Comportement asymptotique, suites arithmético-géométriques et récurrences d'ordre 2.",
            fiche_url: "https://drive.google.com/file/d/1qSDn8RmZD0wneRHG8aOWGCkq_sqWErsT/view?usp=sharing",
            enonce_url: "https://drive.google.com/file/d/1n1zUz9wwZvOP1kzMp87ptg7Ir_Ha5zcT/view?usp=sharing",
            correction_url: "https://drive.google.com/file/d/1GLWuEzAi5ZVX8e_vVYfKFidv2TA7Vnfn/view?usp=sharing",
            video_url: null,
            video_duration: null
          },
          {
            id: "ecs1-3",
            n: 3,
            titre: "Probabilités discrètes & Dénombrement",
            cat: "proba",
            badge: "Probabilités",
            description: "Variables aléatoires finies, lois usuelles (Bernoulli, Binomiale, Uniforme) et espérance mathématique.",
            fiche_url: "https://drive.google.com/file/d/1B3zEjKJe1GjlZ0hZKjR4ASSZ0TD1yuLg/view?usp=sharing",
            enonce_url: "https://drive.google.com/file/d/1csPA7_aR1XGZq-mVLbdQVsqzWMpridYD/view?usp=sharing",
            correction_url: null,
            video_url: null,
            video_duration: null
          }
        ]
      },
      {
        id: "ect1",
        nom: "ECT 1",
        label: "Économique & Commerciale Option Technologique (1ère Année)",
        badge: "Management & Maths",
        icon: "€",
        chapitres: [
          {
            id: "ect1-1",
            n: 1,
            titre: "Calcul matriciel & Déterminants",
            cat: "algebre",
            badge: "Algèbre",
            description: "Multiplication matricielle, calcul de l'inverse et systèmes d'équations économiques.",
            fiche_url: "",
            enonce_url: "",
            correction_url: null,
            video_url: null,
            video_duration: null
          },
          {
            id: "ect1-2",
            n: 2,
            titre: "Suites & Fonctions d'une variable",
            cat: "analyse",
            badge: "Analyse",
            description: "Étude des fonctions usuelles, dérivées et optimisation d'une fonction de coût/profit.",
            fiche_url: "",
            enonce_url: "",
            correction_url: null,
            video_url: null,
            video_duration: null
          },
          {
            id: "ect1-3",
            n: 3,
            titre: "Probabilités & Statistiques descriptives",
            cat: "proba",
            badge: "Probabilités",
            description: "Moyenne, variance, médiane, diagrammes et calculs élémentaires de probabilités.",
            fiche_url: "",
            enonce_url: "",
            correction_url: null,
            video_url: null,
            video_duration: null
          }
        ]
      }
    ]
  },

  annee2: {
    id: "annee-2",
    titre: "2ème Année Classes Préparatoires (Spé)",
    description: "Préparation intensive aux épreuves écrites et orales des concours d'excellence (CNC, Mines-Ponts, Centrale, CCINP, BCE/Ecricome).",
    branches: [
      {
        id: "mp",
        nom: "MP",
        label: "Maths-Physique (MP / MP*)",
        badge: "Concours CNC / X-Mines-Centrale",
        icon: "∑",
        livres: [
          {
            titre: "Probabilités discrètes MP/MP*",
            auteur: "Jamel Jaber",
            lien: "https://drive.google.com/file/d/1gUSRREt2CF2aaCQz-PgURIWOV9UjOwN9/view?usp=sharing",
            cover: "https://drive.google.com/file/d/1q3EBxihbo2LmnVOJVZPi13PMhH2ywN6W/view?usp=sharing"
          },
          {
            titre: "Annales de concours MP",
            auteur: "Jean-François Dantzer",
            lien: "https://drive.google.com/file/d/1W7y6uo8xLnGr0sdLMYkl3i16VJ-XJHVy/view?usp=sharing",
            cover: null
          },
          {
            titre: "Exercices incontournables",
            auteur: "Édition Concours",
            lien: "https://drive.google.com/file/d/1V2at6I19YJSQoHoPZXFdRTkjKg7onidb/view?usp=sharing",
            cover: null
          },
          {
            titre: "Maths 2e année H-Prépa",
            auteur: "Collection H-Prépa",
            lien: "https://drive.google.com/file/d/1gOseXaiWakHATfU0_OOypzYR7OSpMAGg/view?usp=sharing",
            cover: null
          },
          {
            titre: "Mathématiques en MP (Cours MP4 Louis-le-Grand)",
            auteur: "Omar Bennouna, Issam Tauil & M.C.",
            lien: "https://drive.google.com/file/d/1d7a2fjtJIyBZTXLteuprK-MmhwqZ3z-Q/view?usp=sharing",
            cover: null
          },
          {
            titre: "Maths Tout-en-un MPI/MPI*",
            auteur: "Dunod",
            lien: "https://drive.google.com/file/d/1NkMjZjypjjprW2VALv5Mk7S5QKvtenlL/view?usp=sharing",
            cover: null
          }
        ],
        chapitres: [
          {
            id: "mp-1",
            n: 1,
            titre: "Structures algébriques",
            cat: "algebre",
            badge: "Algèbre",
            description: "Groupes, idéaux, anneaux, corps, morphismes, algèbres.",
            cours: [{ t: "Cours complet", sous: "Théorie & démonstrations", u: "" }],
            fiches: [{ t: "Fiche de résumé", sous: "L'essentiel du chapitre", u: "https://drive.google.com/file/d/1ag-3r3rBJ-RQsaQG2ARxz_-LbYMgkE2P/view?usp=sharing" }],
            tds: [{ t: "TD 1", sous: "Exercices d'application", exo: "", corr: "" }],
            fiche_url: "https://drive.google.com/file/d/1ag-3r3rBJ-RQsaQG2ARxz_-LbYMgkE2P/view?usp=sharing"
          },
          {
            id: "mp-2",
            n: 2,
            titre: "Compléments d'algèbre linéaire",
            cat: "algebre",
            badge: "Algèbre",
            description: "Sommes directes, matrices par blocs, trace, hyperplans.",
            cours: [{ t: "Cours complet", sous: "Théorie & démonstrations", u: "" }],
            fiches: [{ t: "Fiche de résumé", sous: "L'essentiel du chapitre", u: "" }],
            tds: [{ t: "TD 1", sous: "Exercices d'application", exo: "", corr: "" }]
          },
          {
            id: "mp-3",
            n: 3,
            titre: "Réduction des endomorphismes",
            cat: "algebre",
            badge: "Pilier Concours",
            description: "Valeurs propres, polynômes annulateurs, diagonalisation, trigonalisation.",
            cours: [{ t: "Cours complet", sous: "Théorie & démonstrations", u: "" }],
            fiches: [{ t: "Fiche de résumé", sous: "L'essentiel du chapitre", u: "" }],
            tds: [{ t: "TD 1", sous: "Exercices d'application", exo: "", corr: "" }]
          },
          {
            id: "mp-4",
            n: 4,
            titre: "Topologie des espaces normés",
            cat: "analyse",
            badge: "Topologie",
            description: "Ouverts, fermés, compacité, connexité par arcs, normes équivalentes.",
            cours: [
              {
                t: "Séance 1 (Normes & EVN)",
                sous: "Théorie & démonstrations",
                u: "https://drive.google.com/file/d/1D8aUxMGf--TRuYYQJHgmVxCAb4aoO4K0/view?usp=sharing",
                v: "https://youtu.be/gt-dz_nBt68"
              },
              {
                t: "Séance 2 (Normes équivalentes & distance)",
                sous: "Théorie & démonstrations",
                u: "https://drive.google.com/file/d/1NLmS20uOR1O2GQ-vf1nwSBQMtXVWw3TB/view?usp=sharing",
                v: "https://youtu.be/-iyPBLNn648"
              },
              {
                t: "Séance 3 (Parties bornées, boules & suites)",
                sous: "Théorie & applications interactives",
                u: "https://drive.google.com/file/d/15rr5lsKXhRcSi6kIEgeYFw3e2jJpViFF/view?usp=sharing",
                v: "https://youtu.be/yhKyDz4ofJY"
              }
            ],
            fiches: [
              {
                t: "Fiche de résumé",
                sous: "L'essentiel du cours",
                u: "https://drive.google.com/file/d/1j9CaHOXMAhP4SyiaYWekTL1EMr_H7wsg/view?usp=sharing"
              },
              {
                t: "Fiche de cours synthétique",
                sous: "Formules & propriétés clés",
                u: "https://drive.google.com/file/d/1RyF9URY3FICkHlLaQxATOkC3KRhi8Mtw/view?usp=sharing"
              },
              {
                t: "Fiche de cours complet",
                sous: "Cours complet détaillé",
                u: "https://drive.google.com/file/d/1wrkLjq1-B7d4eMWNQuiENE1virfy1XQN/view?usp=sharing"
              }
            ],
            tds: [{ t: "TD 1", sous: "Exercices d'application", exo: "", corr: "" }],
            videos: [{ t: "Séance interactive — Les normes", sous: "Replay · Séance live", y: "https://youtu.be/gt-dz_nBt68" }],
            fiche_url: "https://drive.google.com/file/d/1j9CaHOXMAhP4SyiaYWekTL1EMr_H7wsg/view?usp=sharing",
            video_url: "https://youtu.be/gt-dz_nBt68"
          },
          {
            id: "mp-5",
            n: 5,
            titre: "Séries numériques",
            cat: "analyse",
            badge: "Analyse",
            description: "Convergence, règles de comparaison, séries alternées, sommation.",
            cours: [{ t: "Cours complet", sous: "Théorie & démonstrations", u: "" }],
            fiches: [{ t: "Fiche de résumé", sous: "L'essentiel du chapitre", u: "" }],
            tds: [{ t: "TD 1", sous: "Exercices d'application", exo: "", corr: "" }]
          },
          {
            id: "mp-6",
            n: 6,
            titre: "Familles sommables",
            cat: "analyse",
            badge: "Analyse",
            description: "Sommabilité, Fubini discret, produit de Cauchy.",
            cours: [{ t: "Cours complet", sous: "Théorie & démonstrations", u: "" }],
            fiches: [{ t: "Fiche de résumé", sous: "L'essentiel du chapitre", u: "" }],
            tds: [{ t: "TD 1", sous: "Exercices d'application", exo: "", corr: "" }]
          },
          {
            id: "mp-7",
            n: 7,
            titre: "Suites et séries de fonctions",
            cat: "analyse",
            badge: "Analyse",
            description: "Convergence simple, uniforme, normale et théorèmes d'interversion.",
            cours: [{ t: "Cours complet", sous: "Théorie & démonstrations", u: "" }],
            fiches: [{ t: "Fiche de résumé", sous: "L'essentiel du chapitre", u: "" }],
            tds: [{ t: "TD 1", sous: "Exercices d'application", exo: "", corr: "" }]
          },
          {
            id: "mp-8",
            n: 8,
            titre: "Séries entières",
            cat: "analyse",
            badge: "Analyse",
            description: "Rayon de convergence, développement en série entière, fonctions usuelles.",
            cours: [{ t: "Cours complet", sous: "Théorie & démonstrations", u: "" }],
            fiches: [{ t: "Fiche de résumé", sous: "L'essentiel du chapitre", u: "" }],
            tds: [{ t: "TD 1", sous: "Exercices d'application", exo: "", corr: "" }]
          },
          {
            id: "mp-9",
            n: 9,
            titre: "Intégration sur un intervalle quelconque",
            cat: "analyse",
            badge: "Analyse",
            description: "Intégrales généralisées, convergence dominée, théorème de Fubini.",
            cours: [{ t: "Cours complet", sous: "Théorie & démonstrations", u: "" }],
            fiches: [{ t: "Fiche de résumé", sous: "L'essentiel du chapitre", u: "" }],
            tds: [{ t: "TD 1", sous: "Exercices d'application", exo: "", corr: "" }]
          },
          {
            id: "mp-10",
            n: 10,
            titre: "Intégrales à paramètre",
            cat: "analyse",
            badge: "Analyse",
            description: "Continuité, dérivabilité sous le signe intégral, applications.",
            cours: [{ t: "Cours complet", sous: "Théorie & démonstrations", u: "" }],
            fiches: [{ t: "Fiche de résumé", sous: "L'essentiel du chapitre", u: "" }],
            tds: [{ t: "TD 1", sous: "Exercices d'application", exo: "", corr: "" }]
          },
          {
            id: "mp-11",
            n: 11,
            titre: "Équations différentielles linéaires",
            cat: "analyse",
            badge: "Analyse",
            description: "Systèmes différentiels, wronskien, méthode de variation des constantes.",
            cours: [{ t: "Cours complet", sous: "Théorie & démonstrations", u: "" }],
            fiches: [{ t: "Fiche de résumé", sous: "L'essentiel du chapitre", u: "" }],
            tds: [{ t: "TD 1", sous: "Exercices d'application", exo: "", corr: "" }]
          },
          {
            id: "mp-12",
            n: 12,
            titre: "Calcul différentiel",
            cat: "analyse",
            badge: "Analyse Avancée",
            description: "Dérivées partielles, différentielle, gradient, extremums locaux et globaux.",
            cours: [{ t: "Cours complet", sous: "Théorie & démonstrations", u: "" }],
            fiches: [{ t: "Fiche de résumé", sous: "L'essentiel du chapitre", u: "" }],
            tds: [{ t: "TD 1", sous: "Exercices d'application", exo: "", corr: "" }]
          },
          {
            id: "mp-13",
            n: 13,
            titre: "Espaces préhilbertiens et euclidiens",
            cat: "geometrie",
            badge: "Géométrie & Algèbre",
            description: "Produit scalaire, orthogonalité, projection, distance, inégalité de Jensen.",
            cours: [
              {
                t: "Séance 1 (Produit scalaire)",
                sous: "Théorie & démonstrations",
                u: "https://drive.google.com/file/d/1Kt6mwfiKp_fMYaOvXT36Nzar7gI9AdZP/view?usp=sharing",
                v: "https://youtu.be/1FsyIs3b584"
              },
              {
                t: "Séance 2 (Orthogonalité)",
                sous: "Théorie & démonstrations",
                u: "https://drive.google.com/file/d/1Wxy3FiqERxLg3y4KRDnC9Odr1ZZPy_A4/view?usp=sharing"
              }
            ],
            fiches: [
              {
                t: "Fiche de résumé",
                sous: "L'essentiel du chapitre",
                u: "https://drive.google.com/file/d/1B3zEjKJe1GjlZ0hZKjR4ASSZ0TD1yuLg/view?usp=sharing"
              }
            ],
            tds: [{ t: "TD 1", sous: "Exercices d'application", exo: "", corr: "" }],
            fiche_url: "https://drive.google.com/file/d/1B3zEjKJe1GjlZ0hZKjR4ASSZ0TD1yuLg/view?usp=sharing",
            video_url: "https://youtu.be/1FsyIs3b584"
          },
          {
            id: "mp-14",
            n: 14,
            titre: "Probabilités discrètes",
            cat: "probabilites",
            badge: "Probabilités",
            description: "Espaces probabilisés, variables aléatoires discrètes, lois usuelles, espérance, variance.",
            cours: [{ t: "Cours complet", sous: "Théorie & démonstrations", u: "" }],
            fiches: [{ t: "Fiche de résumé", sous: "L'essentiel du chapitre", u: "" }],
            tds: [{ t: "TD 1", sous: "Exercices d'application", exo: "", corr: "" }]
          }
        ]
      },
      {
        id: "psi",
        nom: "PSI",
        label: "Physique & Sciences de l'Ingénieur (PSI / PSI*)",
        badge: "Concours Ingénierie",
        icon: "∫",
        chapitres: [
          {
            id: "psi-1",
            n: 1,
            titre: "Réduction des matrices & Systèmes différentiels",
            cat: "algebre",
            badge: "Algèbre & SI",
            description: "Diagonalisation, trigonalisation et résolution de X' = AX pour la dynamique des systèmes.",
            fiche_url: "",
            enonce_url: "",
            correction_url: null,
            video_url: null,
            video_duration: null
          },
          {
            id: "psi-2",
            n: 2,
            titre: "Espaces euclidiens & Isométries vectorielles",
            cat: "algebre",
            badge: "Géométrie",
            description: "Matrices orthogonales, réflexions, rotations et orthogonalité.",
            fiche_url: "https://drive.google.com/file/d/1bRrvkojc9E-MZiYS35LArTJi44bln8Zy/view?usp=sharing",
            enonce_url: "",
            correction_url: null,
            video_url: "https://youtu.be/1FsyIs3b584",
            video_duration: "40 min"
          },
          {
            id: "psi-3",
            n: 3,
            titre: "Séries & Intégrales à paramètre",
            cat: "analyse",
            badge: "Analyse",
            description: "Théorème de convergence dominée, intégration terme à terme et transformées intégrales.",
            fiche_url: "https://drive.google.com/file/d/1KHTrCFgCFXOjYtew6_2xWm6jiKSjkYdc/view?usp=sharing",
            enonce_url: "",
            correction_url: null,
            video_url: "https://youtu.be/VNkWUwhJT2g",
            video_duration: "50 min"
          }
        ]
      },
      {
        id: "tsi2",
        nom: "TSI 2",
        label: "Technologie & Sciences Industrielles (2ème Année)",
        badge: "Concours CNC TSI",
        icon: "T",
        chapitres: [
          {
            id: "tsi2-1",
            n: 1,
            titre: "Réduction des endomorphismes & Matrices symétriques",
            cat: "algebre",
            badge: "Algèbre Spé",
            description: "Diagonalisation, puissance k-ième de matrices et formes quadratiques.",
            fiche_url: "https://drive.google.com/file/d/14p5mq_yxJqDasYcXNCglRc016HuNNw3M/view?usp=sharing",
            enonce_url: "https://drive.google.com/file/d/1Zy5WClguDAGXKTcH0gsBfDWes0twhGpL/view?usp=sharing",
            correction_url: "https://drive.google.com/file/d/1mz7emSAwMvTbU_gj0J6HJZSk5ejhcveB/view?usp=sharing",
            video_url: "https://youtu.be/0Mdd_ZLeN3U",
            video_duration: "55 min"
          },
          {
            id: "tsi2-2",
            n: 2,
            titre: "Intégrales généralisées & Séries entières",
            cat: "analyse",
            badge: "Analyse Spé",
            description: "Convergence des intégrales impropres, calcul de rayons de convergence et développements en séries entières.",
            fiche_url: "https://drive.google.com/file/d/1KHTrCFgCFXOjYtew6_2xWm6jiKSjkYdc/view?usp=sharing",
            enonce_url: "https://drive.google.com/file/d/15fwfeFIpGaUVsDrT8otnX2H6hjBdBrei/view?usp=sharing",
            correction_url: null,
            video_url: "https://youtu.be/CU7rXoNvIL0",
            video_duration: "45 min"
          },
          {
            id: "tsi2-3",
            n: 3,
            titre: "Probabilités discrètes & Variables aléatoires",
            cat: "proba",
            badge: "Probabilités",
            description: "Variables discrètes infinies, lois usuelles, espérance et variance.",
            fiche_url: "https://drive.google.com/file/d/1B3zEjKJe1GjlZ0hZKjR4ASSZ0TD1yuLg/view?usp=sharing",
            enonce_url: "",
            correction_url: null,
            video_url: null,
            video_duration: null
          }
        ]
      },
      {
        id: "ecs2",
        nom: "ECS 2",
        label: "Économique & Commerciale Option Scientifique (2ème Année)",
        badge: "BCE / Ecricome",
        icon: "E",
        chapitres: [
          {
            id: "ecs2-1",
            n: 1,
            titre: "Algèbre bilinéaire & Réduction des endomorphismes symétriques",
            cat: "algebre",
            badge: "Pilier BCE",
            description: "Produit scalaire, orthogonalité, matrice du produit scalaire et réduction symétrique.",
            fiche_url: "",
            enonce_url: "https://drive.google.com/file/d/1yaVTy-vHFVcNCvPrvDIqeUAjAUPJ6Zfa/view?usp=sharing",
            correction_url: "https://drive.google.com/file/d/1Xn5MvoD9Q2g5Qz_zgllpkUz6CFQX12VT/view?usp=sharing",
            video_url: "https://youtu.be/nCY1psyB09Y",
            video_duration: "60 min"
          },
          {
            id: "ecs2-2",
            n: 2,
            titre: "Variables aléatoires à densité & Probabilités continues",
            cat: "proba",
            badge: "Probabilités Spé",
            description: "Densité de probabilité, fonction de répartition, lois normales, exponentielles et théorème central limite.",
            fiche_url: "https://drive.google.com/file/d/1B3zEjKJe1GjlZ0hZKjR4ASSZ0TD1yuLg/view?usp=sharing",
            enonce_url: "https://drive.google.com/file/d/1N5AjcoqoQN9xDBaIQJPTkblJ6B-Iq0jc/view?usp=sharing",
            correction_url: null,
            video_url: null,
            video_duration: null
          },
          {
            id: "ecs2-3",
            n: 3,
            titre: "Fonctions de plusieurs variables & Optimisation",
            cat: "analyse",
            badge: "Analyse & Éco",
            description: "Dérivées partielles, gradient, matrice hessienne, extremums libres et sous contrainte d'égalité.",
            fiche_url: "",
            enonce_url: "",
            correction_url: null,
            video_url: null,
            video_duration: null
          }
        ]
      },
      {
        id: "ect2",
        nom: "ECT 2",
        label: "Économique & Commerciale Option Technologique (2ème Année)",
        badge: "Concours Écoles de Commerce",
        icon: "€",
        chapitres: [
          {
            id: "ect2-1",
            n: 1,
            titre: "Matrices, Déterminants & Diagonalisation",
            cat: "algebre",
            badge: "Algèbre",
            description: "Recherche de valeurs propres, diagonalisation des matrices 2x2 et 3x3.",
            fiche_url: "",
            enonce_url: "",
            correction_url: null,
            video_url: null,
            video_duration: null
          },
          {
            id: "ect2-2",
            n: 2,
            titre: "Intégration & Probabilités continues",
            cat: "proba",
            badge: "Probabilités",
            description: "Calculs d'aires, lois uniformes et normales appliquées à la gestion et au commerce.",
            fiche_url: "",
            enonce_url: "",
            correction_url: null,
            video_url: null,
            video_duration: null
          }
        ]
      }
    ]
  }
};
