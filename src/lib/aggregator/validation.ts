// validation.ts — zod schemas for aggregator admin input
// پایگاه خبری راهکار جوان

import { z } from 'zod'

export const newsSourceSchema = z.object({
  name: z.string().min(1, 'نام منبع الزامی است').max(200),
  isActive: z.boolean().default(true),
  rssUrl: z.string().url('آدرس RSS نامعتبر است').optional().or(z.literal('')),
  listingUrl: z.string().url('آدرس لیست نامعتبر است').optional().or(z.literal('')),
  linkSelector: z.string().max(500).optional().or(z.literal('')),
  useSitemap: z.boolean().default(false),
  titleSelector: z.string().max(200).optional().or(z.literal('')),
  bodySelector: z.string().max(200).optional().or(z.literal('')),
  imageSelector: z.string().max(200).optional().or(z.literal('')),
  dateSelector: z.string().max(200).optional().or(z.literal('')),
  categorySelector: z.string().max(200).optional().or(z.literal('')),
  removeSelectors: z.array(z.string()).default([]),
  defaultCategoryId: z.string().optional().or(z.literal('')).nullable(),
  categoryMap: z.record(z.string(), z.string()).default({}),
  videoCategoryId: z.string().optional().or(z.literal('')).nullable(),
  autoPublishVideo: z.boolean().default(true),
  autoPublish: z.boolean().default(true),
  useOriginalDate: z.boolean().default(true),
  addSourceCredit: z.boolean().default(true),
  maxItemsPerRun: z.number().int().min(1).max(200).default(20),
  intervalMinutes: z.number().int().min(1).max(1440).default(20),
  respectRobots: z.boolean().default(true),
})

export type NewsSourceInput = z.infer<typeof newsSourceSchema>

export const replaceRuleSchema = z.object({
  sourceId: z.string().optional().nullable(),
  find: z.string().min(1, 'متن جستجو الزامی است').max(500),
  replaceWith: z.string().max(500).default(''),
  isRegex: z.boolean().default(false),
  caseSensitive: z.boolean().default(false),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
})
export type ReplaceRuleInput = z.infer<typeof replaceRuleSchema>

export const junkRuleSchema = z.object({
  sourceId: z.string().optional().nullable(),
  pattern: z.string().min(1, 'الگو (regex) الزامی است').max(500),
  isActive: z.boolean().default(true),
})
export type JunkRuleInput = z.infer<typeof junkRuleSchema>

export const settingsSchema = z.object({
  siteName: z.string().max(200).optional(),
  minContentLength: z.number().int().min(50).max(10000).optional(),
  requestDelayMs: z.number().int().min(0).max(60000).optional(),
  fetchTimeoutMs: z.number().int().min(1000).max(120000).optional(),
  fetchRetries: z.number().int().min(0).max(10).optional(),
  userAgent: z.string().max(500).optional(),
  maxConsecutiveFailures: z.number().int().min(1).max(50).optional(),
  autoDisableHours: z.number().int().min(1).max(168).optional(),
  defaultIntervalMinutes: z.number().int().min(1).max(1440).optional(),
  defaultMaxItemsPerRun: z.number().int().min(1).max(200).optional(),
  importVideos: z.boolean().optional(),
  importImages: z.boolean().optional(),
  latestOnly: z.boolean().optional(),
})
export type SettingsInput = z.infer<typeof settingsSchema>
