# Molecule dictionary

`src/data/molecules.json` is generated, not hand-written. It's a map from
**canonical isomeric SMILES** (as produced by `chem/adapter.ts#canonicalSmiles`,
via OpenChemLib's `toIsomericSmiles()`) to `{ name, iupac?, aliases?, blurb? }`.

## Regenerating

Edit `scripts/molecules.source.json` (plain, easy-to-write SMILES + metadata),
then run:

```sh
node scripts/build-molecules-dictionary.mjs
```

The script parses each source SMILES with OpenChemLib and re-derives its
canonical form, so the generated key always matches what the runtime adapter
would produce for the same structure — no need to hand-guess OCL's
canonicalization. Duplicate canonical forms are reported and skipped (first
entry wins), which also catches accidental synonyms in the source list (e.g.
two different SMILES spellings of the same molecule).

## Expanding via PubChem (post-MVP)

The MVP ships dictionary-only, no runtime API calls (see `chem/namer.ts`'s
`Namer` interface — a `PubChemNamer` can implement the same interface later
without touching the inspector). To grow the dictionary offline:

1. Query PubChem's PUG REST API for a compound's canonical SMILES + IUPAC name,
   e.g. `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/<name>/property/IsomericSMILES,IUPACName/JSON`.
2. Append `{ smiles, name, iupac }` entries to `molecules.source.json`.
3. Re-run the build script above and commit the regenerated `molecules.json`.

Keep entries restricted to what's actually reachable with this game's element
set (H, C, N, O, Na, Cl) — anything else is dead weight in the dictionary.
