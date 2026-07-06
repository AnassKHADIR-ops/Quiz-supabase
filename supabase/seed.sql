-- Optional demo data. Run with `supabase db push --include-seed` or locally with `supabase db reset`.
-- In production, create a teacher through Supabase Auth, then promote them with:
-- update public.profiles set role = 'teacher' where email = 'teacher@example.com';
insert into public.schools (name, type, description, icon)
values ('Demo ENSA', 'post_bac', 'Sample competitive-exam preparation', '⚙️') on conflict (name) do nothing;
insert into public.subjects (school_id, name, level)
select id, 'Mathematics', 'Baccalaureate'
from public.schools where name = 'Demo ENSA'
on conflict (school_id, name) do nothing;

insert into public.exams (title, description, subject_id, school_id, year, is_published, show_results)
select 'Mathematics Quiz', 'Basic math MCQ exam', s.id, sc.id, 2026, true, 'instant'
from public.subjects s join public.schools sc on sc.id = s.school_id
where s.name = 'Mathematics' and sc.name = 'Demo ENSA'
  and not exists (select 1 from public.exams where title = 'Mathematics Quiz');

insert into public.questions (exam_id, question_text, question_type, solution_text, position)
select e.id, q.question_text, 'single', q.solution_text, q.position
from public.exams e
cross join (values
  ('Solve for $x$: $$2x + 5 = 13$$', 'Subtract 5 from both sides: $2x = 8$. Divide by 2: $x = 4$.', 0),
  ('What is the value of $\\frac{3}{4} + \\frac{1}{8}$?', 'Convert to a common denominator: $\\frac{3}{4} = \\frac{6}{8}$. Then $\\frac{6}{8} + \\frac{1}{8} = \\frac{7}{8}$.', 1),
  ('What is the derivative of $f(x) = x^3 + 2x$?', 'Using the power rule: $f''(x) = 3x^2 + 2$.', 2),
  ('Evaluate: $$\\int_0^1 2x \\, dx$$', '$\\int 2x\\,dx = x^2 + C$. Evaluating from 0 to 1: $1^2 - 0^2 = 1$.', 3),
  ('Which value of $x$ satisfies $$x^2 - 9 = 0$$', 'Factor: $(x-3)(x+3) = 0$, so $x = 3$ or $x = -3$.', 4)
) as q(question_text, solution_text, position)
where e.title = 'Mathematics Quiz'
  and not exists (select 1 from public.questions existing where existing.exam_id = e.id and existing.position = q.position);

insert into public.choices (question_id, choice_text, is_correct, position)
select q.id, c.choice_text, c.is_correct, c.position
from public.questions q
join public.exams e on e.id = q.exam_id
join (values
  (0, '$x = 3$', false, 0), (0, '$x = 4$', true, 1), (0, '$x = 5$', false, 2), (0, '$x = 9$', false, 3),
  (1, '$\\frac{4}{12}$', false, 0), (1, '$\\frac{7}{8}$', true, 1), (1, '$\\frac{1}{2}$', false, 2), (1, '$\\frac{5}{8}$', false, 3),
  (2, '$f''(x) = 3x^2 + 2$', true, 0), (2, '$f''(x) = x^2 + 2$', false, 1), (2, '$f''(x) = 3x^2$', false, 2), (2, '$f''(x) = 3x + 2$', false, 3),
  (3, '$0$', false, 0), (3, '$1$', true, 1), (3, '$2$', false, 2), (3, '$\\frac{1}{2}$', false, 3),
  (4, '$x = 3$ only', false, 0), (4, '$x = -3$ only', false, 1), (4, '$x = 3$ or $x = -3$', true, 2), (4, '$x = 0$', false, 3)
) as c(question_position, choice_text, is_correct, position) on c.question_position = q.position
where e.title = 'Mathematics Quiz'
  and not exists (select 1 from public.choices existing where existing.question_id = q.id and existing.position = c.position);
