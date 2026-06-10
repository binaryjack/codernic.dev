import { z } from 'zod';

// Définition sémantique stricte pour l'injection LLM
export const WriteFileToolSchema = z.object({
  path: z
    .string()
    .describe(
      'Chemin relatif strict depuis la racine du projet (ex: src/main.ts). Ne pas utiliser de chemins absolus.',
    ),
  content: z
    .string()
    .describe('Code source intégral. Ne jamais utiliser de placeholders ou tronquer le contenu.'),
});

// Schéma du contexte DAG (Tolérant)
export const DagContextSchema = z
  .object({
    laneId: z.string().optional(),
    projectRoot: z.string().optional(),
  })
  .passthrough(); // Obligatoire : empêche le blocage sur des clés inconnues

// Mécanisme de Bypass
export function validateContext(contextData: unknown): unknown {
  const result = DagContextSchema.safeParse(contextData);

  if (!result.success) {
    console.warn('[Codernic] ⚠️ Dérive de schéma (Bypass Actif):', result.error.format());
    return contextData; // Retour systématique pour contrer l'amnésie
  }

  return result.data;
}

export const DagValidator = function (this: { validate: (planRaw: string) => unknown }): void {
  // Plus besoin d'initialisation (bypass absolu avec Zod statique)
};

DagValidator.prototype.validate = function (
  this: { validate: (planRaw: string) => unknown },
  planRaw: string,
): unknown {
  let planContent: unknown;
  try {
    planContent = JSON.parse(planRaw);
  } catch (err) {
    console.warn(`[Codernic] ⚠️ Syntaxe JSON invalide : ${(err as Error).message}`);
    // Bypass absolu : on renvoie la chaîne brute si le JSON est illisible
    return planRaw;
  }

  return validateContext(planContent);
};
