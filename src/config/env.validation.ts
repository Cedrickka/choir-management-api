import Joi from 'joi';
const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  CORS_ORIGINS: Joi.string().allow('').default(''),
  REDIS_URL: Joi.string().allow('').default(''),
  ATTENDANCE_QR_SECRET: Joi.string().min(32).allow('').default(''),
  FIREBASE_PROJECT_ID: Joi.string().allow('').default(''),
  FIREBASE_SERVICE_ACCOUNT_BASE64: Joi.string().allow('').default(''),
  LOG_LEVEL: Joi.string().default('info'),
}).unknown(true);
export function validateConfig(config: Record<string, unknown>) {
  const { error, value } = schema.validate(config, { abortEarly: false });
  if (error) throw new Error(`Configuration invalide: ${error.message}`);
  return value;
}
