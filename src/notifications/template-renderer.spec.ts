import { BadRequestException } from '@nestjs/common';
import { TemplateRenderer } from './template-renderer';
describe('TemplateRenderer', () => {
  it('renders approved variables', () =>
    expect(
      TemplateRenderer.render('Bonjour {Prenom}, {Activite}', {
        Prenom: 'Jean',
        Activite: 'Répétition',
      }),
    ).toBe('Bonjour Jean, Répétition'));
  it('rejects unknown variables', () =>
    expect(() => TemplateRenderer.render('{Secret}', {})).toThrow(
      BadRequestException,
    ));
});
