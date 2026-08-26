export const PASSERELLE_DATA = {
  id: "passerelle-sup-spe",
  titre: "La Passerelle Sup → Spé",
  eyebrow: "Accompagnement Mathématiques",
  description: "Tout ce qu'il faut maîtriser pour réussir votre rentrée en deuxième année de CPGE.",
  filieres: [
    {
      id: "mp",
      nom: "MP",
      de: "MPSI",
      vers: "MP",
      icon: "∑",
      chapitres: [
        {
          id: "mp-alg-lin",
          titre: "Algèbre linéaire",
          why: "Socle de toute la réduction des endomorphismes en MP.",
          fiche: "https://drive.google.com/file/d/14p5mq_yxJqDasYcXNCglRc016HuNNw3M/view?usp=sharing",
          items: [
            {
              id: "mp-alg-1",
              titre: "Fiche 1 de révision d'algèbre linéaire",
              enonce: "https://drive.google.com/file/d/1Zy5WClguDAGXKTcH0gsBfDWes0twhGpL/view?usp=sharing",
              correction: [
                { label: "Exos 1-2 & 14", url: "https://drive.google.com/file/d/1mz7emSAwMvTbU_gj0J6HJZSk5ejhcveB/view?usp=sharing" },
                { label: "Exos 16 & 17", url: "https://drive.google.com/file/d/1mCPWqCNIB3Mzw2uueuAMCbdFKIO94NGc/view?usp=sharing" }
              ],
              video: null
            },
            {
              id: "mp-alg-2",
              titre: "Exercice sur les projecteurs",
              enonce: "https://drive.google.com/file/d/1GByznR3IyXyiJuRr93vxuXiO86CkXCaX/view?usp=sharing",
              correction: "https://drive.google.com/file/d/1xodzCmuCKHOW2FcLAvF5sL2RUHxcYrmm/view?usp=sharing",
              video: null
            },
            {
              id: "mp-alg-3",
              titre: "Image et noyau itérés, indice de Fitting",
              enonce: "https://drive.google.com/file/d/1ZggfM2jY7rp8ru0-emdmcuvPAVjhc-_W/view?usp=sharing",
              correction: "https://drive.google.com/file/d/1KL1GbmwZ-B5pSDLveO7nkrqnkajcoPFy/view?usp=sharing",
              video: "https://drive.google.com/file/d/1CD93AzmoWJgJvGjVp2AsIBmP8Iyb3j4Q/view?usp=sharing"
            },
            {
              id: "mp-alg-4",
              titre: "Extrait du CNC Marocain pour 1ère année - Année 2024 Filière MP",
              enonce: "https://drive.google.com/file/d/11Ajy7k2RMiCFQY5mNuFQ4KF7wxtM5XeY/view?usp=sharing",
              correction: "https://drive.google.com/file/d/1LgxdWbiV4M_E_6MggZmGHdH_QunCV3No/view?usp=sharing",
              video: null
            },
            {
              id: "mp-alg-5",
              titre: "Extrait – Session 2009 – MP: Approximation polynômiale au sens des moindres carrés",
              enonce: "https://drive.google.com/file/d/1kmXsUUFYEaV7XahuOWHVDpxFKJ8_5wv-/view?usp=sharing",
              correction: null,
              video: null
            },
            {
              id: "mp-alg-6",
              titre: "CNC - Session 2011 - MP",
              enonce: "https://drive.google.com/file/d/14mBZeR1PcoBCHu5q4SvLXauDWT82WtFz/view?usp=sharing",
              correction: null,
              video: null
            },
            {
              id: "mp-alg-7",
              titre: "CNC - 2014 : Caractérisation des homothéties en dimension 2 Application au commutant",
              enonce: "https://drive.google.com/file/d/1DWioB60yIslTU0zwIYfJNpRE9YfS-3BC/view?usp=sharing",
              correction: null,
              video: null
            },
            {
              id: "mp-alg-8",
              titre: "Concours National Commun – Session 2016 – Filière MP : tout hyperplan vectoriel de E contient au moins une matrice inversible",
              enonce: "https://drive.google.com/file/d/1753wxjMvyCBmZYY41Gv2pMsyVeTpMr4r/view?usp=sharing",
              correction: null,
              video: null
            },
            {
              id: "mp-alg-9",
              titre: "ECOLE POLYTECHNIQUE - 2017: forme symplectique",
              enonce: "https://drive.google.com/file/d/1KrN0BjTH2dvszlGU20Swluan2h4DNAls/view?usp=sharing",
              correction: null,
              video: null
            }
          ],
          seances: []
        },
        {
          id: "mp-analyse-rev",
          titre: "Révision d'analyse",
          why: "Prérequis directs et indispensables pour aborder l'analyse en toute confiance.",
          fiche: null,
          items: [
            {
              id: "mp-ana-1",
              titre: "Fiche N° 1",
              enonce: "https://drive.google.com/file/d/1A9AYWRPgKhj1c-fp1VWJuipRlHRpaANm/view?usp=sharing",
              correction: null,
              video: null
            }
          ],
          seances: [
            {
              id: "mp-ana-s1",
              titre: "Correction du premier problème de la fiche N°1",
              video: null,
              support: "https://drive.google.com/file/d/1kPL2Oe8aZTLwPkssKJOMGRxWfy2wGS8h/view?usp=sharing"
            },
            {
              id: "mp-ana-s2",
              titre: "Correction du deuxième problème de la fiche N°1: Fonction Gamma",
              video: "https://youtu.be/rawCPGARZ04",
              support: "https://drive.google.com/file/d/1u89mFPNP8qfhjc4S4PIQuuwqBHxn31PL/view?usp=sharing"
            },
            {
              id: "mp-ana-s3",
              titre: "Correction du troisième problème de la fiche N°1",
              video: null,
              support: "https://drive.google.com/file/d/1jvKURxojuYy1hnLX-OET_xYSeiIrrUYt/view?usp=sharing"
            }
          ]
        },
        {
          id: "mp-det",
          titre: "Calculs des determinants",
          why: "Prérequis directs et indispensables pour calculer les determinants",
          fiche: [
            { label: "détaillée", url: "https://drive.google.com/file/d/1OuO-2h5nZwik2nktS8pcwZEkNPhLsRKT/view?usp=sharing" },
            { label: "de synthèse et d'entraînement", url: "https://drive.google.com/file/d/1NKOGhEGplv4E8J18ZJTrsssOwfTWO_TG/view?usp=sharing" }
          ],
          items: [
            {
              id: "mp-det-1",
              titre: "Déterminants classiques",
              enonce: "https://drive.google.com/file/d/1E6Kb4Lpm6OHaV2szdY04gKvVmA32pWg5/view?usp=sharing",
              correction: [
                { label: "Calcul des determinants: Vandermonde, la matrice circulante et de la matrice compagnon", url: "https://drive.google.com/file/d/13RN-WPd1YMvbg6TWL4D8-wXht02Iar3b/view?usp=sharing" },
                { label: "Exos 3: Déterminant de Cauchy et de la matrice de Hilbert", url: "https://drive.google.com/file/d/1jRdEyzRoAA4DnT5yEMZtFEQZ5wpKWO2r/view?usp=sharing" }
              ],
              video: null
            }
          ],
          seances: [
            {
              id: "mp-det-s1",
              titre: "Calcul des determinants: Vandermonde, la matrice circulante et de la matrice compagnon",
              video: "https://youtu.be/8EXSXe7i_KQ",
              support: "https://drive.google.com/file/d/13RN-WPd1YMvbg6TWL4D8-wXht02Iar3b/view?usp=sharing"
            }
          ]
        },
        {
          id: "mp-suites-series",
          titre: "Suites & séries numériques",
          why: "Fondation directe des séries de fonctions, des séries entières et des familles sommables étudiées en spé.",
          fiche: [
            { label: "détaillée", url: "https://drive.google.com/file/d/1qSDn8RmZD0wneRHG8aOWGCkq_sqWErsT/view?usp=sharing" },
            { label: "de synthèse et d'entraînement", url: "https://drive.google.com/file/d/1bS28V56U00uiETGqhJNMfbQ_2UvhtWzu/view?usp=sharing" },
            { label: "Séries numériques", url: "https://drive.google.com/file/d/1xSklzyd29I4Al_JKIdDHS9vuRlI-Dmdc/view?usp=sharing" }
          ],
          items: [
            {
              id: "mp-ss-1",
              titre: "CCINP MP 2014: convergence de séries par transformation d’Abel",
              enonce: "https://drive.google.com/file/d/1n1zUz9wwZvOP1kzMp87ptg7Ir_Ha5zcT/view?usp=sharing",
              correction: "https://drive.google.com/file/d/1GLWuEzAi5ZVX8e_vVYfKFidv2TA7Vnfn/view?usp=sharing",
              video: null
            },
            {
              id: "mp-ss-2",
              titre: "Formule de Wallis - Formule de Stirling - Développement asymptotique de n!",
              enonce: "https://drive.google.com/file/d/1UeOo0klVvAmJxVgRi3y7ugdNP55Ufv5K/view?usp=sharing",
              correction: "https://drive.google.com/file/d/14V9IQBRhb8uuutx7BLwjxrIulE1IblC-/view?usp=sharing",
              video: "https://youtu.be/v2JkFvxiiFg"
            },
            {
              id: "mp-ss-3",
              titre: "CCINP 2025- Autour du théorème de comparaison avec une intégrale",
              enonce: "https://drive.google.com/file/d/1VH1zvss1ShTgl_r_9Jt5eLmYqNOkzIKk/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-ss-4",
              titre: "Centrale 2015: Séries et Intégrales impropres",
              enonce: "https://drive.google.com/file/d/1s8DeY4O1Qh7D1as8N2tAmHPWZ3u90fiC/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-ss-5",
              titre: "Mines-Ponts 2020: Séries numériques et Intégrales",
              enonce: "https://drive.google.com/file/d/103OGWPhu67Z_V1v7TnQlib7T0Msv7CVY/view?usp=sharing",
              correction: "",
              video: null
            }
          ],
          seances: [
            {
              id: "mp-ss-s1",
              titre: "Série de Bertrand",
              video: "https://youtu.be/uEQFSHQ5k2I",
              support: "https://drive.google.com/file/d/1uIbE36LoFvYh7zyi9m5U3W2fBWEDPM92/view?usp=sharing"
            }
          ]
        },
        {
          id: "mp-integration",
          titre: "Intégration sur un segment - Intégrales généralisées",
          why: "Base de l'intégration sur un intervalle quelconque et des intégrales à paramètre.",
          fiche: "https://drive.google.com/file/d/1KHTrCFgCFXOjYtew6_2xWm6jiKSjkYdc/view?usp=sharing",
          items: [
            {
              id: "mp-int-1",
              titre: "Mines-Ponts 2020: Séries numériques et Intégrales",
              enonce: "https://drive.google.com/file/d/1npw04u-mKk0XCSJhCvFUcSr2x1YuVuMp/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-int-2",
              titre: "Extrait du CNC 2026 filière MP: Transformé de Laplace",
              enonce: "https://drive.google.com/file/d/13xri3BmvqO9BsFgB7LXr79PFVIkoUYJ0/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-int-3",
              titre: "CNC – Session 2017 – Filière MP: Calcul de la somme de la série de Riemann, pour alpha=2",
              enonce: "https://drive.google.com/file/d/1rRBcaMLSzV6uTutVrKeawvogleIaV4sU/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-int-4",
              titre: "CONCOURS Mine Pont 2026: Lemme fondamental du calcul variationnel",
              enonce: "https://drive.google.com/file/d/1c8goDOp3yWcUdgPERUXa7ZkrvbbTGtzJ/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-int-5",
              titre: "CONCOURS D’ADMISSION 2026- ECOLE POLYTECHNIQUE ESPCI: Sommes de Riemann",
              enonce: "https://drive.google.com/file/d/1c8goDOp3yWcUdgPERUXa7ZkrvbbTGtzJ/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-int-6",
              titre: "CONCOURS Mine Pont Session 2024",
              enonce: "https://drive.google.com/file/d/1j8QK2Q4VS7tbC2A0BLdl-wdLLOncmJTq/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-int-7",
              titre: "Centrale 2015 - Séries et Intégrales impropres: Fonction Gamma d'Euler",
              enonce: "https://drive.google.com/file/d/1o_nreJx8Anfg9GQus29KEWMBezR9yLdN/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-int-8",
              titre: "Fiche de révision",
              enonce: "https://drive.google.com/file/d/1HjTf9KEc5jAiFkbRpNkFNJmkzxdLg92e/view?usp=sharing",
              correction: "https://drive.google.com/file/d/1uIbE36LoFvYh7zyi9m5U3W2fBWEDPM92/view?usp=sharing",
              video: null
            }
          ],
          seances: [
            {
              id: "mp-int-s1",
              titre: "Intégrale de Dirichlet",
              video: "https://youtu.be/VNkWUwhJT2g",
              support: "https://drive.google.com/file/d/1uIbE36LoFvYh7zyi9m5U3W2fBWEDPM92/view?usp=sharing"
            },
            {
              id: "mp-int-s2",
              titre: "Intégrales généralisées & séries numériques : 2 problèmes corrigés pas à pas",
              video: "https://youtu.be/m164u6S0dOI",
              support: "https://drive.google.com/file/d/1FuzlIr-JtHUJvoJf_LIxEwbC_WBoml6c/view?usp=sharing"
            }
          ]
        },
        {
          id: "mp-proba",
          titre: "Probabilités",
          why: "Les probabilités sur un univers fini préparent l'étude des variables aléatoires discrètes infinies de deuxième année.",
          fiche: "",
          items: [
            {
              id: "mp-pr-1",
              titre: "CNC 2016: Une démonstration probabiliste du théorème de Stone-Weierstrass",
              enonce: "https://drive.google.com/file/d/1QLm_IpukDR3ukj95ys5-sz63Pw9-Ovbs/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-pr-2",
              titre: "CONCOURS 2015: Variables aléatoires sous-gaussiennes",
              enonce: "https://drive.google.com/file/d/19t7KCwPr3Pk792xp0ihPOT_vKEWWpQEo/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-pr-3",
              titre: "CONCOURS 2015 - Filière MP. Théorème d’approximation de Weierstrass",
              enonce: "https://drive.google.com/file/d/1VHGSyBpFCUbwjp_RmhVl4gnC_grbTBwJ/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-pr-4",
              titre: "ECOLE POLYTECHNIQUE Session 2026",
              enonce: "https://drive.google.com/file/d/1VjCUQMvNlIvdEsB1x0vo9l5IV21pBLrN/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-pr-5",
              titre: "Inégalité de Hölder- Une inégalité de déviation- Inégalités de Khintchine",
              enonce: "https://drive.google.com/file/d/1azKXrWOM3rKIHHvZ6ocnINp0IHFW6snf/view?usp=sharing",
              correction: "",
              video: null
            }
          ],
          seances: []
        },
        {
          id: "mp-esp-eucl",
          titre: "Espaces Euclidiens",
          why: "Indispensables à la réduction des endomorphismes symétriques et à l'étude des espaces préhilbertiens.",
          fiche: "https://drive.google.com/file/d/1bRrvkojc9E-MZiYS35LArTJi44bln8Zy/view?usp=sharing",
          items: [
            {
              id: "mp-eucl-1",
              titre: "Mini exercice pour déterminer l'orthogonal (CCINP 2021)",
              enonce: "https://drive.google.com/file/d/1y2rzX5UjsgidvbRc_2UWSvsljljpV83X/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-eucl-2",
              titre: "Extrait de CNC 2022-MP: Construction d'une base orthonormée d'un sous espace vectoriel de Rn",
              enonce: "https://drive.google.com/file/d/1Bo9NUIKCeXJGICnzbixWYW0DENT2SRPM/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-eucl-3",
              titre: "CCINP SESSION 2026",
              enonce: "https://drive.google.com/file/d/1vQC6gVzp5LSkjPxfntu99M1WSyyFINj7/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-eucl-4",
              titre: "Concours National Commun – Session 2026 – MP",
              enonce: "https://drive.google.com/file/d/1UaZ5RL87k9vsrAfK-2EsAzOxxn8y5BGW/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-eucl-5",
              titre: "EXTRAIT X-ENS 2025",
              enonce: "https://drive.google.com/file/d/174CRTg6or__NogtSHSLcU24KPKRFbAh0/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-eucl-6",
              titre: "Concours National Commun – Session 2019 – MP: Détérminant de Gram et application au calcul d’un minimum",
              enonce: "https://drive.google.com/file/d/1WzU_1Ida4PGGMg2ci6Q4Z84wQuCLBqVe/view?usp=sharing",
              correction: "",
              video: null
            }
          ],
          seances: [
            {
              id: "mp-eucl-s1",
              titre: "Séance 1 de cours",
              video: "https://youtu.be/1FsyIs3b584",
              support: "https://drive.google.com/file/d/1Kt6mwfiKp_fMYaOvXT36Nzar7gI9AdZP/view?usp=sharing"
            },
            {
              id: "mp-eucl-s2",
              titre: "Séance 2 de cours",
              video: "https://youtu.be/8dH0NMKnQ_4",
              support: "https://drive.google.com/file/d/1Wxy3FiqERxLg3y4KRDnC9Odr1ZZPy_A4/view?usp=sharing"
            },
            {
              id: "mp-eucl-s3",
              titre: "Séance 3 de cours",
              video: "https://youtu.be/yWdVgNslkug",
              support: "https://drive.google.com/file/d/1CJ8EwgteCVqN8NczvRiah-WMecsIAL1T/view?usp=sharing"
            },
            {
              id: "mp-eucl-s4",
              titre: "Séance 4 de cours",
              video: "https://youtu.be/9fDOolSob9A",
              support: "https://drive.google.com/file/d/1qYrC-fr2KjtuXp1AabjIaGTXED3PN9p9/view?usp=sharing"
            }
          ]
        },
        {
          id: "mp-polynomes",
          titre: "Polynômes & fractions",
          why: "Indispensables pour les polynômes en CPGE",
          fiche: null,
          items: [
            {
              id: "mp-poly-1",
              titre: "Centrale-Supélec Mathematics - 2021 Inégalités de Bernstein",
              enonce: "https://drive.google.com/file/d/1uoXUkzQNY1aUeLwy39AbqolqAhmv5Eie/view?usp=sharing",
              correction: "",
              video: null
            },
            {
              id: "mp-poly-2",
              titre: "Exercice 1 sur les polynômes",
              enonce: "https://drive.google.com/file/d/1AfvinK-vBBn0gvVsCCkJyFhoY8uTsBdV/view?usp=sharing",
              correction: null,
              video: "https://youtu.be/wrS32nCwmR4"
            },
            {
              id: "mp-poly-3",
              titre: "Exercice 2 sur les polynômes",
              enonce: "https://drive.google.com/file/d/19DGyzsVk8z6Te0h1BYVz94AnULLQIRZX/view?usp=sharing",
              correction: null,
              video: "https://youtu.be/QlE5DLxkcHs"
            },
            {
              id: "mp-poly-4",
              titre: "Exercice 3 sur les polynômes",
              enonce: "https://drive.google.com/file/d/1a4JP2lx1Sxlz15bh3rL94iVsHjf3Gj18/view?usp=sharing",
              correction: null,
              video: "https://youtu.be/2Cug0ds1jJw"
            }
          ],
          seances: []
        },
        {
          id: "mp-mat",
          titre: "Calcul matriciel",
          why: "Maîtriser les opérations sur les matrices, les systèmes linéaires et les inverses.",
          fiche: null,
          items: [
            {
              id: "mp-mat-1",
              titre: "Problème dans le chapitre du calcul matriciel",
              enonce: "https://drive.google.com/file/d/1_201-3ajlM3S46X50a6Ld-_2o_qPN7w5/view?usp=sharing",
              correction: null,
              video: "https://www.youtube.com/watch?v=-2LJGMON7Cw"
            },
            {
              id: "mp-mat-2",
              titre: "Exercice 1",
              enonce: "https://drive.google.com/file/d/1RECaFZG5edDfNNEckHzyJTRRt_iYy3w0/view?usp=sharing",
              correction: null,
              video: "https://youtu.be/Sp4sGLjFKz4"
            },
            {
              id: "mp-mat-3",
              titre: "Exercice 2",
              enonce: "https://drive.google.com/file/d/1RECaFZG5edDfNNEckHzyJTRRt_iYy3w0/view?usp=sharing",
              correction: null,
              video: "https://youtu.be/J7xe9-uTA9Y"
            },
            {
              id: "mp-mat-4",
              titre: "Exercice 3",
              enonce: "https://drive.google.com/file/d/1RECaFZG5edDfNNEckHzyJTRRt_iYy3w0/view?usp=sharing",
              correction: null,
              video: "https://youtu.be/wberhwdFWhc"
            },
            {
              id: "mp-mat-5",
              titre: "Exercice 4",
              enonce: "https://drive.google.com/file/d/1RECaFZG5edDfNNEckHzyJTRRt_iYy3w0/view?usp=sharing",
              correction: null,
              video: "https://youtu.be/Zrd5LJBr_DQ"
            },
            {
              id: "mp-mat-6",
              titre: "Exercice 5",
              enonce: "https://drive.google.com/file/d/1MMUbUjziq4L3H439iaa0RQvs74u9PQEg/view?usp=sharing",
              correction: null,
              video: "https://youtu.be/h9toQqA8u1o"
            },
            {
              id: "mp-mat-7",
              titre: "Exercice 6",
              enonce: "https://drive.google.com/file/d/1KFSUZAbHJV5JqZVfjDwIgORNgaKDfS6k/view?usp=sharing",
              correction: null,
              video: "https://www.youtube.com/watch?v=5nvsbjydNAE"
            }
          ],
          seances: []
        }
      ],
      livres: [
        {
          titre: "100% CONCOURS Prépas- Tous les exercices d'algèbre et de géométrie MP",
          auteur: "",
          lien: "https://drive.google.com/file/d/1euuNqpDcv_h1PfHggzBM0oOVp_27syq6/view?usp=sharing",
          cover: null
        },
        {
          titre: "100% CONCOURS Prépas- Tous les exercices d'analyse MP",
          auteur: "",
          lien: "https://drive.google.com/file/d/1qGAVRf_YtAvKQqF3rnUefchBwB15LShn/view?usp=sharing",
          cover: null
        },
        {
          titre: "Analyse pour la Licence",
          auteur: "MARIE-CÉCILE DARRACQ & JEAN-ETIENNE ROMBALDI",
          lien: "https://drive.google.com/file/d/1d3EizGMWvYkS3M4PU_fF2RrgOOGeaPvk/view?usp=sharing",
          cover: null
        },
        {
          titre: "Exercices d'algèbre et de probabilités MP/MP*",
          auteur: "David Delaunay",
          lien: "https://drive.google.com/file/d/17hG5SbNQWfBP77chZt9oFdQ-81ql4hgy/view?usp=sharing",
          cover: "https://drive.google.com/file/d/1XnvLYt8bVd6qCLcGRgo5wtToe-OejkMe/view?usp=sharing"
        },
        {
          titre: "Annales de concours MP",
          auteur: "David Denaulay",
          lien: "https://drive.google.com/file/d/1Z54eUgLv2iUoHm4IQixuIuV__MldvRRx/view?usp=sharing",
          cover: "https://drive.google.com/file/d/1-xxdWWFqvx1S_15byJbz3Pm65T12Rq7J/view?usp=sharing"
        },
        {
          titre: "Probabilité discrètes MP/MP*",
          auteur: "Jamel Jaber",
          lien: "https://drive.google.com/file/d/1gUSRREt2CF2aaCQz-PgURIWOV9UjOwN9/view?usp=sharing",
          cover: "https://drive.google.com/file/d/1q3EBxihbo2LmnVOJVZPi13PMhH2ywN6W/view?usp=sharing"
        },
        {
          titre: "Annales de concours MP",
          auteur: "JEAN-FRANÇOIS DANTZER",
          lien: "https://drive.google.com/file/d/1W7y6uo8xLnGr0sdLMYkl3i16VJ-XJHVy/view?usp=sharing",
          cover: null
        },
        {
          titre: "EXERCICES INCONTOURNABLES",
          auteur: null,
          lien: "https://drive.google.com/file/d/1V2at6I19YJSQoHoPZXFdRTkjKg7onidb/view?usp=sharing",
          cover: null
        },
        {
          titre: "Maths 2e année H-Prépa",
          auteur: null,
          lien: "https://drive.google.com/file/d/1gOseXaiWakHATfU0_OOypzYR7OSpMAGg/view?usp=sharing",
          cover: null
        },
        {
          titre: "Mathématiques en MP (cours de la MP*4 Louis-le-Grand)",
          auteur: "Omar Bennouna, Issam Tauil & M.C.",
          lien: "https://drive.google.com/file/d/1d7a2fjtJIyBZTXLteuprK-MmhwqZ3z-Q/view?usp=sharing",
          cover: null
        },
        {
          titre: "Maths Tout-en-un MPI/MPI",
          auteur: null,
          lien: "https://drive.google.com/file/d/1NkMjZjypjjprW2VALv5Mk7S5QKvtenlL/view?usp=sharing",
          cover: null
        }
      ]
    },
    {
      id: "psi",
      nom: "PSI",
      de: "PCSI",
      vers: "PSI",
      icon: "∫",
      chapitres: [
        {
          id: "psi-ev",
          titre: "Espaces vectoriels",
          why: "La réduction, chapitre central de PSI, s'appuie dessus.",
          fiche: "",
          items: [
            {
              id: "psi-ev-1",
              titre: "Structure d'espace vectoriel",
              enonce: "",
              correction: "",
              video: null
            }
          ]
        },
        { id: "psi-mat", titre: "Calcul matriciel", why: "Outil quotidien en algèbre comme en SI.", fiche: "", items: [] },
        { id: "psi-sf", titre: "Suites & fonctions", why: "Sans réflexes solides ici, les séries deviennent un mur.", fiche: "", items: [] },
        { id: "psi-int", titre: "Intégration & équations différentielles", why: "Les équations différentielles reviennent dès la rentrée.", fiche: "", items: [] },
        { id: "psi-ps", titre: "Produit scalaire", why: "Prépare les espaces préhilbertiens.", fiche: "", items: [] }
      ],
      livres: [
        {
          titre: "J'assure aux concours Maths- PSI",
          auteur: "Sylvain Gugger",
          lien: "https://drive.google.com/file/d/164lo3gixEqVzwsHfBdN0jiNRk4a5KPEg/view?usp=sharing",
          cover: "https://drive.google.com/file/d/1eZvAUPdrQeJPBZmZGzg781RgxXNA39ys/view?usp=sharing"
        }
      ]
    },
    {
      id: "tsi",
      nom: "TSI",
      de: "TSI 1",
      vers: "TSI 2",
      icon: "T",
      chapitres: [
        {
          id: "tsi-int",
          titre: "Intégration sur un segment - Intégrales généralisées",
          why: "Base de l'intégration sur un intervalle quelconque et des intégrales à paramètre.",
          fiche: "https://drive.google.com/file/d/1KHTrCFgCFXOjYtew6_2xWm6jiKSjkYdc/view?usp=sharing",
          items: [
            {
              id: "tsi-int-1",
              titre: "Sujets: Intégrale sur un segment.",
              enonce: "https://drive.google.com/file/d/15fwfeFIpGaUVsDrT8otnX2H6hjBdBrei/view?usp=sharing",
              correction: null,
              video: null
            },
            {
              id: "tsi-int-2",
              titre: "Sujets: Intégrale généralisée.",
              enonce: "https://drive.google.com/file/d/118WMHlBvjyQAClcFfyn-jjZp9v8ifl7F/view?usp=sharing",
              correction: null,
              video: null
            }
          ],
          seances: [
            {
              id: "tsi-int-s1",
              titre: "Séance 1",
              video: "https://youtu.be/CU7rXoNvIL0",
              support: "https://drive.google.com/file/d/1maeKWNDY08Zl3x4VkvHQIhNgvo9SZeWg/view?usp=sharing"
            }
          ]
        }
      ],
      livres: [
        {
          titre: "Problèmes de mathématiques TSI 1",
          auteur: "Ali Essaidi",
          lien: "https://drive.google.com/file/d/1yY4z6XyNqKhvHrEzK3IzX8QNaKkBax8c/view?usp=sharing",
          cover: null
        }
      ]
    },
    {
      id: "ecs",
      nom: "ECS",
      de: "ECS 1",
      vers: "ECS 2",
      icon: "E",
      chapitres: [
        {
          id: "ecs-alg-lin",
          titre: "Algèbre linéaire",
          why: "Base de la réduction et de l'algèbre linéaire.",
          fiche: "https://drive.google.com/file/d/14p5mq_yxJqDasYcXNCglRc016HuNNw3M/view?usp=sharing",
          items: [
            {
              id: "ecs-alg-1",
              titre: "Fiche 1 de révision d'algèbre linéaire",
              enonce: "https://drive.google.com/file/d/1Zy5WClguDAGXKTcH0gsBfDWes0twhGpL/view?usp=sharing",
              correction: [
                { label: "Exos 1-2 & 14", url: "https://drive.google.com/file/d/1mz7emSAwMvTbU_gj0J6HJZSk5ejhcveB/view?usp=sharing" },
                { label: "Exos 16 à 18", url: "https://drive.google.com/file/d/1mCPWqCNIB3Mzw2uueuAMCbdFKIO94NGc/view?usp=sharing" }
              ],
              video: null
            },
            {
              id: "ecs-alg-2",
              titre: "Exercice sur les projecteurs",
              enonce: "https://drive.google.com/file/d/1GByznR3IyXyiJuRr93vxuXiO86CkXCaX/view?usp=sharing",
              correction: "https://drive.google.com/file/d/1xodzCmuCKHOW2FcLAvF5sL2RUHxcYrmm/view?usp=sharing",
              video: null
            },
            {
              id: "ecs-alg-3",
              titre: "TD d'algèbre linéaire",
              enonce: "https://drive.google.com/file/d/1XRtbzl24BLU1NDbhLej3dWFLFoEkzQRz/view?usp=sharing",
              correction: [
                { label: "et quelques indications des exercices", url: "https://drive.google.com/file/d/1faL6pTnij4F8B2EGcVS3xuEbZeLMDazi/view?usp=sharing" },
                { label: "des exos: 14-15-19 et 21", url: "https://drive.google.com/file/d/1myVCwNtSERZ77LZM-5-ATJTaJnNOXFsT/view?usp=sharing" }
              ],
              video: null
            }
          ],
          seances: [
            {
              id: "ecs-alg-s1",
              titre: "Séance de révision 1",
              video: null,
              support: "https://drive.google.com/file/d/1c1aVxTOyaju3Rbidqb1T9jOiXvTpjrHJ/view?usp=sharing"
            },
            {
              id: "ecs-alg-s2",
              titre: "Séance de révision 2",
              video: null,
              support: "https://drive.google.com/file/d/1jpG-z4Ee_TWHmzIBubRcJ1h6s5BaojTP/view?usp=sharing"
            },
            {
              id: "ecs-alg-s3",
              titre: "Séance de révision 3",
              video: null,
              support: "https://drive.google.com/file/d/1HijO1yekpLA2IoJKlQSJs1sCpmpvP-6f/view?usp=sharing"
            },
            {
              id: "ecs-alg-s4",
              titre: "Séance de révision 4",
              support: "https://drive.google.com/file/d/1pVqBU80Qi2kaN13LQ36NM1MGQmiq2KiW/view?usp=sharing",
              video: "https://youtu.be/0Mdd_ZLeN3U"
            },
            {
              id: "ecs-alg-s5",
              titre: "Séance de révision 5",
              support: "https://drive.google.com/file/d/1KREmSCU1ocajxPEQ1zr6j6JQOnfPO7QK/view?usp=sharing",
              video: "https://youtu.be/nCY1psyB09Y"
            },
            {
              id: "ecs-alg-s6",
              titre: "Séance 6: Éléments propres des endomorphismes et des matrices carrées",
              support: "https://drive.google.com/file/d/1IgT_yzY6mWWQIEKLaO0PVbab9FEvLUFC/view?usp=sharing",
              video: null
            },
            {
              id: "ecs-alg-s7",
              titre: "Séance 7: Algèbre linéaire (Savoir utiliser le polynôme annulateur)",
              video: null,
              support: "https://drive.google.com/file/d/1mpknd1Vn-SxEp5R7l64LQ_8_Cr4XDpVi/view?usp=sharing"
            },
            {
              id: "ecs-alg-s8",
              titre: "Séance 8: Algèbre linéaire - sous espaces propres et diagonalisation",
              video: null,
              support: "https://drive.google.com/file/d/1gRcn1_8E-nsubTQk511V1ObN6SIbsB3Z/view?usp=sharing"
            },
            {
              id: "ecs-alg-s9",
              titre: "Séance 9: Algèbre linéaire - réduction des endomorphismes (diagonalisation)",
              video: null,
              support: "https://drive.google.com/file/d/1R3zbJyqtjtgHvJo2Qwh9vBmXGmSiUM6c/view?usp=sharing"
            }
          ]
        },
        {
          id: "ecs-alg-bilin",
          titre: "Algèbre bilinéaire",
          why: "Un cours complet avec la pratique de chaque partie sur des extraits de concours",
          fiche: "",
          items: [],
          seances: [
            {
              id: "ecs-bilin-s1",
              titre: "Séance 1: Algèbre bilinéaire - Produit scalaire normes et Inégalité de Cauchy-schwartz",
              video: null,
              support: "https://drive.google.com/file/d/1yaVTy-vHFVcNCvPrvDIqeUAjAUPJ6Zfa/view?usp=sharing"
            },
            {
              id: "ecs-bilin-s2",
              titre: "Séance 2: Algèbre bilinéaire - Orthogonalité",
              video: null,
              support: "https://drive.google.com/file/d/1Xn5MvoD9Q2g5Qz_zgllpkUz6CFQX12VT/view?usp=sharing"
            },
            {
              id: "ecs-bilin-s3",
              titre: "Séance 3: Algèbre bilinéaire - Orthogonalité et matrice orthogonale",
              video: null,
              support: "https://drive.google.com/file/d/112CnIb6M4wa_BlzWkLYc7v1QsoE0hrR8/view?usp=sharing"
            },
            {
              id: "ecs-bilin-s4",
              titre: "Séance 4: Algèbre bilinéaire - Orthogonalité, matrice du produit scalaire",
              video: null,
              support: "https://drive.google.com/file/d/1paNDMPClvqa4RkymeAKgyv0gkQLwE-jj/view?usp=sharing"
            },
            {
              id: "ecs-bilin-s5",
              titre: "Séance 5: Algèbre bilinéaire - Orthogonalité, projection orthogonale et distance",
              video: null,
              support: "https://drive.google.com/file/d/1E3Wxpb5ONJwEZCw2mBsDWyFRbqerjzfT/view?usp=sharing"
            },
            {
              id: "ecs-bilin-s6",
              titre: "Séance 6: Algèbre bilinéaire - Réduction des endomorphismes symétriques",
              video: null,
              support: "https://drive.google.com/file/d/1NC8DjQdB3FVgcDxo6vR0geQdlKl_iSH7/view?usp=sharing"
            }
          ]
        },
        {
          id: "ecs-mat",
          titre: "Calcul matriciel",
          why: "Maîtriser les opérations sur les matrices, les systèmes linéaires et les inverses.",
          fiche: null,
          items: [
            {
              id: "ecs-mat-ex2",
              titre: "Exercice 2: calcul matriciel",
              enonce: "https://drive.google.com/file/d/1_201-3ajlM3S46X50a6Ld-_2o_qPN7w5/view?usp=sharing",
              video: null
            },
            {
              id: "ecs-mat-1",
              titre: "Exercice 1",
              enonce: "https://drive.google.com/file/d/1RECaFZG5edDfNNEckHzyJTRRt_iYy3w0/view?usp=sharing",
              video: "https://youtu.be/Sp4sGLjFKz4"
            },
            {
              id: "ecs-mat-2",
              titre: "Exercice 2",
              enonce: "https://drive.google.com/file/d/1RECaFZG5edDfNNEckHzyJTRRt_iYy3w0/view?usp=sharing",
              video: "https://youtu.be/J7xe9-uTA9Y"
            },
            {
              id: "ecs-mat-3",
              titre: "Exercice 3",
              enonce: "https://drive.google.com/file/d/1RECaFZG5edDfNNEckHzyJTRRt_iYy3w0/view?usp=sharing",
              video: "https://youtu.be/wberhwdFWhc"
            },
            {
              id: "ecs-mat-5",
              titre: "Exercice 5",
              enonce: "https://drive.google.com/file/d/1MMUbUjziq4L3H439iaa0RQvs74u9PQEg/view?usp=sharing",
              video: "https://youtu.be/h9toQqA8u1o"
            }
          ]
        },
        {
          id: "ecs-fonct",
          titre: "Fonctions & continuité",
          why: "Prérequis de l'intégration et de l'optimisation.",
          fiche: "",
          items: []
        },
        {
          id: "ecs-proba",
          titre: "Probabilités",
          why: "Les probabilités discrètes puis continues les prolongent.",
          fiche: "https://drive.google.com/file/d/1B3zEjKJe1GjlZ0hZKjR4ASSZ0TD1yuLg/view?usp=sharing",
          items: [
            {
              id: "ecs-pr-1",
              titre: "TD 1: Probabilités sur un univers dénombrable",
              enonce: "https://drive.google.com/file/d/1csPA7_aR1XGZq-mVLbdQVsqzWMpridYD/view?usp=sharing",
              video: null
            }
          ],
          seances: [
            {
              id: "ecs-pr-s1",
              titre: "Séance 1 de probabilités",
              video: null,
              support: "https://drive.google.com/file/d/1xT2nesFcgIwO8kb2Qyanvx84Y1vFjFTW/view?usp=sharing"
            },
            {
              id: "ecs-pr-s2",
              titre: "Séance 2 de probabilités",
              video: null,
              support: "https://drive.google.com/file/d/1Mr7TLWIsE5qFpJzZHtopz2E6RKK70-Kx/view?usp=sharing"
            },
            {
              id: "ecs-pr-s3",
              titre: "Séance 3 de probabilités",
              video: null,
              support: "https://drive.google.com/file/d/1yvTlLdnXyamK5Bq4CXVxiQsO4zdaX3Ae/view?usp=sharing"
            },
            {
              id: "ecs-pr-s4",
              titre: "Séance 4 de probabilités",
              video: null,
              support: "https://drive.google.com/file/d/1aPDxajAfSwJw6LyWiBji4CEyMgxBSytk/view?usp=sharing"
            }
          ]
        },
        {
          id: "ecs-int",
          titre: "Intégration",
          why: "Indispensable aux probabilités à densité.",
          fiche: "",
          items: []
        },
        {
          id: "ecs-var",
          titre: "Les variables aléatoires réelles",
          why: "La suite des cours de probabilités et approfondissement dans le même style des concours",
          fiche: null,
          items: [],
          seances: [
            {
              id: "ecs-var-s1",
              titre: "Séance 1 de variables aléatoires: Définitions et cas pratiques",
              video: null,
              support: "https://drive.google.com/file/d/1N5AjcoqoQN9xDBaIQJPTkblJ6B-Iq0jc/view?usp=sharing"
            },
            {
              id: "ecs-var-s2",
              titre: "Séance 2 de variables aléatoires: Image et espérance d'une v.a.r",
              video: null,
              support: "https://drive.google.com/file/d/1H_T8J4AXzrs9tnSpjcFYFmPDtsRYfjgP/view?usp=sharing"
            }
          ]
        }
      ],
      livres: [
        {
          titre: "J'intégre Mathématiques approfondies 1er année - QUESTIONS ET MÉTHODES Informatique",
          auteur: "Coordonné par O. SARFATI et M. ALFRÉ",
          lien: "https://drive.google.com/file/d/1GgSwETxHjZPEXwiT_gkiebFtqfp-s5Rk/view?usp=sharing",
          cover: null
        },
        {
          titre: "J'intégre Mathématiques approfondies 2e année - QUESTIONS ET MÉTHODES Informatique",
          auteur: "Coordonné par Olivier Sarfati",
          lien: "https://drive.google.com/file/d/16fYVpH660ljua4A9mmEu1-LDpEUqcZLA/view?usp=sharing",
          cover: null
        },
        {
          titre: "Mathématiques Cours et exercices ECS 2e année",
          auteur: "Cécile Lardon & Jean-Marie Monier",
          lien: "https://drive.google.com/file/d/1IiGNSp_GY-OTq_S5RHcsw_Jb5ttdtH9i/view?usp=sharing",
          cover: "https://drive.google.com/file/d/1bJaESVMI77emwKUqVWZzIItk_T9G8rdb/view?usp=sharing"
        },
        {
          titre: "Mathématiques Méthodes et exercices ECS 2e année",
          auteur: "Cécile Lardon & Jean-Marie Monier",
          lien: "https://drive.google.com/file/d/1zQ4gHg9Fm0s9VqYHF-bBQvf6HF4PTw6J/view?usp=sharing",
          cover: "https://drive.google.com/file/d/1zQ4gHg9Fm0s9VqYHF-bBQvf6HF4PTw6J/view?usp=sharing"
        },
        {
          titre: "Mathématiques Méthodes et exercices ECS 2e année",
          auteur: "Cécile Lardon & Jean-Marie Monier",
          lien: "https://drive.google.com/file/d/11xkX65wbkRqHkdcqi9QRELygYhRgMDFT/view?usp=sharing",
          cover: "https://drive.google.com/file/d/1jLdbzPqh2y5cpJYLd3Tbos9IuIMyvUTr/view?usp=sharing"
        }
      ]
    },
    {
      id: "ect",
      nom: "ECT",
      de: "ECT 1",
      vers: "ECT 2",
      icon: "€",
      chapitres: [
        { id: "ect-mat", titre: "Matrices & déterminants", why: "L'aisance calculatoire conditionne toute l'analyse.", fiche: "", items: [] },
        { id: "ect-suites", titre: "Suites numériques", why: "Base des modèles financiers et des séries.", fiche: "", items: [] },
        { id: "ect-alg", titre: "Algèbre linéaire", why: "Ouvre le calcul matriciel appliqué.", fiche: "", items: [] },
        { id: "ect-proba", titre: "Probabilités", why: "Fondations des probabilités appliquées.", fiche: "", items: [] },
        { id: "ect-stat", titre: "Statistiques", why: "Prérequis de la statistique inférentielle.", fiche: "", items: [] }
      ],
      livres: [
        { titre: "Cours complet de mathématiques ECT", auteur: "", lien: "", cover: null },
        { titre: "Exercices & problèmes corrigés", auteur: "", lien: "", cover: null },
        { titre: "Annales de concours ECT", auteur: "", lien: "", cover: null }
      ]
    }
  ],
  plan: [
    {
      semaine: "Semaines 1–2",
      titre: "Décompresser… puis diagnostiquer",
      desc: "Reposez-vous d'abord. Puis relisez vos DS : listez les chapitres où vous avez perdu des points."
    },
    {
      semaine: "Semaines 3–4",
      titre: "Consolider chapitre par chapitre",
      desc: "Dépliez les chapitres de votre filière et travaillez leurs fiches. Objectif : refaire les classiques."
    },
    {
      semaine: "Semaines 5–6",
      titre: "Automatiser le calcul",
      desc: "20 à 30 minutes par jour de calcul pur. La vitesse est le premier facteur discriminant."
    },
    {
      semaine: "Semaines 7–8",
      titre: "S'ouvrir sur le programme de Spé",
      desc: "Parcourez le premier chapitre de 2ᵉ année sans chercher à tout maîtriser."
    }
  ]
};
