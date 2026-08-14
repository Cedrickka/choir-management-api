import { validateConfig } from './env.validation';
describe('critical configuration',()=>{it('rejects missing secrets',()=>{expect(()=>validateConfig({NODE_ENV:'test'})).toThrow('Configuration invalide')});it('accepts valid values',()=>{expect(validateConfig({DATABASE_URL:'postgresql://localhost/x',JWT_ACCESS_SECRET:'a'.repeat(32),JWT_REFRESH_SECRET:'b'.repeat(32)}).PORT).toBe(3000)})});
