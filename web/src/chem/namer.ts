import { z } from 'zod'

export const MoleculeInfoSchema = z.object({
  name: z.string().min(1),
  iupac: z.string().min(1).optional(),
  aliases: z.array(z.string().min(1)).optional(),
  blurb: z.string().min(1).optional(),
})
export type MoleculeInfo = z.infer<typeof MoleculeInfoSchema>

export const MoleculeDictionarySchema = z.record(z.string(), MoleculeInfoSchema)
export type MoleculeDictionary = z.infer<typeof MoleculeDictionarySchema>

// Keyed by canonical isomeric SMILES (see chem/adapter.ts#canonicalSmiles).
// A miss is intentional flavor ("unknown compound"), not an error state — this
// interface exists so a PubChem-backed Namer can slot in post-MVP without the
// inspector caring which implementation it's talking to.
export interface Namer {
  lookup(smiles: string): MoleculeInfo | null
}

export class DictionaryNamer implements Namer {
  private readonly dictionary: MoleculeDictionary

  constructor(dictionary: MoleculeDictionary) {
    this.dictionary = dictionary
  }

  lookup(smiles: string): MoleculeInfo | null {
    return this.dictionary[smiles] ?? null
  }
}
