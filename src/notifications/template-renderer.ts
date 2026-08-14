import { BadRequestException } from '@nestjs/common';

export class TemplateRenderer {
  private static allowed = new Set([
    'Prenom',
    'Nom',
    'Activite',
    'Date',
    'Heure',
    'Lieu',
    'MinutesRetard',
    'Pupitre',
    'Lien',
  ]);
  static render(template: string, variables: Record<string, string>) {
    return template.replace(/\{([A-Za-z]+)\}/g, (_match, key: string) => {
      if (!this.allowed.has(key))
        throw new BadRequestException(`Unsupported template variable: ${key}`);
      return variables[key] ?? '';
    });
  }
}
