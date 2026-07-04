-- Step 1: Insert the default exam (gets ID = 1)
INSERT INTO exams (id, title, description, created_by, duration_minutes, show_results, is_published)
VALUES (1, 'Mathematics Quiz', 'Basic math MCQ exam', NULL, NULL, 'instant', true)
ON CONFLICT (id) DO NOTHING;

-- Reset the sequence so next exam starts at 2
SELECT setval('exams_id_seq', MAX(id)) FROM exams;

-- Step 2: Insert questions
INSERT INTO questions (id, exam_id, question_text, question_type, solution_text, position) VALUES
(1, 1, 'Solve for $x$: $$2x + 5 = 13$$', 'single', 'Subtract 5 from both sides: $2x = 8$. Divide by 2: $x = 4$.', 0),
(2, 1, 'What is the value of $\frac{3}{4} + \frac{1}{8}$?', 'single', 'Convert to a common denominator: $\frac{3}{4} = \frac{6}{8}$. Then $\frac{6}{8} + \frac{1}{8} = \frac{7}{8}$.', 1),
(3, 1, 'What is the derivative of $f(x) = x^3 + 2x$?', 'single', 'Using the power rule: $f''(x) = 3x^2 + 2$.', 2),
(4, 1, 'Evaluate: $$\int_0^1 2x \, dx$$', 'single', '$\int 2x\,dx = x^2 + C$. Evaluating from 0 to 1: $1^2 - 0^2 = 1$.', 3),
(5, 1, 'Which value of $x$ satisfies $$x^2 - 9 = 0$$', 'single', 'Factor: $(x-3)(x+3) = 0$, so $x = 3$ or $x = -3$.', 4)
ON CONFLICT (id) DO NOTHING;

SELECT setval('questions_id_seq', MAX(id)) FROM questions;

-- Step 3: Insert choices (question 1)
INSERT INTO choices (question_id, choice_text, is_correct, position) VALUES
(1, '$x = 3$', false, 0),
(1, '$x = 4$', true,  1),
(1, '$x = 5$', false, 2),
(1, '$x = 9$', false, 3),
-- question 2
(2, '$\frac{4}{12}$', false, 0),
(2, '$\frac{7}{8}$',  true,  1),
(2, '$\frac{1}{2}$',  false, 2),
(2, '$\frac{5}{8}$',  false, 3),
-- question 3
(3, '$f''(x) = 3x^2 + 2$', true,  0),
(3, '$f''(x) = x^2 + 2$',  false, 1),
(3, '$f''(x) = 3x^2$',     false, 2),
(3, '$f''(x) = 3x + 2$',   false, 3),
-- question 4
(4, '$0$', false, 0),
(4, '$1$', true,  1),
(4, '$2$', false, 2),
(4, '$\frac{1}{2}$', false, 3),
-- question 5
(5, '$x = 3$ only',           false, 0),
(5, '$x = -3$ only',          false, 1),
(5, '$x = 3$ or $x = -3$',   true,  2),
(5, '$x = 0$',                false, 3);

-- Step 4: Promote your teacher account to role 'teacher'
-- (run this AFTER you have signed up with anass.khadir@usmba.ac.ma in the app)
UPDATE users SET role = 'teacher' WHERE email = 'anass.khadir@usmba.ac.ma';
