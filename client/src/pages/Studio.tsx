import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchBrands,
  fetchMotions,
  fetchTemplates,
  generateContent,
  generatePreview as apiGeneratePreview,
  templateTypeToContentType,
  type MotionRecipe,
  type TemplateMeta,
} from '../api/engine'
import {
  BRAND_INDUSTRY_LABELS,
  mergeBrandSources,
  type StudioBrand,
} from '../lib/brands'
import {
  REQUIRED_FIELDS_BY_TYPE,
  buildStudioPrompt,
  type TemplateFilter,
} from '../lib/templateTypes'
import { cn } from '../lib/utils'
import { BrandPicker } from '../studio/BrandPicker'
import { ContentMotionPane } from '../studio/ContentMotionPane'
import { FinalExport } from '../studio/FinalExport'
import { FloatingActionBar } from '../studio/FloatingActionBar'
import {
  StudioContext,
  selectionHasContent,
  type RenderPhase,
  type StudioResult,
  type StudioSelection,
  type StudioStep,
} from '../studio/StudioContext'
import { TemplateGallery } from '../studio/TemplateGallery'
import { fetchSettings } from '../api/settings'

interface StudioPageProps {
  onNotify?: (message: string, isError?: boolean) => void
  jumpStep?: StudioStep | null
  onJumpConsumed?: () => void
}

const INITIAL_SELECTION: StudioSelection = {
  selectedTemplate: null,
  selectedBrand: null,
  selectedMotion: null,
  prompt: '',
  aiBrief: '',
  scriptNotes: '',
  richHtml: '',
  fieldValues: {},
  voiceRegion: 'south',
  contentType: 'slide',
}

const INITIAL_RESULT: StudioResult = {
  resultUrl: null,
  driveUrl: null,
  uploadedToDrive: false,
  message: null,
  previewUrl: null,
}

function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: string; message?: string }
      | undefined
    if (err.code === 'ECONNABORTED') {
      return 'Hết thời gian chờ. Render có thể vẫn đang chạy trên server — kiểm tra workspaces hoặc thử lại.'
    }
    if (!err.response) {
      return 'Không kết nối được engine OmniStudio. Server có đang chạy cổng 3001 không?'
    }
    return (
      data?.error ||
      data?.message ||
      err.message ||
      `Lỗi yêu cầu (${err.response.status})`
    )
  }
  if (err instanceof Error) return err.message
  return 'Lỗi không xác định.'
}

function resolvePrompt(selection: StudioSelection): string {
  const type = selection.selectedTemplate?.type ?? 'deck'
  const brand = selection.selectedBrand
  return buildStudioPrompt({
    templateType: type,
    templateName: selection.selectedTemplate?.name,
    brand: brand
      ? {
          name: brand.name,
          industry: BRAND_INDUSTRY_LABELS[brand.industry] ?? brand.industry,
          tone: brand.voice.tone,
          personality: brand.voice.keywords?.length
            ? brand.voice.keywords.join(', ')
            : brand.description,
          doSay: brand.voice.doSay,
          dontSay: brand.voice.dontSay,
          fonts: `${brand.typography.heading} / ${brand.typography.body}`,
          colors: [
            brand.palette.primary,
            brand.palette.secondary,
            brand.palette.accent,
          ]
            .filter(Boolean)
            .join(', '),
        }
      : null,
    aiBrief: selection.aiBrief,
    scriptNotes: selection.scriptNotes,
    fields: selection.fieldValues,
    richHtml: selection.richHtml,
  })
}

function fieldsComplete(selection: StudioSelection): boolean {
  const type = selection.selectedTemplate?.type
  if (!type) return false
  const req = REQUIRED_FIELDS_BY_TYPE[type] ?? []
  return req
    .filter((f) => f.required)
    .every((f) => Boolean((selection.fieldValues[f.key] ?? '').trim()))
}

export function StudioPage({
  onNotify,
  jumpStep,
  onJumpConsumed,
}: StudioPageProps) {
  const [step, setStep] = useState<StudioStep>(1)
  const [selection, setSelection] = useState<StudioSelection>(INITIAL_SELECTION)
  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [brands, setBrands] = useState<StudioBrand[]>([])
  const [motions, setMotions] = useState<MotionRecipe[]>([])
  const [assetsLoading, setAssetsLoading] = useState(true)
  const [assetsError, setAssetsError] = useState<string | null>(null)
  const [templateFilter, setTemplateFilter] = useState<TemplateFilter>('all')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [aiAssistLoading, setAiAssistLoading] = useState(false)
  const [renderLoading, setRenderLoading] = useState(false)
  const [renderPhase, setRenderPhase] = useState<RenderPhase>('idle')
  const [result, setResult] = useState<StudioResult>(INITIAL_RESULT)
  const [error, setError] = useState<string | null>(null)
  const phaseTimers = useRef<number[]>([])

  const clearPhaseTimers = useCallback(() => {
    for (const id of phaseTimers.current) window.clearTimeout(id)
    phaseTimers.current = []
  }, [])

  useEffect(() => () => clearPhaseTimers(), [clearPhaseTimers])

  useEffect(() => {
    if (jumpStep) {
      setStep(jumpStep)
      onJumpConsumed?.()
    }
  }, [jumpStep, onJumpConsumed])

  // Giọng mặc định từ Settings + brand được chọn từ trang Thương hiệu
  useEffect(() => {
    let cancelled = false
    async function hydrateFromSettings() {
      try {
        const settings = await fetchSettings()
        if (cancelled) return
        setSelection((prev) => ({
          ...prev,
          voiceRegion: settings.system.defaultVoice,
        }))
      } catch {
        /* ignore */
      }
    }
    void hydrateFromSettings()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!brands.length) return
    try {
      const pending = sessionStorage.getItem('omnistudio.pendingBrandId')
      if (!pending) return
      sessionStorage.removeItem('omnistudio.pendingBrandId')
      const brand = brands.find((b) => b.id === pending)
      if (brand) {
        setSelection((prev) => ({ ...prev, selectedBrand: brand }))
      }
    } catch {
      /* ignore */
    }
  }, [brands])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setAssetsLoading(true)
      setAssetsError(null)
      try {
        const [tpl, br, mo] = await Promise.all([
          fetchTemplates(),
          fetchBrands(),
          fetchMotions(),
        ])
        if (cancelled) return
        const merged = mergeBrandSources(br)
        setTemplates(tpl)
        setBrands(merged)
        setMotions(mo)
        setSelection((prev) => ({
          ...prev,
          selectedTemplate: prev.selectedTemplate ?? tpl[0] ?? null,
          selectedBrand: prev.selectedBrand ?? merged[0] ?? null,
          selectedMotion: prev.selectedMotion,
          contentType: prev.selectedTemplate
            ? prev.contentType
            : tpl[0]
              ? templateTypeToContentType(tpl[0].type)
              : 'slide',
        }))
      } catch (err) {
        if (cancelled) return
        setAssetsError(
          err instanceof Error
            ? err.message
            : 'Không tải được tài nguyên Studio'
        )
        const merged = mergeBrandSources([])
        setBrands(merged)
      } finally {
        if (!cancelled) setAssetsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const patchSelection = useCallback((patch: Partial<StudioSelection>) => {
    setSelection((prev) => ({ ...prev, ...patch }))
  }, [])

  const upsertBrand = useCallback((brand: StudioBrand) => {
    setBrands((prev) => {
      const i = prev.findIndex((b) => b.id === brand.id)
      if (i === -1) return [...prev, brand].sort((a, b) =>
        a.name.localeCompare(b.name, 'vi')
      )
      const next = [...prev]
      next[i] = brand
      return next
    })
  }, [])

  const removeBrand = useCallback((id: string) => {
    setBrands((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const canGoNext = useMemo(() => {
    if (step === 1) return Boolean(selection.selectedTemplate)
    if (step === 2) return Boolean(selection.selectedBrand)
    if (step === 3) {
      return (
        fieldsComplete(selection) &&
        Boolean(selection.aiBrief.trim()) &&
        selectionHasContent(selection)
      )
    }
    return false
  }, [step, selection])

  const goNext = useCallback(() => {
    setStep((s) => {
      if (s === 3) {
        // Cache prompt trước khi sang xuất bản — FinalExport / server đều dùng
        setSelection((prev) => ({
          ...prev,
          prompt: resolvePrompt(prev),
        }))
      }
      return s < 4 ? ((s + 1) as StudioStep) : s
    })
  }, [])

  const goBack = useCallback(() => {
    setStep((s) => (s > 1 ? ((s - 1) as StudioStep) : s))
  }, [])

  const runAiAssist = useCallback(async () => {
    if (!fieldsComplete(selection)) {
      onNotify?.('Vui lòng điền đủ các trường bắt buộc trước.', true)
      return
    }
    setAiAssistLoading(true)
    setError(null)
    try {
      const prompt = resolvePrompt(selection)
      const response = await apiGeneratePreview({
        prompt,
        type: selection.contentType,
        templateId: selection.selectedTemplate?.id,
        brandId: selection.selectedBrand?.id,
        motionId:
          selection.selectedMotion?.motionType ||
          selection.selectedMotion?.id,
      })
      if (!response.success) {
        throw new Error(response.error || 'AI không trả về kết quả.')
      }

      const script = response.script as
        | {
            title?: string
            scenes?: Array<{
              sceneId?: number
              visualText?: string
              voiceoverText?: string
            }>
          }
        | undefined

      let rich = ''
      if (script?.title) {
        rich += `<p><strong>${script.title}</strong></p>`
      }
      if (script?.scenes?.length) {
        rich += '<ol>'
        for (const scene of script.scenes) {
          const visual = scene.visualText || ''
          const vo = scene.voiceoverText || ''
          rich += `<li><p>${visual}</p>${vo ? `<p><em>Voice: ${vo}</em></p>` : ''}</li>`
        }
        rich += '</ol>'
      } else {
        rich = `<p>${prompt.replace(/\n/g, '<br/>')}</p>`
      }

      setSelection((prev) => ({
        ...prev,
        prompt,
        richHtml: rich,
      }))
      if (response.previewUrl) {
        setResult((prev) => ({ ...prev, previewUrl: response.previewUrl! }))
      }
      onNotify?.('AI đã viết kịch bản — kiểm tra editor và xem trước.')
    } catch (err) {
      const message = extractErrorMessage(err)
      setError(message)
      onNotify?.(message, true)
    } finally {
      setAiAssistLoading(false)
    }
  }, [selection, onNotify])

  const handleGeneratePreview = useCallback(async () => {
    const prompt = resolvePrompt(selection)
    if (!prompt.trim()) return
    setPreviewLoading(true)
    setError(null)
    setSelection((prev) => ({ ...prev, prompt }))
    try {
      const response = await apiGeneratePreview({
        prompt,
        type: selection.contentType,
        templateId: selection.selectedTemplate?.id,
        brandId: selection.selectedBrand?.id,
        motionId:
          selection.selectedMotion?.motionType ||
          selection.selectedMotion?.id,
      })
      if (!response.success || !response.previewUrl) {
        throw new Error(response.error || 'Xem trước không trả về URL.')
      }
      setResult((prev) => ({ ...prev, previewUrl: response.previewUrl! }))
      onNotify?.('Đã tạo xem trước.')
    } catch (err) {
      const message = extractErrorMessage(err)
      setError(message)
      onNotify?.(message, true)
    } finally {
      setPreviewLoading(false)
    }
  }, [selection, onNotify])

  const handleFinalRender = useCallback(async () => {
    const prompt = resolvePrompt(selection)
    if (!prompt.trim()) return
    clearPhaseTimers()
    setRenderLoading(true)
    setError(null)
    setRenderPhase('script')
    setSelection((prev) => ({ ...prev, prompt }))
    setResult((prev) => ({
      ...prev,
      resultUrl: null,
      driveUrl: null,
      uploadedToDrive: false,
      message: null,
    }))

    phaseTimers.current.push(
      window.setTimeout(() => setRenderPhase('html'), 4000),
      window.setTimeout(() => setRenderPhase('motion'), 10000),
      window.setTimeout(() => setRenderPhase('media'), 18000)
    )

    try {
      const response = await generateContent({
        prompt,
        type: selection.contentType,
        voiceRegion:
          selection.contentType === 'video'
            ? selection.voiceRegion
            : undefined,
        templateId: selection.selectedTemplate?.id,
        brandId: selection.selectedBrand?.id,
        motionId:
          selection.selectedMotion?.motionType ||
          selection.selectedMotion?.id,
      })

      if (!response.success || !response.finalOutputPath) {
        throw new Error(response.error || 'Server không trả về file kết quả.')
      }

      setResult((prev) => ({
        ...prev,
        resultUrl: response.finalOutputPath!,
        driveUrl: response.driveUrl ?? response.finalOutputPath!,
        uploadedToDrive: Boolean(response.uploadedToDrive),
        message: response.message ?? null,
      }))
      setRenderPhase('done')
      onNotify?.(
        response.message ||
          (response.uploadedToDrive
            ? 'Đã tải lên Google Drive.'
            : 'Render hoàn tất.')
      )
    } catch (err) {
      const message = extractErrorMessage(err)
      setError(message)
      setRenderPhase('error')
      onNotify?.(message, true)
    } finally {
      clearPhaseTimers()
      setRenderLoading(false)
    }
  }, [selection, onNotify, clearPhaseTimers])

  const ctxValue = useMemo(
    () => ({
      step,
      setStep,
      selection,
      patchSelection,
      templates,
      brands,
      motions,
      assetsLoading,
      assetsError,
      templateFilter,
      setTemplateFilter,
      previewLoading,
      renderLoading,
      renderPhase,
      result,
      error,
      generatePreview: handleGeneratePreview,
      finalRender: handleFinalRender,
      canGoNext,
      goNext,
      goBack,
      upsertBrand,
      removeBrand,
      runAiAssist,
      aiAssistLoading,
    }),
    [
      step,
      selection,
      patchSelection,
      templates,
      brands,
      motions,
      assetsLoading,
      assetsError,
      templateFilter,
      previewLoading,
      renderLoading,
      renderPhase,
      result,
      error,
      handleGeneratePreview,
      handleFinalRender,
      canGoNext,
      goNext,
      goBack,
      upsertBrand,
      removeBrand,
      runAiAssist,
      aiAssistLoading,
    ]
  )

  return (
    <StudioContext.Provider value={ctxValue}>
      <div className="relative flex min-h-0 flex-1 flex-col bg-slate-950">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.07),_transparent_55%)]"
          aria-hidden
        />

        <div className="relative flex min-h-0 flex-1 flex-col pb-24">
          <div className="border-b border-slate-800/80 px-4 py-3 sm:px-5 lg:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-cyan-400/80">
                  Studio sáng tạo
                </p>
                <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
                  {step === 1 && 'Chọn mẫu'}
                  {step === 2 && 'Thương hiệu'}
                  {step === 3 && 'Soạn thảo & AI'}
                  {step === 4 && 'Xuất bản'}
                </h1>
              </div>
              <ol className="flex items-center gap-1.5" aria-label="Tiến trình">
                {([1, 2, 3, 4] as const).map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => setStep(s)}
                      className={cn(
                        'flex size-8 cursor-pointer items-center justify-center rounded-full text-xs font-semibold transition-colors',
                        step === s
                          ? 'bg-cyan-500 text-slate-950'
                          : s < step
                            ? 'bg-cyan-500/20 text-cyan-200'
                            : 'bg-slate-800 text-slate-500'
                      )}
                      aria-current={step === s ? 'step' : undefined}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
            {assetsError && (
              <p className="mt-2 text-xs text-amber-400" role="status">
                Cảnh báo: {assetsError}
              </p>
            )}
          </div>

          <div className="studio-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 lg:px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className="h-full w-full"
              >
                {step === 1 && <TemplateGallery />}
                {step === 2 && <BrandPicker />}
                {step === 3 && <ContentMotionPane />}
                {step === 4 && <FinalExport />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <FloatingActionBar />
      </div>
    </StudioContext.Provider>
  )
}

export default StudioPage
