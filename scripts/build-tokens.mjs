import StyleDictionary from 'style-dictionary';

// Emits a Tailwind v4 `@theme` block. Token paths map straight onto Tailwind's
// namespaces (color/font/text/spacing/radius/shadow/container/breakpoint), so
// `color.brand.500` becomes `--color-brand-500` and yields `bg-brand-500`.
StyleDictionary.registerFormat({
  name: 'tailwind/theme',
  format: ({ dictionary }) => {
    const lines = dictionary.allTokens.map((token) => {
      const value = token.$value ?? token.value;
      return `  --${token.name}: ${value};`;
    });

    return [
      '/*',
      ' * GENERATED FILE — DO NOT EDIT.',
      ' * Source: tokens/*.json  ·  Regenerate: npm run dev | build | verify',
      ' */',
      '',
      // `static` stops Tailwind tree-shaking unused theme variables. Components
      // reference tokens through var() directly (Prose, Section), so a variable
      // with no matching utility class must still reach the stylesheet.
      '@theme static {',
      ...lines,
      '}',
      '',
    ].join('\n');
  },
});

const sd = new StyleDictionary({
  source: ['tokens/**/*.json'],
  usesDtcg: true,
  log: { verbosity: 'silent' },
  platforms: {
    tailwind: {
      // Deliberately minimal: only kebab-case naming. Value strings are already
      // valid CSS, so unit-rewriting transforms would only corrupt clamp().
      transforms: ['name/kebab'],
      buildPath: 'src/styles/',
      files: [{ destination: 'theme.css', format: 'tailwind/theme' }],
    },
  },
});

await sd.buildAllPlatforms();
console.log('✓ tokens → src/styles/theme.css');
