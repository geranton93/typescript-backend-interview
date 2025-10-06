import { z } from 'zod'

const AppConfigSchema = z.object({
  api: z.object({
    apiPort: z.coerce.number().default(3000),
  }),
  database: z.object({
    url: z.string().min(1, 'DATABASE_URL is required'),
  }),
})

export type AppConfigType = z.infer<typeof AppConfigSchema>

export default (): Promise<AppConfigType> => {
  const configObject: AppConfigType = {
    api: {
      apiPort: Number(process.env.PORT) || 3000,
    },
    database: {
      url: process.env.DATABASE_URL ?? '',
    },
  }

  return AppConfigSchema.parseAsync(configObject)
}
