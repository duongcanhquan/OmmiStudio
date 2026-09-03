import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchBrands,
  fetchMotions,
  fetchTemplates,
  generateContent,
  generatePreview as apiGeneratePreview,
  normalizeScriptForm,
  templateTypeToContentType,
  type MotionRecipe,
  type PublishTarget,
  type TemplateMeta,
} from '../api/engine'
import {
  defaultMetaValues,
  defaultParts,
  partsToPrompt,
} from '../lib/scriptForm'
import {
  BRAND_INDUSTRY_LABELS,
  mergeBrandSources,
  type StudioBrand,
} from '../lib/brands'
import {
  getMissingRequiredFields,
  mergeFieldDefaults,
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
  parts: [],
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
            `nền ${brand.palette.background}`,
            `chữ ${brand.palette.text}`,
            `chính ${brand.palette.primary}`,
            `phụ ${brand.palette.secondary}`,
            `nhấn ${brand.palette.accent}`,
          ]
            .filter(Boolean)
            .join(', '),
        }
      : null,
    aiBrief: selection.aiBrief,
    scriptNotes: selection.scriptNotes,
    fields: selection.fieldValues,
    richHtml:
      selection.parts.length > 0
        ? partsToPrompt(type, selection.fieldValues, selection.parts).replace(
            /\n/g,
            '<br/>'
          )
        : selection.richHtml,
  })
}

function fieldsComplete(selection: StudioSelection): boolean {
  return (
    getMissingRequiredFields(selection.selectedTemplate?.type, selection.fieldValues, {
      parts: selection.parts,
    }).length === 0
  )
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
  const [publishTarget, setPublishTarget] = useState<PublishTarget>('local')
  const [driveReady, setDriveReady] = useState(false)
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
        const ready =
          settings.drive.enabled &&
          settings.drive.serviceAccountSet &&
          Boolean(settings.drive.folderId?.trim())
        setDriveReady(ready)
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
        setSelection((prev) => {
          const nextTemplate = prev.selectedTemplate ?? tpl[0] ?? null
          const nextType = nextTemplate?.type
          return {
            ...prev,
            selectedTemplate: nextTemplate,
            selectedBrand: prev.selectedBrand ?? merged[0] ?? null,
            selectedMotion: prev.selectedMotion,
            contentType: prev.selectedTemplate
              ? prev.contentType
              : tpl[0]
                ? templateTypeToContentType(tpl[0].type)
                : 'slide',
            fieldValues: nextType
              ? {
                  ...mergeFieldDefaults(nextType, prev.fieldValues),
                  ...defaultMetaValues(nextType),
                  ...(prev.fieldValues.title
                    ? { title: prev.fieldValues.title }
                    : {}),
                }
              : prev.fieldValues,
            parts:
              prev.parts.length > 0
                ? prev.parts
                : nextType
                  ? defaultParts(nextType)
                  : prev.parts,
          }
        })
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
      // Tab «đã có kịch bản» hoặc sau AI: đủ field mẫu + có nội dung
      return fieldsComplete(selection) && selectionHasContent(selection)
    }
    return false
  }, [step, selection])

  const goNext = useCallback(() => {
    setStep((s) => {
      if (s === 3) {
        setSelection((prev) => ({
          ...prev,
          prompt: resolvePrompt(prev),
        }))
        setResult(INITIAL_RESULT)
        setError(null)
        setRenderPhase('idle')
      }
      return s < 4 ? ((s + 1) as StudioStep) : s
    })
  }, [])

  const goBack = useCallback(() => {
    setStep((s) => (s > 1 ? ((s - 1) as StudioStep) : s))
  }, [])

  const runAiAssist = useCallback(async () => {
    if (!selection.aiBrief.trim() && !selection.scriptNotes.trim()) {
      onNotify?.('Viết brief ngắn (bạn muốn làm gì) rồi bấm AI điền form.', true)
      return
    }
    if (!selection.selectedTemplate) {
      onNotify?.('Chọn mẫu trước.', true)
      return
    }
    setAiAssistLoading(true)
    setError(null)
    try {
      const response = await normalizeScriptForm({
        templateType: selection.selectedTemplate.type,
        brief: [selection.aiBrief, selection.scriptNotes]
          .filter(Boolean)
          .join('\n'),
        fieldValues: selection.fieldValues,
        parts: selection.parts,
        brandName: selection.selectedBrand?.name,
      })
      if (!response.success || !response.parts) {
        throw new Error(response.error || 'AI không điền được form.')
      }
      setSelection((prev) => ({
        ...prev,
        fieldValues: {
          ...prev.fieldValues,
          ...(response.fieldValues ?? {}),
          title:
            response.fieldValues?.title ||
            response.title ||
            prev.fieldValues.title,
        },
        parts: response.parts ?? prev.parts,
      }))
      onNotify?.('AI đã điền từng ô form. Kiểm tra rồi xuất file.')
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
        templateType: selection.selectedTemplate?.type,
        brandId: selection.selectedBrand?.id,
        motionId:
          selection.selectedMotion?.motionType ||
          selection.selectedMotion?.id,
        fieldValues: selection.fieldValues,
        parts: selection.parts,
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

  const handleFinalRender = useCallback(
    async (targetOverride?: PublishTarget) => {
      const prompt = resolvePrompt(selection)
      if (!prompt.trim()) return
      const target = targetOverride ?? publishTarget
      if (target === 'drive' && !driveReady) {
        onNotify?.(
          'Drive chưa sẵn sàng. Cấu hình trong Cài đặt hoặc chọn xuất ra máy này.',
          true
        )
        return
      }

      clearPhaseTimers()
      setRenderLoading(true)
      setError(null)
      setRenderPhase('script')
      onNotify?.('Đang xử lý kịch bản — giữ tab này mở.')
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
        window.setTimeout(() => setRenderPhase('media'), 18000),
        window.setTimeout(() => setRenderPhase('publish'), 28000)
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
          templateType: selection.selectedTemplate?.type,
          brandId: selection.selectedBrand?.id,
          motionId:
            selection.selectedMotion?.motionType ||
            selection.selectedMotion?.id,
          publishTarget: target,
          fieldValues: selection.fieldValues,
          parts: selection.parts,
        })

        if (!response.success || !response.finalOutputPath) {
          throw new Error(response.error || 'Server không trả về file kết quả.')
        }

        setResult((prev) => ({
          ...prev,
          resultUrl: response.finalOutputPath!,
          driveUrl: response.driveUrl ?? null,
          uploadedToDrive: Boolean(response.uploadedToDrive),
          message: response.message ?? null,
        }))
        setRenderPhase('done')
        onNotify?.(
          response.message ||
            (response.uploadedToDrive
              ? 'File hoàn chỉnh đã lên Google Drive.'
              : 'File hoàn chỉnh đã sẵn sàng — bấm Tải về.')
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
    },
    [selection, onNotify, clearPhaseTimers, publishTarget, driveReady]
  )

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
      publishTarget,
      setPublishTarget,
      driveReady,
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
      publishTarget,
      driveReady,
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
                  {step === 1 && '1. Chọn mẫu'}
                  {step === 2 && '2. Chọn thương hiệu'}
                  {step === 3 && '3. Kịch bản / nội dung'}
                  {step === 4 && '4. Đang xử lý & tải file'}
                </h1>
                <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                  Kịch bản chuẩn xong → hệ thống tự dựng file → tải về máy
                </p>
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
