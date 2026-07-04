// Each question supports LaTeX via $...$ (inline) or $$...$$ (block) syntax,
// rendered by the QuestionText component using KaTeX.
const questions = [
  {
    id: 1,
    question: "Solve for $x$: $$2x + 5 = 13$$",
    choices: ["$x = 3$", "$x = 4$", "$x = 5$", "$x = 9$"],
    correctIndex: 1,
    solution:
      "Subtract 5 from both sides: $2x = 8$. Divide by 2: $x = 4$.",
  },
  {
    id: 2,
    question: "What is the value of $\\frac{3}{4} + \\frac{1}{8}$?",
    choices: ["$\\frac{4}{12}$", "$\\frac{7}{8}$", "$\\frac{1}{2}$", "$\\frac{5}{8}$"],
    correctIndex: 1,
    solution:
      "Convert to a common denominator: $\\frac{3}{4} = \\frac{6}{8}$. Then $\\frac{6}{8} + \\frac{1}{8} = \\frac{7}{8}$.",
  },
  {
    id: 3,
    question: "What is the derivative of $f(x) = x^3 + 2x$?",
    choices: ["$f'(x) = 3x^2 + 2$", "$f'(x) = x^2 + 2$", "$f'(x) = 3x^2$", "$f'(x) = 3x + 2$"],
    correctIndex: 0,
    solution:
      "Using the power rule: $\\frac{d}{dx}x^3 = 3x^2$ and $\\frac{d}{dx}2x = 2$. So $f'(x) = 3x^2 + 2$.",
  },
  {
    id: 4,
    question: "Evaluate: $$\\int_0^1 2x \\, dx$$",
    choices: ["$0$", "$1$", "$2$", "$\\frac{1}{2}$"],
    correctIndex: 1,
    solution:
      "$\\int 2x\\,dx = x^2 + C$. Evaluating from 0 to 1: $1^2 - 0^2 = 1$.",
  },
  {
    id: 5,
    question: "Which value of $x$ satisfies $$x^2 - 9 = 0$$",
    choices: ["$x = 3$ only", "$x = -3$ only", "$x = 3$ or $x = -3$", "$x = 0$"],
    correctIndex: 2,
    solution:
      "Factor: $(x-3)(x+3) = 0$, so $x = 3$ or $x = -3$.",
  },
];

export default questions;
