-- Migration: Centralized CPGE Courses and Passerelle Management
-- Eliminates dependency on WordPress/Elementor scraping and allows full management via /management and Supabase

-- 1. Create tables
create table if not exists public.cpge_courses (
  id uuid primary key default gen_random_uuid(),
  year_id text not null check (year_id in ('annee1', 'annee2')),
  branch_id text not null,
  branch_nom text not null,
  branch_label text not null,
  badge text,
  icon text default '∑',
  chapitres jsonb not null default '[]'::jsonb,
  livres jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cpge_courses_year_branch_key unique(year_id, branch_id)
);

create table if not exists public.passerelle_filieres (
  id text primary key,
  nom text not null,
  de text not null,
  vers text not null,
  icon text default '∑',
  chapitres jsonb not null default '[]'::jsonb,
  livres jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Indexes
create index if not exists cpge_courses_year_idx on public.cpge_courses(year_id, position);
create index if not exists passerelle_filieres_pos_idx on public.passerelle_filieres(position);

-- 3. Triggers for updated_at
drop trigger if exists cpge_courses_updated_at on public.cpge_courses;
create trigger cpge_courses_updated_at before update on public.cpge_courses for each row execute procedure public.set_updated_at();

drop trigger if exists passerelle_filieres_updated_at on public.passerelle_filieres;
create trigger passerelle_filieres_updated_at before update on public.passerelle_filieres for each row execute procedure public.set_updated_at();

-- 4. Enable Row Level Security (RLS)
alter table public.cpge_courses enable row level security;
alter table public.passerelle_filieres enable row level security;

-- Policies for cpge_courses
drop policy if exists cpge_courses_select_policy on public.cpge_courses;
create policy cpge_courses_select_policy on public.cpge_courses
  for select to anon, authenticated, service_role using (true);

drop policy if exists cpge_courses_write_policy on public.cpge_courses;
create policy cpge_courses_write_policy on public.cpge_courses
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Policies for passerelle_filieres
drop policy if exists passerelle_filieres_select_policy on public.passerelle_filieres;
create policy passerelle_filieres_select_policy on public.passerelle_filieres
  for select to anon, authenticated, service_role using (true);

drop policy if exists passerelle_filieres_write_policy on public.passerelle_filieres;
create policy passerelle_filieres_write_policy on public.passerelle_filieres
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- 5. RPC Functions
create or replace function public.get_cpge_curriculum()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_annee1 jsonb;
  v_annee2 jsonb;
begin
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', branch_id,
      'nom', branch_nom,
      'label', branch_label,
      'badge', badge,
      'icon', icon,
      'chapitres', chapitres,
      'livres', livres
    ) order by position, branch_nom
  ), '[]'::jsonb)
  into v_annee1
  from public.cpge_courses
  where year_id = 'annee1';

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', branch_id,
      'nom', branch_nom,
      'label', branch_label,
      'badge', badge,
      'icon', icon,
      'chapitres', chapitres,
      'livres', livres
    ) order by position, branch_nom
  ), '[]'::jsonb)
  into v_annee2
  from public.cpge_courses
  where year_id = 'annee2';

  return jsonb_build_object(
    'annee1', jsonb_build_object(
      'id', 'annee-1',
      'titre', '1ère Année Classes Préparatoires (Sup)',
      'description', 'Programme officiel de première année pour consolider vos bases et acquérir les méthodes mathématiques rigoureuses.',
      'branches', v_annee1
    ),
    'annee2', jsonb_build_object(
      'id', 'annee-2',
      'titre', '2ème Année Classes Préparatoires (Spé)',
      'description', 'Préparation intensive aux épreuves écrites et orales des concours d''excellence (CNC, Mines-Ponts, Centrale, CCINP, BCE/Ecricome).',
      'branches', v_annee2
    )
  );
end;
$$;

create or replace function public.save_cpge_branch(p_year_id text, p_branch_id text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'Accès réservé aux professeurs/administrateurs';
  end if;

  insert into public.cpge_courses (
    year_id,
    branch_id,
    branch_nom,
    branch_label,
    badge,
    icon,
    chapitres,
    livres,
    position
  )
  values (
    p_year_id,
    p_branch_id,
    coalesce(p_payload->>'nom', upper(p_branch_id)),
    coalesce(p_payload->>'label', coalesce(p_payload->>'nom', upper(p_branch_id))),
    p_payload->>'badge',
    coalesce(p_payload->>'icon', '∑'),
    coalesce(p_payload->'chapitres', '[]'::jsonb),
    coalesce(p_payload->'livres', '[]'::jsonb),
    coalesce((p_payload->>'position')::integer, 0)
  )
  on conflict (year_id, branch_id) do update set
    branch_nom = coalesce(excluded.branch_nom, cpge_courses.branch_nom),
    branch_label = coalesce(excluded.branch_label, cpge_courses.branch_label),
    badge = excluded.badge,
    icon = coalesce(excluded.icon, cpge_courses.icon),
    chapitres = excluded.chapitres,
    livres = excluded.livres,
    position = coalesce(excluded.position, cpge_courses.position),
    updated_at = now();

  return public.get_cpge_curriculum();
end;
$$;

create or replace function public.delete_cpge_branch(p_year_id text, p_branch_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'Accès réservé aux professeurs/administrateurs';
  end if;

  delete from public.cpge_courses
  where year_id = p_year_id and branch_id = p_branch_id;

  return public.get_cpge_curriculum();
end;
$$;

create or replace function public.get_passerelle_data()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_filieres jsonb;
begin
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'nom', nom,
      'de', de,
      'vers', vers,
      'icon', icon,
      'chapitres', chapitres,
      'livres', livres
    ) order by position, nom
  ), '[]'::jsonb)
  into v_filieres
  from public.passerelle_filieres;

  return jsonb_build_object(
    'id', 'passerelle-sup-spe',
    'titre', 'La Passerelle Sup → Spé',
    'eyebrow', 'Accompagnement Mathématiques',
    'description', 'Tout ce qu''il faut maîtriser pour réussir votre rentrée en deuxième année de CPGE.',
    'filieres', v_filieres
  );
end;
$$;

create or replace function public.save_passerelle_filiere(p_id text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'Accès réservé aux professeurs/administrateurs';
  end if;

  insert into public.passerelle_filieres (
    id,
    nom,
    de,
    vers,
    icon,
    chapitres,
    livres,
    position
  )
  values (
    p_id,
    coalesce(p_payload->>'nom', upper(p_id)),
    coalesce(p_payload->>'de', upper(p_id)),
    coalesce(p_payload->>'vers', upper(p_id)),
    coalesce(p_payload->>'icon', '∑'),
    coalesce(p_payload->'chapitres', '[]'::jsonb),
    coalesce(p_payload->'livres', '[]'::jsonb),
    coalesce((p_payload->>'position')::integer, 0)
  )
  on conflict (id) do update set
    nom = coalesce(excluded.nom, passerelle_filieres.nom),
    de = coalesce(excluded.de, passerelle_filieres.de),
    vers = coalesce(excluded.vers, passerelle_filieres.vers),
    icon = coalesce(excluded.icon, passerelle_filieres.icon),
    chapitres = excluded.chapitres,
    livres = excluded.livres,
    position = coalesce(excluded.position, passerelle_filieres.position),
    updated_at = now();

  return public.get_passerelle_data();
end;
$$;

create or replace function public.delete_passerelle_filiere(p_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'Accès réservé aux professeurs/administrateurs';
  end if;

  delete from public.passerelle_filieres
  where id = p_id;

  return public.get_passerelle_data();
end;
$$;

-- 6. Permissions
grant execute on function public.get_cpge_curriculum() to anon, authenticated, service_role;
grant execute on function public.save_cpge_branch(text, text, jsonb) to authenticated, service_role;
grant execute on function public.delete_cpge_branch(text, text) to authenticated, service_role;
grant execute on function public.get_passerelle_data() to anon, authenticated, service_role;
grant execute on function public.save_passerelle_filiere(text, jsonb) to authenticated, service_role;
grant execute on function public.delete_passerelle_filiere(text) to authenticated, service_role;

-- 7. SEED INITIAL DATA

insert into public.cpge_courses (year_id, branch_id, branch_nom, branch_label, badge, icon, chapitres, livres, position)
values ('annee1', 'tsi1', 'TSI 1', 'Filière TSI 1ère Année', 'Technologique', 'T', '[{"id":"1","n":"1","titre":"Logique et Raisonnement","cat":"algebre","description":"Quantificateurs, connecteurs logiques, raisonnement par l''absurde, contraposée, et récurrence.","pdf":"","exo":"","corr":"","video_id":"","video_duration":"45 min","qcm_id":null},{"id":"2","n":"2","titre":"Calcul Numérique et Arithmétique","cat":"algebre","description":"Sommes, produits, factorielles, formule du binôme de Newton, division euclidienne et PGCD.","pdf":"","exo":"","corr":"","video_id":"","video_duration":"50 min","qcm_id":null},{"id":"3","n":"3","titre":"Polynômes et Fractions Rationnelles","cat":"algebre","description":"Degré, racines, factorisation, division euclidienne des polynômes et décomposition en éléments simples.","pdf":"","exo":"","corr":"","video_id":"","video_duration":"1h 10 min","qcm_id":null},{"id":"4","n":"4","titre":"Matrices et Systèmes Linéaires","cat":"algebre","description":"Opérations matricielles, déterminants, inverse d''une matrice et résolution par la méthode du pivot de Gauss.","pdf":"","exo":"","corr":"","video_id":"","video_duration":"1h 25 min","qcm_id":null},{"id":"5","n":"5","titre":"Suites Numériques","cat":"analyse","description":"Convergence, suites arithmétiques/géométriques, suites arithmético-géométriques, théorème des gendarmes et suites adjacentes.","pdf":"","exo":"","corr":"","video_id":"","video_duration":"1h 05 min","qcm_id":null},{"id":"6","n":"6","titre":"Fonctions — Limites et Continuité","cat":"analyse","description":"Calcul de limites, formes indéterminées, équivalents usuels, continuité, et théorème des valeurs intermédiaires (TVI).","pdf":"","exo":"","corr":"","video_id":"","video_duration":"1h 15 min","qcm_id":null},{"id":"7","n":"7","titre":"Dérivation","cat":"analyse","description":"Nombre dérivé, règles de dérivation, formule de Leibniz, dérivées successives et théorème de Rolle / accroissements finis.","pdf":"","exo":"","corr":"","video_id":"","video_duration":"55 min","qcm_id":null},{"id":"8","n":"8","titre":"Intégration","cat":"analyse","description":"Primitives usuelles, intégration par parties, changement de variable, et calcul d''aires / sommes de Riemann.","pdf":"","exo":"","corr":"","video_id":"","video_duration":"1h 30 min","qcm_id":null},{"id":"9","n":"9","titre":"Équations Différentielles","cat":"analyse","description":"Équations linéaires du premier et second ordre à coefficients constants, solution homogène et solution particulière.","pdf":"","exo":"","corr":"","video_id":"","video_duration":"1h 10 min","qcm_id":null},{"id":"10","n":"10","titre":"Dénombrement","cat":"probabilites","description":"Arrangements, combinaisons, permutations, p-listes, principe d''inclusion-exclusion et problèmes de tirages.","pdf":"","exo":"","corr":"","video_id":"","video_duration":"45 min","qcm_id":null},{"id":"11","n":"11","titre":"Probabilités","cat":"probabilites","description":"Espaces probabilisés, probabilités conditionnelles, formule des probabilités totales et formule de Bayes.","pdf":"","exo":"","corr":"","video_id":"","video_duration":"1h 00 min","qcm_id":null},{"id":"12","n":"12","titre":"Variables Aléatoires","cat":"probabilites","description":"Loi de probabilité, espérance, variance, lois discrètes usuelles (Uniforme, Bernoulli, Binomiale, Géométrique, Poisson).","pdf":"","exo":"","corr":"","video_id":"","video_duration":"1h 15 min","qcm_id":null},{"id":"13","n":"13","titre":"Géométrie Plane et Vectorielle","cat":"geometrie","description":"Produit scalaire, produit vectoriel, déterminant dans le plan et l''espace, repérage et équations cartésiennes.","pdf":"","exo":"","corr":"","video_id":"","video_duration":"50 min","qcm_id":null},{"id":"14","n":"14","titre":"Nombres Complexes et Géométrie","cat":"geometrie","description":"Forme algébrique, trigonométrique et exponentielle, racines n-ièmes, transformations géométriques du plan.","pdf":"","exo":"","corr":"","video_id":"","video_duration":"1h 20 min","qcm_id":null}]'::jsonb, '[]'::jsonb, 0)
on conflict (year_id, branch_id) do update set
  branch_nom = excluded.branch_nom,
  branch_label = excluded.branch_label,
  badge = excluded.badge,
  icon = excluded.icon,
  chapitres = excluded.chapitres,
  livres = excluded.livres,
  position = excluded.position;

insert into public.cpge_courses (year_id, branch_id, branch_nom, branch_label, badge, icon, chapitres, livres, position)
values ('annee1', 'mpsi', 'MPSI', 'Maths, Physique & Sciences de l''Ingénieur', 'Théorique & Fondamental', '∑', '[{"id":"mpsi-1","n":1,"titre":"Vocabulaire ensembliste, Logique & Raisonnements","cat":"algebre","badge":"Fondations","description":"Quantificateurs, récurrences fortes, relations d''équivalence et applications injectives/surjectives.","fiche_url":"https://drive.google.com/file/d/14p5mq_yxJqDasYcXNCglRc016HuNNw3M/view?usp=sharing","enonce_url":"https://drive.google.com/file/d/1Zy5WClguDAGXKTcH0gsBfDWes0twhGpL/view?usp=sharing","correction_url":"https://drive.google.com/file/d/1mz7emSAwMvTbU_gj0J6HJZSk5ejhcveB/view?usp=sharing","video_url":"https://www.youtube.com/watch?v=rawCPGARZ04","video_duration":"45 min"},{"id":"mpsi-2","n":2,"titre":"Nombres complexes & Trigonométrie","cat":"algebre","badge":"Algèbre","description":"Formules d''Euler et de Moivre, racines n-ièmes de l''unité, géométrie euclidienne plane et similitudes.","fiche_url":"https://drive.google.com/file/d/1OuO-2h5nZwik2nktS8pcwZEkNPhLsRKT/view?usp=sharing","enonce_url":"https://drive.google.com/file/d/1E6Kb4Lpm6OHaV2szdY04gKvVmA32pWg5/view?usp=sharing","correction_url":"https://drive.google.com/file/d/13RN-WPd1YMvbg6TWL4D8-wXht02Iar3b/view?usp=sharing","video_url":"https://youtu.be/8EXSXe7i_KQ","video_duration":"38 min"},{"id":"mpsi-3","n":3,"titre":"Polynômes à une indéterminée & Fractions rationnelles","cat":"algebre","badge":"Algèbre","description":"Division euclidienne, racines et multiplicité, relations coefficients-racines, décomposition en éléments simples.","fiche_url":null,"enonce_url":"https://drive.google.com/file/d/1uoXUkzQNY1aUeLwy39AbqolqAhmv5Eie/view?usp=sharing","correction_url":"https://drive.google.com/file/d/1AfvinK-vBBn0gvVsCCkJyFhoY8uTsBdV/view?usp=sharing","video_url":"https://youtu.be/wrS32nCwmR4","video_duration":"52 min"},{"id":"mpsi-4","n":4,"titre":"Espaces vectoriels & Applications linéaires","cat":"algebre","badge":"Pilier Sup","description":"Sous-espaces vectoriels, sommes directes, théorème du rang, bases et dimension finie.","fiche_url":"https://drive.google.com/file/d/14p5mq_yxJqDasYcXNCglRc016HuNNw3M/view?usp=sharing","enonce_url":"https://drive.google.com/file/d/1Zy5WClguDAGXKTcH0gsBfDWes0twhGpL/view?usp=sharing","correction_url":"https://drive.google.com/file/d/1mCPWqCNIB3Mzw2uueuAMCbdFKIO94NGc/view?usp=sharing","video_url":"https://drive.google.com/file/d/1CD93AzmoWJgJvGjVp2AsIBmP8Iyb3j4Q/view?usp=sharing","video_duration":"65 min"},{"id":"mpsi-5","n":5,"titre":"Calcul matriciel & Systèmes linéaires","cat":"algebre","badge":"Calcul","description":"Matrices d''applications linéaires, changement de base, inversibilité et algorithme du pivot de Gauss.","fiche_url":null,"enonce_url":"https://drive.google.com/file/d/1_201-3ajlM3S46X50a6Ld-_2o_qPN7w5/view?usp=sharing","correction_url":"https://drive.google.com/file/d/1RECaFZG5edDfNNEckHzyJTRRt_iYy3w0/view?usp=sharing","video_url":"https://www.youtube.com/watch?v=-2LJGMON7Cw","video_duration":"40 min"},{"id":"mpsi-6","n":6,"titre":"Déterminants & Formes multilinéaires","cat":"algebre","badge":"Algèbre","description":"Propriétés du déterminant, comatrice, calculs par blocs et déterminants classiques (Vandermonde, circulantes).","fiche_url":"https://drive.google.com/file/d/1OuO-2h5nZwik2nktS8pcwZEkNPhLsRKT/view?usp=sharing","enonce_url":"https://drive.google.com/file/d/1E6Kb4Lpm6OHaV2szdY04gKvVmA32pWg5/view?usp=sharing","correction_url":"https://drive.google.com/file/d/13RN-WPd1YMvbg6TWL4D8-wXht02Iar3b/view?usp=sharing","video_url":"https://youtu.be/8EXSXe7i_KQ","video_duration":"48 min"},{"id":"mpsi-7","n":7,"titre":"Suites réelles & complexes","cat":"analyse","badge":"Analyse","description":"Théorèmes de convergence monotone, suites adjacentes, théorème de Bolzano-Weierstrass et suites récurrentes.","fiche_url":"https://drive.google.com/file/d/1qSDn8RmZD0wneRHG8aOWGCkq_sqWErsT/view?usp=sharing","enonce_url":"https://drive.google.com/file/d/1n1zUz9wwZvOP1kzMp87ptg7Ir_Ha5zcT/view?usp=sharing","correction_url":"https://drive.google.com/file/d/1GLWuEzAi5ZVX8e_vVYfKFidv2TA7Vnfn/view?usp=sharing","video_url":"https://youtu.be/v2JkFvxiiFg","video_duration":"50 min"},{"id":"mpsi-8","n":8,"titre":"Limites, Continuité & Fonctions réelles","cat":"analyse","badge":"Analyse","description":"Théorème des valeurs intermédiaires, théorème des bornes atteintes, continuité uniforme et homéomorphismes.","fiche_url":null,"enonce_url":"https://drive.google.com/file/d/1A9AYWRPgKhj1c-fp1VWJuipRlHRpaANm/view?usp=sharing","correction_url":"https://drive.google.com/file/d/1kPL2Oe8aZTLwPkssKJOMGRxWfy2wGS8h/view?usp=sharing","video_url":"https://youtu.be/rawCPGARZ04","video_duration":"42 min"},{"id":"mpsi-9","n":9,"titre":"Intégration sur un segment & Formules de Taylor","cat":"analyse","badge":"Pilier Analyse","description":"Intégrale de Riemann, sommes de Riemann, intégration par parties, changements de variable et inégalité de Taylor-Lagrange.","fiche_url":"https://drive.google.com/file/d/1KHTrCFgCFXOjYtew6_2xWm6jiKSjkYdc/view?usp=sharing","enonce_url":"https://drive.google.com/file/d/1HjTf9KEc5jAiFkbRpNkFNJmkzxdLg92e/view?usp=sharing","correction_url":"https://drive.google.com/file/d/1uIbE36LoFvYh7zyi9m5U3W2fBWEDPM92/view?usp=sharing","video_url":"https://youtu.be/VNkWUwhJT2g","video_duration":"55 min"},{"id":"mpsi-10","n":10,"titre":"Probabilités sur un univers fini","cat":"proba","badge":"Probabilités","description":"Espaces probabilisés finis, conditionnement, formule des probabilités totales, formule de Bayes et variables aléatoires.","fiche_url":"https://drive.google.com/file/d/1B3zEjKJe1GjlZ0hZKjR4ASSZ0TD1yuLg/view?usp=sharing","enonce_url":"https://drive.google.com/file/d/1QLm_IpukDR3ukj95ys5-sz63Pw9-Ovbs/view?usp=sharing","correction_url":"https://drive.google.com/file/d/1csPA7_aR1XGZq-mVLbdQVsqzWMpridYD/view?usp=sharing","video_url":null,"video_duration":null}]'::jsonb, '[]'::jsonb, 1)
on conflict (year_id, branch_id) do update set
  branch_nom = excluded.branch_nom,
  branch_label = excluded.branch_label,
  badge = excluded.badge,
  icon = excluded.icon,
  chapitres = excluded.chapitres,
  livres = excluded.livres,
  position = excluded.position;

insert into public.cpge_courses (year_id, branch_id, branch_nom, branch_label, badge, icon, chapitres, livres, position)
values ('annee1', 'pcsi', 'PCSI', 'Physique, Chimie & Sciences de l''Ingénieur', 'Sciences Appliquées', '∫', '[{"id":"pcsi-1","n":1,"titre":"Espaces vectoriels & Algèbre linéaire","cat":"algebre","badge":"Algèbre","description":"Structure vectorielle, sous-espaces, bases et calculs des dimensions en PCSI.","fiche_url":"https://drive.google.com/file/d/14p5mq_yxJqDasYcXNCglRc016HuNNw3M/view?usp=sharing","enonce_url":"https://drive.google.com/file/d/1Zy5WClguDAGXKTcH0gsBfDWes0twhGpL/view?usp=sharing","correction_url":"https://drive.google.com/file/d/1mz7emSAwMvTbU_gj0J6HJZSk5ejhcveB/view?usp=sharing","video_url":null,"video_duration":null},{"id":"pcsi-2","n":2,"titre":"Calcul matriciel & Systèmes linéaires","cat":"algebre","badge":"Algèbre","description":"Matrices, déterminants d''ordre 2 et 3, inversions et résolution des circuits et systèmes couplés.","fiche_url":null,"enonce_url":"https://drive.google.com/file/d/1_201-3ajlM3S46X50a6Ld-_2o_qPN7w5/view?usp=sharing","correction_url":null,"video_url":"https://youtu.be/Sp4sGLjFKz4","video_duration":"30 min"},{"id":"pcsi-3","n":3,"titre":"Intégration & Équations différentielles","cat":"analyse","badge":"Analyse","description":"Équations linéaires d''ordre 1 et 2 à coefficients constants avec second membre physique.","fiche_url":"https://drive.google.com/file/d/1KHTrCFgCFXOjYtew6_2xWm6jiKSjkYdc/view?usp=sharing","enonce_url":"https://drive.google.com/file/d/1HjTf9KEc5jAiFkbRpNkFNJmkzxdLg92e/view?usp=sharing","correction_url":null,"video_url":"https://youtu.be/VNkWUwhJT2g","video_duration":"45 min"},{"id":"pcsi-4","n":4,"titre":"Produit scalaire & Espaces euclidiens","cat":"algebre","badge":"Géométrie","description":"Inégalité de Cauchy-Schwarz, orthogonalité, projection orthogonale et distance.","fiche_url":"https://drive.google.com/file/d/1bRrvkojc9E-MZiYS35LArTJi44bln8Zy/view?usp=sharing","enonce_url":"https://drive.google.com/file/d/1y2rzX5UjsgidvbRc_2UWSvsljljpV83X/view?usp=sharing","correction_url":null,"video_url":"https://youtu.be/1FsyIs3b584","video_duration":"40 min"}]'::jsonb, '[]'::jsonb, 2)
on conflict (year_id, branch_id) do update set
  branch_nom = excluded.branch_nom,
  branch_label = excluded.branch_label,
  badge = excluded.badge,
  icon = excluded.icon,
  chapitres = excluded.chapitres,
  livres = excluded.livres,
  position = excluded.position;

insert into public.cpge_courses (year_id, branch_id, branch_nom, branch_label, badge, icon, chapitres, livres, position)
values ('annee1', 'ecs1', 'ECS 1', 'Économique & Commerciale Option Scientifique (1ère Année)', 'Économique & Maths', 'E', '[{"id":"ecs1-1","n":1,"titre":"Algèbre linéaire & Calcul matriciel","cat":"algebre","badge":"Algèbre","description":"Opérations matricielles, puissances de matrices, inversion et projecteurs.","fiche_url":"https://drive.google.com/file/d/14p5mq_yxJqDasYcXNCglRc016HuNNw3M/view?usp=sharing","enonce_url":"https://drive.google.com/file/d/1Zy5WClguDAGXKTcH0gsBfDWes0twhGpL/view?usp=sharing","correction_url":"https://drive.google.com/file/d/1mz7emSAwMvTbU_gj0J6HJZSk5ejhcveB/view?usp=sharing","video_url":"https://youtu.be/0Mdd_ZLeN3U","video_duration":"55 min"},{"id":"ecs1-2","n":2,"titre":"Suites numériques & Modèles de croissance","cat":"analyse","badge":"Analyse","description":"Comportement asymptotique, suites arithmético-géométriques et récurrences d''ordre 2.","fiche_url":"https://drive.google.com/file/d/1qSDn8RmZD0wneRHG8aOWGCkq_sqWErsT/view?usp=sharing","enonce_url":"https://drive.google.com/file/d/1n1zUz9wwZvOP1kzMp87ptg7Ir_Ha5zcT/view?usp=sharing","correction_url":"https://drive.google.com/file/d/1GLWuEzAi5ZVX8e_vVYfKFidv2TA7Vnfn/view?usp=sharing","video_url":null,"video_duration":null},{"id":"ecs1-3","n":3,"titre":"Probabilités discrètes & Dénombrement","cat":"proba","badge":"Probabilités","description":"Variables aléatoires finies, lois usuelles (Bernoulli, Binomiale, Uniforme) et espérance mathématique.","fiche_url":"https://drive.google.com/file/d/1B3zEjKJe1GjlZ0hZKjR4ASSZ0TD1yuLg/view?usp=sharing","enonce_url":"https://drive.google.com/file/d/1csPA7_aR1XGZq-mVLbdQVsqzWMpridYD/view?usp=sharing","correction_url":null,"video_url":null,"video_duration":null}]'::jsonb, '[]'::jsonb, 3)
on conflict (year_id, branch_id) do update set
  branch_nom = excluded.branch_nom,
  branch_label = excluded.branch_label,
  badge = excluded.badge,
  icon = excluded.icon,
  chapitres = excluded.chapitres,
  livres = excluded.livres,
  position = excluded.position;

insert into public.cpge_courses (year_id, branch_id, branch_nom, branch_label, badge, icon, chapitres, livres, position)
values ('annee1', 'ect1', 'ECT 1', 'Économique & Commerciale Option Technologique (1ère Année)', 'Management & Maths', '€', '[{"id":"ect1-1","n":1,"titre":"Calcul matriciel & Déterminants","cat":"algebre","badge":"Algèbre","description":"Multiplication matricielle, calcul de l''inverse et systèmes d''équations économiques.","fiche_url":"","enonce_url":"","correction_url":null,"video_url":null,"video_duration":null},{"id":"ect1-2","n":2,"titre":"Suites & Fonctions d''une variable","cat":"analyse","badge":"Analyse","description":"Étude des fonctions usuelles, dérivées et optimisation d''une fonction de coût/profit.","fiche_url":"","enonce_url":"","correction_url":null,"video_url":null,"video_duration":null},{"id":"ect1-3","n":3,"titre":"Probabilités & Statistiques descriptives","cat":"proba","badge":"Probabilités","description":"Moyenne, variance, médiane, diagrammes et calculs élémentaires de probabilités.","fiche_url":"","enonce_url":"","correction_url":null,"video_url":null,"video_duration":null}]'::jsonb, '[]'::jsonb, 4)
on conflict (year_id, branch_id) do update set
  branch_nom = excluded.branch_nom,
  branch_label = excluded.branch_label,
  badge = excluded.badge,
  icon = excluded.icon,
  chapitres = excluded.chapitres,
  livres = excluded.livres,
  position = excluded.position;

insert into public.cpge_courses (year_id, branch_id, branch_nom, branch_label, badge, icon, chapitres, livres, position)
values ('annee2', 'mp', 'MP', 'Maths-Physique (MP / MP*)', 'Concours CNC / X-Mines-Centrale', '∑', '[{"id":"mp-1","n":1,"titre":"Structures algébriques","cat":"algebre","badge":"Algèbre","description":"Groupes, idéaux, anneaux, corps, morphismes, algèbres.","cours":[{"t":"Cours complet","sous":"Théorie & démonstrations","u":""}],"fiches":[{"t":"Fiche de résumé","sous":"L''essentiel du chapitre","u":"https://drive.google.com/file/d/1ag-3r3rBJ-RQsaQG2ARxz_-LbYMgkE2P/view?usp=sharing"}],"tds":[{"t":"TD 1","sous":"Exercices d''application","exo":"","corr":""}],"fiche_url":"https://drive.google.com/file/d/1ag-3r3rBJ-RQsaQG2ARxz_-LbYMgkE2P/view?usp=sharing"},{"id":"mp-2","n":2,"titre":"Compléments d''algèbre linéaire","cat":"algebre","badge":"Algèbre","description":"Sommes directes, matrices par blocs, trace, hyperplans.","cours":[{"t":"Cours complet","sous":"Théorie & démonstrations","u":""}],"fiches":[{"t":"Fiche de résumé","sous":"L''essentiel du chapitre","u":""}],"tds":[{"t":"TD 1","sous":"Exercices d''application","exo":"","corr":""}]},{"id":"mp-3","n":3,"titre":"Réduction des endomorphismes","cat":"algebre","badge":"Pilier Concours","description":"Valeurs propres, polynômes annulateurs, diagonalisation, trigonalisation.","cours":[{"t":"Cours complet","sous":"Théorie & démonstrations","u":""}],"fiches":[{"t":"Fiche de résumé","sous":"L''essentiel du chapitre","u":""}],"tds":[{"t":"TD 1","sous":"Exercices d''application","exo":"","corr":""}]},{"id":"mp-4","n":4,"titre":"Topologie des espaces normés","cat":"analyse","badge":"Topologie","description":"Ouverts, fermés, compacité, connexité par arcs, normes équivalentes.","cours":[{"t":"Séance 1 (Normes & EVN)","sous":"Théorie & démonstrations","u":"https://drive.google.com/file/d/1D8aUxMGf--TRuYYQJHgmVxCAb4aoO4K0/view?usp=sharing","v":"https://youtu.be/gt-dz_nBt68"},{"t":"Séance 2 (Normes équivalentes & distance)","sous":"Théorie & démonstrations","u":"https://drive.google.com/file/d/1NLmS20uOR1O2GQ-vf1nwSBQMtXVWw3TB/view?usp=sharing","v":"https://youtu.be/-iyPBLNn648"},{"t":"Séance 3 (Parties bornées, boules & suites)","sous":"Théorie & applications interactives","u":"https://drive.google.com/file/d/15rr5lsKXhRcSi6kIEgeYFw3e2jJpViFF/view?usp=sharing","v":"https://youtu.be/yhKyDz4ofJY"}],"fiches":[{"t":"Fiche de résumé","sous":"L''essentiel du cours","u":"https://drive.google.com/file/d/1j9CaHOXMAhP4SyiaYWekTL1EMr_H7wsg/view?usp=sharing"},{"t":"Fiche de cours synthétique","sous":"Formules & propriétés clés","u":"https://drive.google.com/file/d/1RyF9URY3FICkHlLaQxATOkC3KRhi8Mtw/view?usp=sharing"},{"t":"Fiche de cours complet","sous":"Cours complet détaillé","u":"https://drive.google.com/file/d/1wrkLjq1-B7d4eMWNQuiENE1virfy1XQN/view?usp=sharing"}],"tds":[{"t":"TD 1","sous":"Exercices d''application","exo":"","corr":""}],"videos":[{"t":"Séance interactive — Les normes","sous":"Replay · Séance live","y":"https://youtu.be/gt-dz_nBt68"}],"fiche_url":"https://drive.google.com/file/d/1j9CaHOXMAhP4SyiaYWekTL1EMr_H7wsg/view?usp=sharing","video_url":"https://youtu.be/gt-dz_nBt68"},{"id":"mp-5","n":5,"titre":"Séries numériques","cat":"analyse","badge":"Analyse","description":"Convergence, règles de comparaison, séries alternées, sommation.","cours":[{"t":"Cours complet","sous":"Théorie & démonstrations","u":""}],"fiches":[{"t":"Fiche de résumé","sous":"L''essentiel du chapitre","u":""}],"tds":[{"t":"TD 1","sous":"Exercices d''application","exo":"","corr":""}]},{"id":"mp-6","n":6,"titre":"Familles sommables","cat":"analyse","badge":"Analyse","description":"Sommabilité, Fubini discret, produit de Cauchy.","cours":[{"t":"Cours complet","sous":"Théorie & démonstrations","u":""}],"fiches":[{"t":"Fiche de résumé","sous":"L''essentiel du chapitre","u":""}],"tds":[{"t":"TD 1","sous":"Exercices d''application","exo":"","corr":""}]},{"id":"mp-7","n":7,"titre":"Suites et séries de fonctions","cat":"analyse","badge":"Analyse","description":"Convergence simple, uniforme, normale et théorèmes d''interversion.","cours":[{"t":"Cours complet","sous":"Théorie & démonstrations","u":""}],"fiches":[{"t":"Fiche de résumé","sous":"L''essentiel du chapitre","u":""}],"tds":[{"t":"TD 1","sous":"Exercices d''application","exo":"","corr":""}]},{"id":"mp-8","n":8,"titre":"Séries entières","cat":"analyse","badge":"Analyse","description":"Rayon de convergence, développement en série entière, fonctions usuelles.","cours":[{"t":"Cours complet","sous":"Théorie & démonstrations","u":""}],"fiches":[{"t":"Fiche de résumé","sous":"L''essentiel du chapitre","u":""}],"tds":[{"t":"TD 1","sous":"Exercices d''application","exo":"","corr":""}]},{"id":"mp-9","n":9,"titre":"Intégration sur un intervalle quelconque","cat":"analyse","badge":"Analyse","description":"Intégrales généralisées, convergence dominée, théorème de Fubini.","cours":[{"t":"Cours complet","sous":"Théorie & démonstrations","u":""}],"fiches":[{"t":"Fiche de résumé","sous":"L''essentiel du chapitre","u":""}],"tds":[{"t":"TD 1","sous":"Exercices d''application","exo":"","corr":""}]},{"id":"mp-10","n":10,"titre":"Intégrales à paramètre","cat":"analyse","badge":"Analyse","description":"Continuité, dérivabilité sous le signe intégral, applications.","cours":[{"t":"Cours complet","sous":"Théorie & démonstrations","u":""}],"fiches":[{"t":"Fiche de résumé","sous":"L''essentiel du chapitre","u":""}],"tds":[{"t":"TD 1","sous":"Exercices d''application","exo":"","corr":""}]},{"id":"mp-11","n":11,"titre":"Équations différentielles linéaires","cat":"analyse","badge":"Analyse","description":"Systèmes différentiels, wronskien, méthode de variation des constantes.","cours":[{"t":"Cours complet","sous":"Théorie & démonstrations","u":""}],"fiches":[{"t":"Fiche de résumé","sous":"L''essentiel du chapitre","u":""}],"tds":[{"t":"TD 1","sous":"Exercices d''application","exo":"","corr":""}]},{"id":"mp-12","n":12,"titre":"Calcul différentiel","cat":"analyse","badge":"Analyse Avancée","description":"Dérivées partielles, différentielle, gradient, extremums locaux et globaux.","cours":[{"t":"Cours complet","sous":"Théorie & démonstrations","u":""}],"fiches":[{"t":"Fiche de résumé","sous":"L''essentiel du chapitre","u":""}],"tds":[{"t":"TD 1","sous":"Exercices d''application","exo":"","corr":""}]},{"id":"mp-13","n":13,"titre":"Espaces préhilbertiens et euclidiens","cat":"geometrie","badge":"Géométrie & Algèbre","description":"Produit scalaire, orthogonalité, projection, distance, inégalité de Jensen.","cours":[{"t":"Séance 1 (Produit scalaire)","sous":"Théorie, démonstrations et applications","u":"https://drive.google.com/file/d/1Kt6mwfiKp_fMYaOvXT36Nzar7gI9AdZP/view?usp=sharing","v":"https://youtu.be/1FsyIs3b584"},{"t":"Séance 2 (Orthogonalité)","sous":"Théorie, démonstrations et applications","u":"https://drive.google.com/file/d/1Wxy3FiqERxLg3y4KRDnC9Odr1ZZPy_A4/view?usp=sharing","v":"https://youtu.be/8dH0NMKnQ_4"},{"t":"Séance 3 de cours","sous":"Théorie, démonstrations et applications","u":"https://drive.google.com/file/d/1CJ8EwgteCVqN8NczvRiah-WMecsIAL1T/view?usp=sharing","v":"https://youtu.be/yWdVgNslkug"},{"t":"Séance 4 de cours","sous":"Théorie, démonstrations et applications","u":"https://drive.google.com/file/d/1qYrC-fr2KjtuXp1AabjIaGTXED3PN9p9/view?usp=sharing","v":"https://youtu.be/9fDOolSob9A"},{"t":"Séance 5: distance à un sous espace vectoriels de dimension finie. Applications","sous":"Théorie, démonstrations et applications","u":"https://drive.google.com/file/d/1-EY9Lu0vtIMqNjgcT3bthSrtnB01iiKU/view?usp=sharing","v":"https://youtu.be/fkjk2xaxVQI?si=mPs-mYa0PLvJ6L_O"}],"fiches":[{"t":"Fiche de résumé","sous":"L''essentiel du chapitre","u":"https://drive.google.com/file/d/1B3zEjKJe1GjlZ0hZKjR4ASSZ0TD1yuLg/view?usp=sharing"}],"tds":[{"t":"TD 1","sous":"Exercices d''application","exo":"https://drive.google.com/file/d/1GDUUPRqrHzVYnYSs9k5A9yLQW11uXGqE/view?usp=sharing","corr":""}],"fiche_url":"https://drive.google.com/file/d/1B3zEjKJe1GjlZ0hZKjR4ASSZ0TD1yuLg/view?usp=sharing","video_url":"https://youtu.be/1FsyIs3b584"},{"id":"mp-14","n":14,"titre":"Probabilités discrètes","cat":"probabilites","badge":"Probabilités","description":"Espaces probabilisés, variables aléatoires discrètes, lois usuelles, espérance, variance.","cours":[{"t":"Cours complet","sous":"Théorie & démonstrations","u":""}],"fiches":[{"t":"Fiche de résumé","sous":"L''essentiel du chapitre","u":""}],"tds":[{"t":"TD 1","sous":"Exercices d''application","exo":"","corr":""}]}]'::jsonb, '[{"titre":"100% CONCOURS Prépas - Tous les exercices d''algèbre et de géométrie MP","auteur":"","lien":"https://drive.google.com/file/d/1euuNqpDcv_h1PfHggzBM0oOVp_27syq6/view?usp=sharing","cover":null},{"titre":"100% CONCOURS Prépas - Tous les exercices d''analyse MP","auteur":"","lien":"https://drive.google.com/file/d/1qGAVRf_YtAvKQqF3rnUefchBwB15LShn/view?usp=sharing","cover":null},{"titre":"Analyse pour la Licence","auteur":"Marie-Cécile Darracq & Jean-Etienne Rombaldi","lien":"https://drive.google.com/file/d/1d3EizGMWvYkS3M4PU_fF2RrgOOGeaPvk/view?usp=sharing","cover":null},{"titre":"Exercices d''algèbre et de probabilités MP/MP*","auteur":"David Delaunay","lien":"https://drive.google.com/file/d/17hG5SbNQWfBP77chZt9oFdQ-81ql4hgy/view?usp=sharing","cover":"https://drive.google.com/file/d/1XnvLYt8bVd6qCLcGRgo5wtToe-OejkMe/view?usp=sharing"},{"titre":"Annales de concours MP","auteur":"David Delaunay","lien":"https://drive.google.com/file/d/1Z54eUgLv2iUoHm4IQixuIuV__MldvRRx/view?usp=sharing","cover":"https://drive.google.com/file/d/1-xxdWWFqvx1S_15byJbz3Pm65T12Rq7J/view?usp=sharing"},{"titre":"Probabilités discrètes MP/MP*","auteur":"Jamel Jaber","lien":"https://drive.google.com/file/d/1gUSRREt2CF2aaCQz-PgURIWOV9UjOwN9/view?usp=sharing","cover":"https://drive.google.com/file/d/1q3EBxihbo2LmnVOJVZPi13PMhH2ywN6W/view?usp=sharing"},{"titre":"Annales de concours MP","auteur":"Jean-François Dantzer","lien":"https://drive.google.com/file/d/1W7y6uo8xLnGr0sdLMYkl3i16VJ-XJHVy/view?usp=sharing","cover":null},{"titre":"Exercices incontournables","auteur":null,"lien":"https://drive.google.com/file/d/1V2at6I19YJSQoHoPZXFdRTkjKg7onidb/view?usp=sharing","cover":null},{"titre":"Maths 2e année H-Prépa","auteur":null,"lien":"https://drive.google.com/file/d/1gOseXaiWakHATfU0_OOypzYR7OSpMAGg/view?usp=sharing","cover":null},{"titre":"Mathématiques en MP (cours de la MP*4 Louis-le-Grand)","auteur":"Omar Bennouna, Issam Tauil & M.C.","lien":"https://drive.google.com/file/d/1d7a2fjtJIyBZTXLteuprK-MmhwqZ3z-Q/view?usp=sharing","cover":null},{"titre":"Maths Tout-en-un MPI/MPI*","auteur":null,"lien":"https://drive.google.com/file/d/1NkMjZjypjjprW2VALv5Mk7S5QKvtenlL/view?usp=sharing","cover":null}]'::jsonb, 0)
on conflict (year_id, branch_id) do update set
  branch_nom = excluded.branch_nom,
  branch_label = excluded.branch_label,
  badge = excluded.badge,
  icon = excluded.icon,
  chapitres = excluded.chapitres,
  livres = excluded.livres,
  position = excluded.position;

insert into public.cpge_courses (year_id, branch_id, branch_nom, branch_label, badge, icon, chapitres, livres, position)
values ('annee2', 'psi', 'PSI', 'Physique & Sciences de l''Ingénieur (PSI / PSI*)', 'Concours Ingénierie', '∫', '[{"id":"psi-1","n":1,"titre":"Réduction des matrices & Systèmes différentiels","cat":"algebre","badge":"Algèbre & SI","description":"Diagonalisation, trigonalisation et résolution de X'' = AX pour la dynamique des systèmes.","fiche_url":"","enonce_url":"","correction_url":null,"video_url":null,"video_duration":null},{"id":"psi-2","n":2,"titre":"Espaces euclidiens & Isométries vectorielles","cat":"algebre","badge":"Géométrie","description":"Matrices orthogonales, réflexions, rotations et orthogonalité.","fiche_url":"https://drive.google.com/file/d/1bRrvkojc9E-MZiYS35LArTJi44bln8Zy/view?usp=sharing","enonce_url":"","correction_url":null,"video_url":"https://youtu.be/1FsyIs3b584","video_duration":"40 min"},{"id":"psi-3","n":3,"titre":"Séries & Intégrales à paramètre","cat":"analyse","badge":"Analyse","description":"Théorème de convergence dominée, intégration terme à terme et transformées intégrales.","fiche_url":"https://drive.google.com/file/d/1KHTrCFgCFXOjYtew6_2xWm6jiKSjkYdc/view?usp=sharing","enonce_url":"","correction_url":null,"video_url":"https://youtu.be/VNkWUwhJT2g","video_duration":"50 min"}]'::jsonb, '[]'::jsonb, 1)
on conflict (year_id, branch_id) do update set
  branch_nom = excluded.branch_nom,
  branch_label = excluded.branch_label,
  badge = excluded.badge,
  icon = excluded.icon,
  chapitres = excluded.chapitres,
  livres = excluded.livres,
  position = excluded.position;

insert into public.cpge_courses (year_id, branch_id, branch_nom, branch_label, badge, icon, chapitres, livres, position)
values ('annee2', 'tsi2', 'TSI 2', 'Technologie & Sciences Industrielles (2ème Année)', 'Concours CNC TSI', 'T', '[{"id":"tsi2-1","n":1,"titre":"Réduction des endomorphismes & Matrices symétriques","cat":"algebre","badge":"Algèbre Spé","description":"Diagonalisation, puissance k-ième de matrices et formes quadratiques.","fiche_url":"https://drive.google.com/file/d/14p5mq_yxJqDasYcXNCglRc016HuNNw3M/view?usp=sharing","enonce_url":"https://drive.google.com/file/d/1Zy5WClguDAGXKTcH0gsBfDWes0twhGpL/view?usp=sharing","correction_url":"https://drive.google.com/file/d/1mz7emSAwMvTbU_gj0J6HJZSk5ejhcveB/view?usp=sharing","video_url":"https://youtu.be/0Mdd_ZLeN3U","video_duration":"55 min"},{"id":"tsi2-2","n":2,"titre":"Intégrales généralisées & Séries entières","cat":"analyse","badge":"Analyse Spé","description":"Convergence des intégrales impropres, calcul de rayons de convergence et développements en séries entières.","fiche_url":"https://drive.google.com/file/d/1KHTrCFgCFXOjYtew6_2xWm6jiKSjkYdc/view?usp=sharing","enonce_url":"https://drive.google.com/file/d/15fwfeFIpGaUVsDrT8otnX2H6hjBdBrei/view?usp=sharing","correction_url":null,"video_url":"https://youtu.be/CU7rXoNvIL0","video_duration":"45 min"},{"id":"tsi2-3","n":3,"titre":"Probabilités discrètes & Variables aléatoires","cat":"proba","badge":"Probabilités","description":"Variables discrètes infinies, lois usuelles, espérance et variance.","fiche_url":"https://drive.google.com/file/d/1B3zEjKJe1GjlZ0hZKjR4ASSZ0TD1yuLg/view?usp=sharing","enonce_url":"","correction_url":null,"video_url":null,"video_duration":null}]'::jsonb, '[]'::jsonb, 2)
on conflict (year_id, branch_id) do update set
  branch_nom = excluded.branch_nom,
  branch_label = excluded.branch_label,
  badge = excluded.badge,
  icon = excluded.icon,
  chapitres = excluded.chapitres,
  livres = excluded.livres,
  position = excluded.position;

insert into public.cpge_courses (year_id, branch_id, branch_nom, branch_label, badge, icon, chapitres, livres, position)
values ('annee2', 'ecs2', 'ECS 2', 'Économique & Commerciale Option Scientifique (2ème Année)', 'BCE / Ecricome', 'E', '[{"id":"ecs2-1","n":1,"titre":"Algèbre bilinéaire & Réduction des endomorphismes symétriques","cat":"algebre","badge":"Pilier BCE","description":"Produit scalaire, orthogonalité, matrice du produit scalaire et réduction symétrique.","fiche_url":"","enonce_url":"https://drive.google.com/file/d/1yaVTy-vHFVcNCvPrvDIqeUAjAUPJ6Zfa/view?usp=sharing","correction_url":"https://drive.google.com/file/d/1Xn5MvoD9Q2g5Qz_zgllpkUz6CFQX12VT/view?usp=sharing","video_url":"https://youtu.be/nCY1psyB09Y","video_duration":"60 min"},{"id":"ecs2-2","n":2,"titre":"Variables aléatoires à densité & Probabilités continues","cat":"proba","badge":"Probabilités Spé","description":"Densité de probabilité, fonction de répartition, lois normales, exponentielles et théorème central limite.","fiche_url":"https://drive.google.com/file/d/1B3zEjKJe1GjlZ0hZKjR4ASSZ0TD1yuLg/view?usp=sharing","enonce_url":"https://drive.google.com/file/d/1N5AjcoqoQN9xDBaIQJPTkblJ6B-Iq0jc/view?usp=sharing","correction_url":null,"video_url":null,"video_duration":null},{"id":"ecs2-3","n":3,"titre":"Fonctions de plusieurs variables & Optimisation","cat":"analyse","badge":"Analyse & Éco","description":"Dérivées partielles, gradient, matrice hessienne, extremums libres et sous contrainte d''égalité.","fiche_url":"","enonce_url":"","correction_url":null,"video_url":null,"video_duration":null}]'::jsonb, '[]'::jsonb, 3)
on conflict (year_id, branch_id) do update set
  branch_nom = excluded.branch_nom,
  branch_label = excluded.branch_label,
  badge = excluded.badge,
  icon = excluded.icon,
  chapitres = excluded.chapitres,
  livres = excluded.livres,
  position = excluded.position;

insert into public.cpge_courses (year_id, branch_id, branch_nom, branch_label, badge, icon, chapitres, livres, position)
values ('annee2', 'ect2', 'ECT 2', 'Économique & Commerciale Option Technologique (2ème Année)', 'Concours Écoles de Commerce', '€', '[{"id":"ect2-1","n":1,"titre":"Matrices, Déterminants & Diagonalisation","cat":"algebre","badge":"Algèbre","description":"Recherche de valeurs propres, diagonalisation des matrices 2x2 et 3x3.","fiche_url":"","enonce_url":"","correction_url":null,"video_url":null,"video_duration":null},{"id":"ect2-2","n":2,"titre":"Intégration & Probabilités continues","cat":"proba","badge":"Probabilités","description":"Calculs d''aires, lois uniformes et normales appliquées à la gestion et au commerce.","fiche_url":"","enonce_url":"","correction_url":null,"video_url":null,"video_duration":null}]'::jsonb, '[]'::jsonb, 4)
on conflict (year_id, branch_id) do update set
  branch_nom = excluded.branch_nom,
  branch_label = excluded.branch_label,
  badge = excluded.badge,
  icon = excluded.icon,
  chapitres = excluded.chapitres,
  livres = excluded.livres,
  position = excluded.position;

insert into public.passerelle_filieres (id, nom, de, vers, icon, chapitres, livres, position)
values ('mp', 'MP', 'MPSI', 'MP', '∑', '[{"id":"mp-alg-lin","titre":"Algèbre linéaire","why":"Socle de toute la réduction des endomorphismes en MP.","fiche":"https://drive.google.com/file/d/14p5mq_yxJqDasYcXNCglRc016HuNNw3M/view?usp=sharing","items":[{"id":"mp-alg-1","titre":"Fiche 1 de révision d''algèbre linéaire","enonce":"https://drive.google.com/file/d/1Zy5WClguDAGXKTcH0gsBfDWes0twhGpL/view?usp=sharing","correction":[{"label":"Exos 1-2 & 14","url":"https://drive.google.com/file/d/1mz7emSAwMvTbU_gj0J6HJZSk5ejhcveB/view?usp=sharing"},{"label":"Exos 16 & 17","url":"https://drive.google.com/file/d/1mCPWqCNIB3Mzw2uueuAMCbdFKIO94NGc/view?usp=sharing"}],"video":null},{"id":"mp-alg-2","titre":"Exercice sur les projecteurs","enonce":"https://drive.google.com/file/d/1GByznR3IyXyiJuRr93vxuXiO86CkXCaX/view?usp=sharing","correction":"https://drive.google.com/file/d/1xodzCmuCKHOW2FcLAvF5sL2RUHxcYrmm/view?usp=sharing","video":null},{"id":"mp-alg-3","titre":"Image et noyau itérés, indice de Fitting","enonce":"https://drive.google.com/file/d/1ZggfM2jY7rp8ru0-emdmcuvPAVjhc-_W/view?usp=sharing","correction":"https://drive.google.com/file/d/1KL1GbmwZ-B5pSDLveO7nkrqnkajcoPFy/view?usp=sharing","video":"https://drive.google.com/file/d/1CD93AzmoWJgJvGjVp2AsIBmP8Iyb3j4Q/view?usp=sharing"},{"id":"mp-alg-4","titre":"Extrait du CNC Marocain pour 1ère année - Année 2024 Filière MP","enonce":"https://drive.google.com/file/d/11Ajy7k2RMiCFQY5mNuFQ4KF7wxtM5XeY/view?usp=sharing","correction":"https://drive.google.com/file/d/1LgxdWbiV4M_E_6MggZmGHdH_QunCV3No/view?usp=sharing","video":null},{"id":"mp-alg-5","titre":"Extrait – Session 2009 – MP: Approximation polynômiale au sens des moindres carrés","enonce":"https://drive.google.com/file/d/1kmXsUUFYEaV7XahuOWHVDpxFKJ8_5wv-/view?usp=sharing","correction":null,"video":null},{"id":"mp-alg-6","titre":"CNC - Session 2011 - MP","enonce":"https://drive.google.com/file/d/14mBZeR1PcoBCHu5q4SvLXauDWT82WtFz/view?usp=sharing","correction":null,"video":null},{"id":"mp-alg-7","titre":"CNC - 2014 : Caractérisation des homothéties en dimension 2 Application au commutant","enonce":"https://drive.google.com/file/d/1DWioB60yIslTU0zwIYfJNpRE9YfS-3BC/view?usp=sharing","correction":null,"video":null},{"id":"mp-alg-8","titre":"Concours National Commun – Session 2016 – Filière MP : tout hyperplan vectoriel de E contient au moins une matrice inversible","enonce":"https://drive.google.com/file/d/1753wxjMvyCBmZYY41Gv2pMsyVeTpMr4r/view?usp=sharing","correction":null,"video":null},{"id":"mp-alg-9","titre":"ECOLE POLYTECHNIQUE - 2017: forme symplectique","enonce":"https://drive.google.com/file/d/1KrN0BjTH2dvszlGU20Swluan2h4DNAls/view?usp=sharing","correction":null,"video":null}],"seances":[]},{"id":"mp-analyse-rev","titre":"Révision d''analyse","why":"Prérequis directs et indispensables pour aborder l''analyse en toute confiance.","fiche":null,"items":[{"id":"mp-ana-1","titre":"Fiche N° 1","enonce":"https://drive.google.com/file/d/1A9AYWRPgKhj1c-fp1VWJuipRlHRpaANm/view?usp=sharing","correction":null,"video":null}],"seances":[{"id":"mp-ana-s1","titre":"Correction du premier problème de la fiche N°1","video":null,"support":"https://drive.google.com/file/d/1kPL2Oe8aZTLwPkssKJOMGRxWfy2wGS8h/view?usp=sharing"},{"id":"mp-ana-s2","titre":"Correction du deuxième problème de la fiche N°1: Fonction Gamma","video":"https://youtu.be/rawCPGARZ04","support":"https://drive.google.com/file/d/1u89mFPNP8qfhjc4S4PIQuuwqBHxn31PL/view?usp=sharing"},{"id":"mp-ana-s3","titre":"Correction du troisième problème de la fiche N°1","video":null,"support":"https://drive.google.com/file/d/1jvKURxojuYy1hnLX-OET_xYSeiIrrUYt/view?usp=sharing"}]},{"id":"mp-det","titre":"Calculs des determinants","why":"Prérequis directs et indispensables pour calculer les determinants","fiche":[{"label":"détaillée","url":"https://drive.google.com/file/d/1OuO-2h5nZwik2nktS8pcwZEkNPhLsRKT/view?usp=sharing"},{"label":"de synthèse et d''entraînement","url":"https://drive.google.com/file/d/1NKOGhEGplv4E8J18ZJTrsssOwfTWO_TG/view?usp=sharing"}],"items":[{"id":"mp-det-1","titre":"Déterminants classiques","enonce":"https://drive.google.com/file/d/1E6Kb4Lpm6OHaV2szdY04gKvVmA32pWg5/view?usp=sharing","correction":[{"label":"Calcul des determinants: Vandermonde, la matrice circulante et de la matrice compagnon","url":"https://drive.google.com/file/d/13RN-WPd1YMvbg6TWL4D8-wXht02Iar3b/view?usp=sharing"},{"label":"Exos 3: Déterminant de Cauchy et de la matrice de Hilbert","url":"https://drive.google.com/file/d/1jRdEyzRoAA4DnT5yEMZtFEQZ5wpKWO2r/view?usp=sharing"}],"video":null}],"seances":[{"id":"mp-det-s1","titre":"Calcul des determinants: Vandermonde, la matrice circulante et de la matrice compagnon","video":"https://youtu.be/8EXSXe7i_KQ","support":"https://drive.google.com/file/d/13RN-WPd1YMvbg6TWL4D8-wXht02Iar3b/view?usp=sharing"}]},{"id":"mp-suites-series","titre":"Suites & séries numériques","why":"Fondation directe des séries de fonctions, des séries entières et des familles sommables étudiées en spé.","fiche":[{"label":"détaillée","url":"https://drive.google.com/file/d/1qSDn8RmZD0wneRHG8aOWGCkq_sqWErsT/view?usp=sharing"},{"label":"de synthèse et d''entraînement","url":"https://drive.google.com/file/d/1bS28V56U00uiETGqhJNMfbQ_2UvhtWzu/view?usp=sharing"},{"label":"Séries numériques","url":"https://drive.google.com/file/d/1xSklzyd29I4Al_JKIdDHS9vuRlI-Dmdc/view?usp=sharing"}],"items":[{"id":"mp-ss-1","titre":"CCINP MP 2014: convergence de séries par transformation d’Abel","enonce":"https://drive.google.com/file/d/1n1zUz9wwZvOP1kzMp87ptg7Ir_Ha5zcT/view?usp=sharing","correction":"https://drive.google.com/file/d/1GLWuEzAi5ZVX8e_vVYfKFidv2TA7Vnfn/view?usp=sharing","video":null},{"id":"mp-ss-2","titre":"Formule de Wallis - Formule de Stirling - Développement asymptotique de n!","enonce":"https://drive.google.com/file/d/1UeOo0klVvAmJxVgRi3y7ugdNP55Ufv5K/view?usp=sharing","correction":"https://drive.google.com/file/d/14V9IQBRhb8uuutx7BLwjxrIulE1IblC-/view?usp=sharing","video":"https://youtu.be/v2JkFvxiiFg"},{"id":"mp-ss-3","titre":"CCINP 2025- Autour du théorème de comparaison avec une intégrale","enonce":"https://drive.google.com/file/d/1VH1zvss1ShTgl_r_9Jt5eLmYqNOkzIKk/view?usp=sharing","correction":"","video":null},{"id":"mp-ss-4","titre":"Centrale 2015: Séries et Intégrales impropres","enonce":"https://drive.google.com/file/d/1s8DeY4O1Qh7D1as8N2tAmHPWZ3u90fiC/view?usp=sharing","correction":"","video":null},{"id":"mp-ss-5","titre":"Mines-Ponts 2020: Séries numériques et Intégrales","enonce":"https://drive.google.com/file/d/103OGWPhu67Z_V1v7TnQlib7T0Msv7CVY/view?usp=sharing","correction":"","video":null}],"seances":[{"id":"mp-ss-s1","titre":"Série de Bertrand","video":"https://youtu.be/uEQFSHQ5k2I","support":"https://drive.google.com/file/d/1uIbE36LoFvYh7zyi9m5U3W2fBWEDPM92/view?usp=sharing"}]},{"id":"mp-integration","titre":"Intégration sur un segment - Intégrales généralisées","why":"Base de l''intégration sur un intervalle quelconque et des intégrales à paramètre.","fiche":"https://drive.google.com/file/d/1KHTrCFgCFXOjYtew6_2xWm6jiKSjkYdc/view?usp=sharing","items":[{"id":"mp-int-1","titre":"Mines-Ponts 2020: Séries numériques et Intégrales","enonce":"https://drive.google.com/file/d/1npw04u-mKk0XCSJhCvFUcSr2x1YuVuMp/view?usp=sharing","correction":"","video":null},{"id":"mp-int-2","titre":"Extrait du CNC 2026 filière MP: Transformé de Laplace","enonce":"https://drive.google.com/file/d/13xri3BmvqO9BsFgB7LXr79PFVIkoUYJ0/view?usp=sharing","correction":"","video":null},{"id":"mp-int-3","titre":"CNC – Session 2017 – Filière MP: Calcul de la somme de la série de Riemann, pour alpha=2","enonce":"https://drive.google.com/file/d/1rRBcaMLSzV6uTutVrKeawvogleIaV4sU/view?usp=sharing","correction":"","video":null},{"id":"mp-int-4","titre":"CONCOURS Mine Pont 2026: Lemme fondamental du calcul variationnel","enonce":"https://drive.google.com/file/d/1c8goDOp3yWcUdgPERUXa7ZkrvbbTGtzJ/view?usp=sharing","correction":"","video":null},{"id":"mp-int-5","titre":"CONCOURS D’ADMISSION 2026- ECOLE POLYTECHNIQUE ESPCI: Sommes de Riemann","enonce":"https://drive.google.com/file/d/1c8goDOp3yWcUdgPERUXa7ZkrvbbTGtzJ/view?usp=sharing","correction":"","video":null},{"id":"mp-int-6","titre":"CONCOURS Mine Pont Session 2024","enonce":"https://drive.google.com/file/d/1j8QK2Q4VS7tbC2A0BLdl-wdLLOncmJTq/view?usp=sharing","correction":"","video":null},{"id":"mp-int-7","titre":"Centrale 2015 - Séries et Intégrales impropres: Fonction Gamma d''Euler","enonce":"https://drive.google.com/file/d/1o_nreJx8Anfg9GQus29KEWMBezR9yLdN/view?usp=sharing","correction":"","video":null},{"id":"mp-int-8","titre":"Fiche de révision","enonce":"https://drive.google.com/file/d/1HjTf9KEc5jAiFkbRpNkFNJmkzxdLg92e/view?usp=sharing","correction":"https://drive.google.com/file/d/1uIbE36LoFvYh7zyi9m5U3W2fBWEDPM92/view?usp=sharing","video":null}],"seances":[{"id":"mp-int-s1","titre":"Intégrale de Dirichlet","video":"https://youtu.be/VNkWUwhJT2g","support":"https://drive.google.com/file/d/1uIbE36LoFvYh7zyi9m5U3W2fBWEDPM92/view?usp=sharing"},{"id":"mp-int-s2","titre":"Intégrales généralisées & séries numériques : 2 problèmes corrigés pas à pas","video":"https://youtu.be/m164u6S0dOI","support":"https://drive.google.com/file/d/1FuzlIr-JtHUJvoJf_LIxEwbC_WBoml6c/view?usp=sharing"}]},{"id":"mp-proba","titre":"Probabilités","why":"Les probabilités sur un univers fini préparent l''étude des variables aléatoires discrètes infinies de deuxième année.","fiche":"","items":[{"id":"mp-pr-1","titre":"CNC 2016: Une démonstration probabiliste du théorème de Stone-Weierstrass","enonce":"https://drive.google.com/file/d/1QLm_IpukDR3ukj95ys5-sz63Pw9-Ovbs/view?usp=sharing","correction":"","video":null},{"id":"mp-pr-2","titre":"CONCOURS 2015: Variables aléatoires sous-gaussiennes","enonce":"https://drive.google.com/file/d/19t7KCwPr3Pk792xp0ihPOT_vKEWWpQEo/view?usp=sharing","correction":"","video":null},{"id":"mp-pr-3","titre":"CONCOURS 2015 - Filière MP. Théorème d’approximation de Weierstrass","enonce":"https://drive.google.com/file/d/1VHGSyBpFCUbwjp_RmhVl4gnC_grbTBwJ/view?usp=sharing","correction":"","video":null},{"id":"mp-pr-4","titre":"ECOLE POLYTECHNIQUE Session 2026","enonce":"https://drive.google.com/file/d/1VjCUQMvNlIvdEsB1x0vo9l5IV21pBLrN/view?usp=sharing","correction":"","video":null},{"id":"mp-pr-5","titre":"Inégalité de Hölder- Une inégalité de déviation- Inégalités de Khintchine","enonce":"https://drive.google.com/file/d/1azKXrWOM3rKIHHvZ6ocnINp0IHFW6snf/view?usp=sharing","correction":"","video":null}],"seances":[]},{"id":"mp-esp-eucl","titre":"Espaces Euclidiens","why":"Indispensables à la réduction des endomorphismes symétriques et à l''étude des espaces préhilbertiens.","fiche":"https://drive.google.com/file/d/1bRrvkojc9E-MZiYS35LArTJi44bln8Zy/view?usp=sharing","items":[{"id":"mp-eucl-1","titre":"Mini exercice pour déterminer l''orthogonal (CCINP 2021)","enonce":"https://drive.google.com/file/d/1y2rzX5UjsgidvbRc_2UWSvsljljpV83X/view?usp=sharing","correction":"","video":null},{"id":"mp-eucl-2","titre":"Extrait de CNC 2022-MP: Construction d''une base orthonormée d''un sous espace vectoriel de Rn","enonce":"https://drive.google.com/file/d/1Bo9NUIKCeXJGICnzbixWYW0DENT2SRPM/view?usp=sharing","correction":"","video":null},{"id":"mp-eucl-3","titre":"CCINP SESSION 2026","enonce":"https://drive.google.com/file/d/1vQC6gVzp5LSkjPxfntu99M1WSyyFINj7/view?usp=sharing","correction":"","video":null},{"id":"mp-eucl-4","titre":"Concours National Commun – Session 2026 – MP","enonce":"https://drive.google.com/file/d/1UaZ5RL87k9vsrAfK-2EsAzOxxn8y5BGW/view?usp=sharing","correction":"","video":null},{"id":"mp-eucl-5","titre":"EXTRAIT X-ENS 2025","enonce":"https://drive.google.com/file/d/174CRTg6or__NogtSHSLcU24KPKRFbAh0/view?usp=sharing","correction":"","video":null},{"id":"mp-eucl-6","titre":"Concours National Commun – Session 2019 – MP: Détérminant de Gram et application au calcul d’un minimum","enonce":"https://drive.google.com/file/d/1WzU_1Ida4PGGMg2ci6Q4Z84wQuCLBqVe/view?usp=sharing","correction":"","video":null}],"seances":[{"id":"mp-eucl-s1","titre":"Séance 1 de cours","video":"https://youtu.be/1FsyIs3b584","support":"https://drive.google.com/file/d/1Kt6mwfiKp_fMYaOvXT36Nzar7gI9AdZP/view?usp=sharing"},{"id":"mp-eucl-s2","titre":"Séance 2 de cours","video":"https://youtu.be/8dH0NMKnQ_4","support":"https://drive.google.com/file/d/1Wxy3FiqERxLg3y4KRDnC9Odr1ZZPy_A4/view?usp=sharing"},{"id":"mp-eucl-s3","titre":"Séance 3 de cours","video":"https://youtu.be/yWdVgNslkug","support":"https://drive.google.com/file/d/1CJ8EwgteCVqN8NczvRiah-WMecsIAL1T/view?usp=sharing"},{"id":"mp-eucl-s4","titre":"Séance 4 de cours","video":"https://youtu.be/9fDOolSob9A","support":"https://drive.google.com/file/d/1qYrC-fr2KjtuXp1AabjIaGTXED3PN9p9/view?usp=sharing"}]},{"id":"mp-polynomes","titre":"Polynômes & fractions","why":"Indispensables pour les polynômes en CPGE","fiche":null,"items":[{"id":"mp-poly-1","titre":"Centrale-Supélec Mathematics - 2021 Inégalités de Bernstein","enonce":"https://drive.google.com/file/d/1uoXUkzQNY1aUeLwy39AbqolqAhmv5Eie/view?usp=sharing","correction":"","video":null},{"id":"mp-poly-2","titre":"Exercice 1 sur les polynômes","enonce":"https://drive.google.com/file/d/1AfvinK-vBBn0gvVsCCkJyFhoY8uTsBdV/view?usp=sharing","correction":null,"video":"https://youtu.be/wrS32nCwmR4"},{"id":"mp-poly-3","titre":"Exercice 2 sur les polynômes","enonce":"https://drive.google.com/file/d/19DGyzsVk8z6Te0h1BYVz94AnULLQIRZX/view?usp=sharing","correction":null,"video":"https://youtu.be/QlE5DLxkcHs"},{"id":"mp-poly-4","titre":"Exercice 3 sur les polynômes","enonce":"https://drive.google.com/file/d/1a4JP2lx1Sxlz15bh3rL94iVsHjf3Gj18/view?usp=sharing","correction":null,"video":"https://youtu.be/2Cug0ds1jJw"}],"seances":[]},{"id":"mp-mat","titre":"Calcul matriciel","why":"Maîtriser les opérations sur les matrices, les systèmes linéaires et les inverses.","fiche":null,"items":[{"id":"mp-mat-1","titre":"Problème dans le chapitre du calcul matriciel","enonce":"https://drive.google.com/file/d/1_201-3ajlM3S46X50a6Ld-_2o_qPN7w5/view?usp=sharing","correction":null,"video":"https://www.youtube.com/watch?v=-2LJGMON7Cw"},{"id":"mp-mat-2","titre":"Exercice 1","enonce":"https://drive.google.com/file/d/1RECaFZG5edDfNNEckHzyJTRRt_iYy3w0/view?usp=sharing","correction":null,"video":"https://youtu.be/Sp4sGLjFKz4"},{"id":"mp-mat-3","titre":"Exercice 2","enonce":"https://drive.google.com/file/d/1RECaFZG5edDfNNEckHzyJTRRt_iYy3w0/view?usp=sharing","correction":null,"video":"https://youtu.be/J7xe9-uTA9Y"},{"id":"mp-mat-4","titre":"Exercice 3","enonce":"https://drive.google.com/file/d/1RECaFZG5edDfNNEckHzyJTRRt_iYy3w0/view?usp=sharing","correction":null,"video":"https://youtu.be/wberhwdFWhc"},{"id":"mp-mat-5","titre":"Exercice 4","enonce":"https://drive.google.com/file/d/1RECaFZG5edDfNNEckHzyJTRRt_iYy3w0/view?usp=sharing","correction":null,"video":"https://youtu.be/Zrd5LJBr_DQ"},{"id":"mp-mat-6","titre":"Exercice 5","enonce":"https://drive.google.com/file/d/1MMUbUjziq4L3H439iaa0RQvs74u9PQEg/view?usp=sharing","correction":null,"video":"https://youtu.be/h9toQqA8u1o"},{"id":"mp-mat-7","titre":"Exercice 6","enonce":"https://drive.google.com/file/d/1KFSUZAbHJV5JqZVfjDwIgORNgaKDfS6k/view?usp=sharing","correction":null,"video":"https://www.youtube.com/watch?v=5nvsbjydNAE"}],"seances":[]}]'::jsonb, '[{"titre":"100% CONCOURS Prépas- Tous les exercices d''algèbre et de géométrie MP","auteur":"","lien":"https://drive.google.com/file/d/1euuNqpDcv_h1PfHggzBM0oOVp_27syq6/view?usp=sharing","cover":null},{"titre":"100% CONCOURS Prépas- Tous les exercices d''analyse MP","auteur":"","lien":"https://drive.google.com/file/d/1qGAVRf_YtAvKQqF3rnUefchBwB15LShn/view?usp=sharing","cover":null},{"titre":"Analyse pour la Licence","auteur":"MARIE-CÉCILE DARRACQ & JEAN-ETIENNE ROMBALDI","lien":"https://drive.google.com/file/d/1d3EizGMWvYkS3M4PU_fF2RrgOOGeaPvk/view?usp=sharing","cover":null},{"titre":"Exercices d''algèbre et de probabilités MP/MP*","auteur":"David Delaunay","lien":"https://drive.google.com/file/d/17hG5SbNQWfBP77chZt9oFdQ-81ql4hgy/view?usp=sharing","cover":"https://drive.google.com/file/d/1XnvLYt8bVd6qCLcGRgo5wtToe-OejkMe/view?usp=sharing"},{"titre":"Annales de concours MP","auteur":"David Denaulay","lien":"https://drive.google.com/file/d/1Z54eUgLv2iUoHm4IQixuIuV__MldvRRx/view?usp=sharing","cover":"https://drive.google.com/file/d/1-xxdWWFqvx1S_15byJbz3Pm65T12Rq7J/view?usp=sharing"},{"titre":"Probabilité discrètes MP/MP*","auteur":"Jamel Jaber","lien":"https://drive.google.com/file/d/1gUSRREt2CF2aaCQz-PgURIWOV9UjOwN9/view?usp=sharing","cover":"https://drive.google.com/file/d/1q3EBxihbo2LmnVOJVZPi13PMhH2ywN6W/view?usp=sharing"},{"titre":"Annales de concours MP","auteur":"JEAN-FRANÇOIS DANTZER","lien":"https://drive.google.com/file/d/1W7y6uo8xLnGr0sdLMYkl3i16VJ-XJHVy/view?usp=sharing","cover":null},{"titre":"EXERCICES INCONTOURNABLES","auteur":null,"lien":"https://drive.google.com/file/d/1V2at6I19YJSQoHoPZXFdRTkjKg7onidb/view?usp=sharing","cover":null},{"titre":"Maths 2e année H-Prépa","auteur":null,"lien":"https://drive.google.com/file/d/1gOseXaiWakHATfU0_OOypzYR7OSpMAGg/view?usp=sharing","cover":null},{"titre":"Mathématiques en MP (cours de la MP*4 Louis-le-Grand)","auteur":"Omar Bennouna, Issam Tauil & M.C.","lien":"https://drive.google.com/file/d/1d7a2fjtJIyBZTXLteuprK-MmhwqZ3z-Q/view?usp=sharing","cover":null},{"titre":"Maths Tout-en-un MPI/MPI","auteur":null,"lien":"https://drive.google.com/file/d/1NkMjZjypjjprW2VALv5Mk7S5QKvtenlL/view?usp=sharing","cover":null}]'::jsonb, 0)
on conflict (id) do update set
  nom = excluded.nom,
  de = excluded.de,
  vers = excluded.vers,
  icon = excluded.icon,
  chapitres = excluded.chapitres,
  livres = excluded.livres,
  position = excluded.position;

insert into public.passerelle_filieres (id, nom, de, vers, icon, chapitres, livres, position)
values ('psi', 'PSI', 'PCSI', 'PSI', '∫', '[{"id":"psi-ev","titre":"Espaces vectoriels","why":"La réduction, chapitre central de PSI, s''appuie dessus.","fiche":"","items":[{"id":"psi-ev-1","titre":"Structure d''espace vectoriel","enonce":"","correction":"","video":null}]},{"id":"psi-mat","titre":"Calcul matriciel","why":"Outil quotidien en algèbre comme en SI.","fiche":"","items":[]},{"id":"psi-sf","titre":"Suites & fonctions","why":"Sans réflexes solides ici, les séries deviennent un mur.","fiche":"","items":[]},{"id":"psi-int","titre":"Intégration & équations différentielles","why":"Les équations différentielles reviennent dès la rentrée.","fiche":"","items":[]},{"id":"psi-ps","titre":"Produit scalaire","why":"Prépare les espaces préhilbertiens.","fiche":"","items":[]}]'::jsonb, '[{"titre":"J''assure aux concours Maths- PSI","auteur":"Sylvain Gugger","lien":"https://drive.google.com/file/d/164lo3gixEqVzwsHfBdN0jiNRk4a5KPEg/view?usp=sharing","cover":"https://drive.google.com/file/d/1eZvAUPdrQeJPBZmZGzg781RgxXNA39ys/view?usp=sharing"}]'::jsonb, 1)
on conflict (id) do update set
  nom = excluded.nom,
  de = excluded.de,
  vers = excluded.vers,
  icon = excluded.icon,
  chapitres = excluded.chapitres,
  livres = excluded.livres,
  position = excluded.position;

insert into public.passerelle_filieres (id, nom, de, vers, icon, chapitres, livres, position)
values ('tsi', 'TSI', 'TSI 1', 'TSI 2', 'T', '[{"id":"tsi-int","titre":"Intégration sur un segment - Intégrales généralisées","why":"Base de l''intégration sur un intervalle quelconque et des intégrales à paramètre.","fiche":"https://drive.google.com/file/d/1KHTrCFgCFXOjYtew6_2xWm6jiKSjkYdc/view?usp=sharing","items":[{"id":"tsi-int-1","titre":"Sujets: Intégrale sur un segment.","enonce":"https://drive.google.com/file/d/15fwfeFIpGaUVsDrT8otnX2H6hjBdBrei/view?usp=sharing","correction":null,"video":null},{"id":"tsi-int-2","titre":"Sujets: Intégrale généralisée.","enonce":"https://drive.google.com/file/d/118WMHlBvjyQAClcFfyn-jjZp9v8ifl7F/view?usp=sharing","correction":null,"video":null}],"seances":[{"id":"tsi-int-s1","titre":"Séance 1","video":"https://youtu.be/CU7rXoNvIL0","support":"https://drive.google.com/file/d/1maeKWNDY08Zl3x4VkvHQIhNgvo9SZeWg/view?usp=sharing"},{"id":"tsi-int-s2","titre":"Séance 2","video":"https://youtu.be/qUgdlmmAbTM","support":"https://drive.google.com/file/d/14lx99cLOjm1At902iiO9CDcHjLpPLFxW/view?usp=sharing"}]}]'::jsonb, '[{"titre":"Problèmes de mathématiques TSI 1","auteur":"Ali Essaidi","lien":"https://drive.google.com/file/d/1yY4z6XyNqKhvHrEzK3IzX8QNaKkBax8c/view?usp=sharing","cover":null}]'::jsonb, 2)
on conflict (id) do update set
  nom = excluded.nom,
  de = excluded.de,
  vers = excluded.vers,
  icon = excluded.icon,
  chapitres = excluded.chapitres,
  livres = excluded.livres,
  position = excluded.position;

insert into public.passerelle_filieres (id, nom, de, vers, icon, chapitres, livres, position)
values ('ecs', 'ECS', 'ECS 1', 'ECS 2', 'E', '[{"id":"ecs-alg-lin","titre":"Algèbre linéaire","why":"Base de la réduction et de l''algèbre linéaire.","fiche":"https://drive.google.com/file/d/14p5mq_yxJqDasYcXNCglRc016HuNNw3M/view?usp=sharing","items":[{"id":"ecs-alg-1","titre":"Fiche 1 de révision d''algèbre linéaire","enonce":"https://drive.google.com/file/d/1Zy5WClguDAGXKTcH0gsBfDWes0twhGpL/view?usp=sharing","correction":[{"label":"Exos 1-2 & 14","url":"https://drive.google.com/file/d/1mz7emSAwMvTbU_gj0J6HJZSk5ejhcveB/view?usp=sharing"},{"label":"Exos 16 à 18","url":"https://drive.google.com/file/d/1mCPWqCNIB3Mzw2uueuAMCbdFKIO94NGc/view?usp=sharing"}],"video":null},{"id":"ecs-alg-2","titre":"Exercice sur les projecteurs","enonce":"https://drive.google.com/file/d/1GByznR3IyXyiJuRr93vxuXiO86CkXCaX/view?usp=sharing","correction":"https://drive.google.com/file/d/1xodzCmuCKHOW2FcLAvF5sL2RUHxcYrmm/view?usp=sharing","video":null},{"id":"ecs-alg-3","titre":"TD d''algèbre linéaire","enonce":"https://drive.google.com/file/d/1XRtbzl24BLU1NDbhLej3dWFLFoEkzQRz/view?usp=sharing","correction":[{"label":"et quelques indications des exercices","url":"https://drive.google.com/file/d/1faL6pTnij4F8B2EGcVS3xuEbZeLMDazi/view?usp=sharing"},{"label":"des exos: 14-15-19 et 21","url":"https://drive.google.com/file/d/1myVCwNtSERZ77LZM-5-ATJTaJnNOXFsT/view?usp=sharing"}],"video":null}],"seances":[{"id":"ecs-alg-s1","titre":"Séance de révision 1","video":null,"support":"https://drive.google.com/file/d/1c1aVxTOyaju3Rbidqb1T9jOiXvTpjrHJ/view?usp=sharing"},{"id":"ecs-alg-s2","titre":"Séance de révision 2","video":null,"support":"https://drive.google.com/file/d/1jpG-z4Ee_TWHmzIBubRcJ1h6s5BaojTP/view?usp=sharing"},{"id":"ecs-alg-s3","titre":"Séance de révision 3","video":null,"support":"https://drive.google.com/file/d/1HijO1yekpLA2IoJKlQSJs1sCpmpvP-6f/view?usp=sharing"},{"id":"ecs-alg-s4","titre":"Séance de révision 4","support":"https://drive.google.com/file/d/1pVqBU80Qi2kaN13LQ36NM1MGQmiq2KiW/view?usp=sharing","video":"https://youtu.be/0Mdd_ZLeN3U"},{"id":"ecs-alg-s5","titre":"Séance de révision 5","support":"https://drive.google.com/file/d/1KREmSCU1ocajxPEQ1zr6j6JQOnfPO7QK/view?usp=sharing","video":"https://youtu.be/nCY1psyB09Y"},{"id":"ecs-alg-s6","titre":"Séance 6: Éléments propres des endomorphismes et des matrices carrées","support":"https://drive.google.com/file/d/1IgT_yzY6mWWQIEKLaO0PVbab9FEvLUFC/view?usp=sharing","video":null},{"id":"ecs-alg-s7","titre":"Séance 7: Algèbre linéaire (Savoir utiliser le polynôme annulateur)","video":null,"support":"https://drive.google.com/file/d/1mpknd1Vn-SxEp5R7l64LQ_8_Cr4XDpVi/view?usp=sharing"},{"id":"ecs-alg-s8","titre":"Séance 8: Algèbre linéaire - sous espaces propres et diagonalisation","video":null,"support":"https://drive.google.com/file/d/1gRcn1_8E-nsubTQk511V1ObN6SIbsB3Z/view?usp=sharing"},{"id":"ecs-alg-s9","titre":"Séance 9: Algèbre linéaire - réduction des endomorphismes (diagonalisation)","video":null,"support":"https://drive.google.com/file/d/1R3zbJyqtjtgHvJo2Qwh9vBmXGmSiUM6c/view?usp=sharing"}]},{"id":"ecs-alg-bilin","titre":"Algèbre bilinéaire","why":"Un cours complet avec la pratique de chaque partie sur des extraits de concours","fiche":"","items":[],"seances":[{"id":"ecs-bilin-s1","titre":"Séance 1: Algèbre bilinéaire - Produit scalaire normes et Inégalité de Cauchy-schwartz","video":null,"support":"https://drive.google.com/file/d/1yaVTy-vHFVcNCvPrvDIqeUAjAUPJ6Zfa/view?usp=sharing"},{"id":"ecs-bilin-s2","titre":"Séance 2: Algèbre bilinéaire - Orthogonalité","video":null,"support":"https://drive.google.com/file/d/1Xn5MvoD9Q2g5Qz_zgllpkUz6CFQX12VT/view?usp=sharing"},{"id":"ecs-bilin-s3","titre":"Séance 3: Algèbre bilinéaire - Orthogonalité et matrice orthogonale","video":null,"support":"https://drive.google.com/file/d/112CnIb6M4wa_BlzWkLYc7v1QsoE0hrR8/view?usp=sharing"},{"id":"ecs-bilin-s4","titre":"Séance 4: Algèbre bilinéaire - Orthogonalité, matrice du produit scalaire","video":null,"support":"https://drive.google.com/file/d/1paNDMPClvqa4RkymeAKgyv0gkQLwE-jj/view?usp=sharing"},{"id":"ecs-bilin-s5","titre":"Séance 5: Algèbre bilinéaire - Orthogonalité, projection orthogonale et distance","video":null,"support":"https://drive.google.com/file/d/1E3Wxpb5ONJwEZCw2mBsDWyFRbqerjzfT/view?usp=sharing"},{"id":"ecs-bilin-s6","titre":"Séance 6: Algèbre bilinéaire - Réduction des endomorphismes symétriques","video":null,"support":"https://drive.google.com/file/d/1NC8DjQdB3FVgcDxo6vR0geQdlKl_iSH7/view?usp=sharing"}]},{"id":"ecs-mat","titre":"Calcul matriciel","why":"Maîtriser les opérations sur les matrices, les systèmes linéaires et les inverses.","fiche":null,"items":[{"id":"ecs-mat-ex2","titre":"Exercice 2: calcul matriciel","enonce":"https://drive.google.com/file/d/1_201-3ajlM3S46X50a6Ld-_2o_qPN7w5/view?usp=sharing","video":null},{"id":"ecs-mat-1","titre":"Exercice 1","enonce":"https://drive.google.com/file/d/1RECaFZG5edDfNNEckHzyJTRRt_iYy3w0/view?usp=sharing","video":"https://youtu.be/Sp4sGLjFKz4"},{"id":"ecs-mat-2","titre":"Exercice 2","enonce":"https://drive.google.com/file/d/1RECaFZG5edDfNNEckHzyJTRRt_iYy3w0/view?usp=sharing","video":"https://youtu.be/J7xe9-uTA9Y"},{"id":"ecs-mat-3","titre":"Exercice 3","enonce":"https://drive.google.com/file/d/1RECaFZG5edDfNNEckHzyJTRRt_iYy3w0/view?usp=sharing","video":"https://youtu.be/wberhwdFWhc"},{"id":"ecs-mat-5","titre":"Exercice 5","enonce":"https://drive.google.com/file/d/1MMUbUjziq4L3H439iaa0RQvs74u9PQEg/view?usp=sharing","video":"https://youtu.be/h9toQqA8u1o"}]},{"id":"ecs-fonct","titre":"Fonctions & continuité","why":"Prérequis de l''intégration et de l''optimisation.","fiche":"","items":[]},{"id":"ecs-proba","titre":"Probabilités","why":"Les probabilités discrètes puis continues les prolongent.","fiche":"https://drive.google.com/file/d/1B3zEjKJe1GjlZ0hZKjR4ASSZ0TD1yuLg/view?usp=sharing","items":[{"id":"ecs-pr-1","titre":"TD 1: Probabilités sur un univers dénombrable","enonce":"https://drive.google.com/file/d/1csPA7_aR1XGZq-mVLbdQVsqzWMpridYD/view?usp=sharing","video":null}],"seances":[{"id":"ecs-pr-s1","titre":"Séance 1 de probabilités","video":null,"support":"https://drive.google.com/file/d/1xT2nesFcgIwO8kb2Qyanvx84Y1vFjFTW/view?usp=sharing"},{"id":"ecs-pr-s2","titre":"Séance 2 de probabilités","video":null,"support":"https://drive.google.com/file/d/1Mr7TLWIsE5qFpJzZHtopz2E6RKK70-Kx/view?usp=sharing"},{"id":"ecs-pr-s3","titre":"Séance 3 de probabilités","video":null,"support":"https://drive.google.com/file/d/1yvTlLdnXyamK5Bq4CXVxiQsO4zdaX3Ae/view?usp=sharing"},{"id":"ecs-pr-s4","titre":"Séance 4 de probabilités","video":null,"support":"https://drive.google.com/file/d/1aPDxajAfSwJw6LyWiBji4CEyMgxBSytk/view?usp=sharing"}]},{"id":"ecs-int","titre":"Intégration","why":"Indispensable aux probabilités à densité.","fiche":"","items":[]},{"id":"ecs-var","titre":"Les variables aléatoires réelles","why":"La suite des cours de probabilités et approfondissement dans le même style des concours","fiche":null,"items":[],"seances":[{"id":"ecs-var-s1","titre":"Séance 1 de variables aléatoires: Définitions et cas pratiques","video":null,"support":"https://drive.google.com/file/d/1N5AjcoqoQN9xDBaIQJPTkblJ6B-Iq0jc/view?usp=sharing"},{"id":"ecs-var-s2","titre":"Séance 2 de variables aléatoires: Image et espérance d''une v.a.r","video":null,"support":"https://drive.google.com/file/d/1H_T8J4AXzrs9tnSpjcFYFmPDtsRYfjgP/view?usp=sharing"}]}]'::jsonb, '[{"titre":"J''intégre Mathématiques approfondies 1er année - QUESTIONS ET MÉTHODES Informatique","auteur":"Coordonné par O. SARFATI et M. ALFRÉ","lien":"https://drive.google.com/file/d/1GgSwETxHjZPEXwiT_gkiebFtqfp-s5Rk/view?usp=sharing","cover":null},{"titre":"J''intégre Mathématiques approfondies 2e année - QUESTIONS ET MÉTHODES Informatique","auteur":"Coordonné par Olivier Sarfati","lien":"https://drive.google.com/file/d/16fYVpH660ljua4A9mmEu1-LDpEUqcZLA/view?usp=sharing","cover":null},{"titre":"Mathématiques Cours et exercices ECS 2e année","auteur":"Cécile Lardon & Jean-Marie Monier","lien":"https://drive.google.com/file/d/1IiGNSp_GY-OTq_S5RHcsw_Jb5ttdtH9i/view?usp=sharing","cover":"https://drive.google.com/file/d/1bJaESVMI77emwKUqVWZzIItk_T9G8rdb/view?usp=sharing"},{"titre":"Mathématiques Méthodes et exercices ECS 2e année","auteur":"Cécile Lardon & Jean-Marie Monier","lien":"https://drive.google.com/file/d/1zQ4gHg9Fm0s9VqYHF-bBQvf6HF4PTw6J/view?usp=sharing","cover":"https://drive.google.com/file/d/1zQ4gHg9Fm0s9VqYHF-bBQvf6HF4PTw6J/view?usp=sharing"},{"titre":"Mathématiques Méthodes et exercices ECS 2e année","auteur":"Cécile Lardon & Jean-Marie Monier","lien":"https://drive.google.com/file/d/11xkX65wbkRqHkdcqi9QRELygYhRgMDFT/view?usp=sharing","cover":"https://drive.google.com/file/d/1jLdbzPqh2y5cpJYLd3Tbos9IuIMyvUTr/view?usp=sharing"}]'::jsonb, 3)
on conflict (id) do update set
  nom = excluded.nom,
  de = excluded.de,
  vers = excluded.vers,
  icon = excluded.icon,
  chapitres = excluded.chapitres,
  livres = excluded.livres,
  position = excluded.position;

insert into public.passerelle_filieres (id, nom, de, vers, icon, chapitres, livres, position)
values ('ect', 'ECT', 'ECT 1', 'ECT 2', '€', '[{"id":"ect-mat","titre":"Matrices & déterminants","why":"L''aisance calculatoire conditionne toute l''analyse.","fiche":"","items":[]},{"id":"ect-suites","titre":"Suites numériques","why":"Base des modèles financiers et des séries.","fiche":"","items":[]},{"id":"ect-alg","titre":"Algèbre linéaire","why":"Ouvre le calcul matriciel appliqué.","fiche":"","items":[]},{"id":"ect-proba","titre":"Probabilités","why":"Fondations des probabilités appliquées.","fiche":"","items":[]},{"id":"ect-stat","titre":"Statistiques","why":"Prérequis de la statistique inférentielle.","fiche":"","items":[]}]'::jsonb, '[{"titre":"Cours complet de mathématiques ECT","auteur":"","lien":"","cover":null},{"titre":"Exercices & problèmes corrigés","auteur":"","lien":"","cover":null},{"titre":"Annales de concours ECT","auteur":"","lien":"","cover":null}]'::jsonb, 4)
on conflict (id) do update set
  nom = excluded.nom,
  de = excluded.de,
  vers = excluded.vers,
  icon = excluded.icon,
  chapitres = excluded.chapitres,
  livres = excluded.livres,
  position = excluded.position;
