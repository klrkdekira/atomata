// Rebuilds src/data/molecules.json from scripts/molecules.source.json.
//
// Why this indirection: the inspector looks compounds up by the canonical
// isomeric SMILES that src/chem/adapter.ts produces at runtime from the
// player's atom/bond graph. Hand-typing that canonical form is error-prone,
// so instead we author *input* SMILES (whatever's easiest to write correctly)
// and let OpenChemLib canonicalize them the same way the adapter does,
// guaranteeing the keys match.
//
// Run: node scripts/build-molecules-dictionary.mjs
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { Molecule } from 'openchemlib'

const sourcePath = fileURLToPath(new URL('./molecules.source.json', import.meta.url))
const outPath = fileURLToPath(new URL('../src/data/molecules.json', import.meta.url))

const source = JSON.parse(await readFile(sourcePath, 'utf8'))

const dictionary = {}
const seenNames = new Map()
let duplicates = 0

for (const entry of source) {
  const { smiles, ...info } = entry
  const mol = Molecule.fromSmiles(smiles)
  if (!mol) {
    throw new Error(`Could not parse SMILES for "${info.name}": ${smiles}`)
  }
  mol.ensureHelperArrays(0xffffffff)
  mol.validate()
  const canonical = mol.toIsomericSmiles()

  if (dictionary[canonical]) {
    duplicates += 1
    console.warn(
      `Duplicate canonical SMILES "${canonical}" — "${info.name}" collides with "${dictionary[canonical].name}", keeping the first.`,
    )
    continue
  }
  dictionary[canonical] = info
  seenNames.set(info.name, canonical)
}

await writeFile(outPath, `${JSON.stringify(dictionary, null, 2)}\n`)
console.log(`Wrote ${Object.keys(dictionary).length} entries to src/data/molecules.json (${duplicates} duplicates skipped).`)
