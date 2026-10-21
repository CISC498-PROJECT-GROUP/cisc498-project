// The TeX commands the math converter knows, by kind. Kept as "name:symbol" strings so the tables
// stay compact. An unknown command prints as its name (math.ts).

const table = (pairs: string): Record<string, string> => Object.fromEntries(pairs.split(' ').map((pair) => [pair.slice(0, pair.indexOf(':')), pair.slice(pair.indexOf(':') + 1)]));

/** Operators, relations, arrows and delimiters, each one <mo>. */
export const SYMBOLS = table(
    'times:× cdot:⋅ pm:± mp:∓ div:÷ ast:∗ le:≤ leq:≤ ge:≥ geq:≥ lt:< gt:> ne:≠ neq:≠ approx:≈ equiv:≡ sim:∼ simeq:≃ cong:≅ propto:∝ ' +
        'in:∈ notin:∉ ni:∋ cup:∪ cap:∩ setminus:∖ subseteq:⊆ subset:⊂ supseteq:⊇ supset:⊃ emptyset:∅ varnothing:∅ ' +
        'to:→ rightarrow:→ leftarrow:← gets:← Rightarrow:⇒ Leftarrow:⇐ implies:⇒ iff:⇔ leftrightarrow:↔ Leftrightarrow:⇔ mapsto:↦ uparrow:↑ downarrow:↓ ' +
        'infty:∞ partial:∂ nabla:∇ forall:∀ exists:∃ neg:¬ lnot:¬ land:∧ wedge:∧ lor:∨ vee:∨ oplus:⊕ otimes:⊗ ' +
        'mid:| lVert:‖ rVert:‖ Vert:‖ vert:| lvert:| rvert:| |:‖ langle:⟨ rangle:⟩ lfloor:⌊ rfloor:⌋ lceil:⌈ rceil:⌉ {:{ }:} ' +
        'ldots:… cdots:⋯ dots:… vdots:⋮ circ:∘ star:⋆ bullet:∙ prime:′ angle:∠ triangle:△ perp:⊥ parallel:∥ %:% #:# &:& _:_ colon::',
);

/** Delimiters keep their text size: the prompts' TeX has no left/right sizing, so nothing stretches. */
export const FENCES = /^[()[\]|‖⟨⟩⌊⌋⌈⌉{}]$/;

/** Large operators, which take limits above and below. */
export const BIG = table('sum:∑ prod:∏ int:∫ oint:∮ bigcup:⋃ bigcap:⋂ coprod:∐');

export const LETTERS = table(
    'alpha:α beta:β gamma:γ delta:δ epsilon:ϵ varepsilon:ε zeta:ζ eta:η theta:θ vartheta:ϑ iota:ι kappa:κ lambda:λ mu:μ nu:ν xi:ξ pi:π varpi:ϖ rho:ρ varrho:ϱ ' +
        'sigma:σ varsigma:ς tau:τ upsilon:υ phi:ϕ varphi:φ chi:χ psi:ψ omega:ω Gamma:Γ Delta:Δ Theta:Θ Lambda:Λ Xi:Ξ Pi:Π Sigma:Σ Upsilon:Υ Phi:Φ Psi:Ψ Omega:Ω ell:ℓ hbar:ℏ',
);

/** Function names, set upright with a thin space after. */
export const FUNCTIONS = new Set(['log', 'ln', 'lg', 'exp', 'max', 'min', 'argmax', 'argmin', 'sin', 'cos', 'tan', 'lim', 'arg', 'det', 'Pr', 'sup', 'inf', 'gcd', 'deg', 'dim', 'ker']);

/** Commands that print an operator word with space on both sides: a mod b. */
export const OPERATOR_WORDS: Record<string, string> = { bmod: 'mod', mod: 'mod', pmod: 'mod' };

export const ACCENTS = table('bar:¯ overline:¯ hat:^ widehat:^ tilde:~ widetilde:~ vec:→ dot:˙ ddot:¨');

export const SPACES: Record<string, string> = { ',': '0.17em', ':': '0.22em', ';': '0.28em', ' ': '0.25em', quad: '1em', qquad: '2em', '!': '0em' };

/** Font and style commands: their group's content as plain text, upright or in a variant. */
export const TEXT_COMMANDS: Record<string, string> = { text: 'normal', textrm: 'normal', mathrm: 'normal', operatorname: 'normal', textbf: 'bold', mathbf: 'bold', textit: 'italic', mathit: 'italic', mathcal: 'script', mathbb: 'double-struck' };

/** Commands with nothing to draw. */
export const IGNORED = new Set(['displaystyle', 'textstyle', 'scriptstyle', 'limits', 'nolimits', 'left', 'right', 'big', 'Big', 'bigg', 'Bigg', 'bigl', 'bigr', 'Bigl', 'Bigr']);
