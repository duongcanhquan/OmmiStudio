import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchBrands,
  fetchMotions,
  generateContent,
  generatePreview as apiGeneratePreview,
  normalizeScriptForm,
  researchAndWriteScript,
  templateTypeToContentType,
  type MotionRecipe,
  type PublishTarget,
  type TemplateMeta,
} from '../api/engine'
import { partsToPrompt } from '../lib/scriptForm'
import {
  BRAND_INDUSTRY_LABELS,
  mergeBrandSources,
  type StudioBrand,
} from '../lib/brands'
import { defaultLayoutId, layoutById } from '../lib/layoutCatalog'
import {
  CURATED_STUDIO_TEMPLATES,
  defaultsForCatalog,
} from '../lib/templateCatalog'
import {
  getMissingRequiredFields,
  buildStudioPrompt,
  type TemplateFilter,
} from '../lib/templateTypes'
import { cn } from '../lib/utils'
import { BrandPicker } from '../studio/BrandPicker'
import { LayoutPicker } from '../studio/LayoutPicker'
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
  layoutId: undefined,
  selectedMotion: null,
  prompt: '',
  aiBrief: '',
  scriptNotes: '',
  richHtml: '',
  fieldValues: {},
  parts: [],
  voiceRegion: 'south',
  contentType: 'slide',
  projectPhotos: [],
  researchReport: '',
  researchSources: [],
}

const INITIAL_RESULT: StudioResult = {
  resultUrl: null,
  driveUrl: null,
  uploadedToDrive: false,
  message: null,
  previewUrl: null,
  degraded: false,
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
      return 'Không kết nối được engine LYON Studio. Server có đang chạy cổng 3001 không?'
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

function brandPaletteFrom(selection: StudioSelection) {
  const brand = selection.selectedBrand
  if (!brand) return null
  return {
    name: brand.name,
    primary: brand.palette.primary,
    secondary: brand.palette.secondary,
    accent: brand.palette.accent,
    background: brand.palette.background,
    text: brand.palette.text,
  }
}

function layoutKindFrom(selection: StudioSelection) {
  const id =
    selection.layoutId ?? defaultLayoutId(selection.selectedTemplate?.id)
  return layoutById(id)?.kind
}

function brandMediaFrom(selection: StudioSelection) {
  const photos =
    selection.projectPhotos.length > 0
      ? selection.projectPhotos
      : selection.selectedBrand?.photoDataUrls ?? []
  const logo = selection.selectedBrand?.logoDataUrl
  if (!logo && photos.length === 0) return null
  return { logo, photos: photos.slice(0, 3) }
}

function resolvePrompt(selection: StudioSelection): string {
  const type = selection.selectedTemplate?.type ?? 'deck'
  const brand = selection.selectedBrand
  const layout =
    layoutById(selection.layoutId) ??
    layoutById(defaultLayoutId(selection.selectedTemplate?.id))
  return buildStudioPrompt({
    templateType: type,
    templateName: selection.selectedTemplate?.name,
    layoutName: layout?.name,
    layoutHint: layout?.blurb,
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
  const [deepResearchLoading, setDeepResearchLoading] = useState(false)
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
        const [br, mo] = await Promise.all([
          fetchBrands(),
          fetchMotions(),
        ])
        if (cancelled) return
        const tpl = CURATED_STUDIO_TEMPLATES
        const merged = mergeBrandSources(br)
        setTemplates(tpl)
        setBrands(merged)
        setMotions(mo)
        setSelection((prev) => {
          const nextTemplate = prev.selectedTemplate ?? tpl[0] ?? null
          return {
            ...prev,
            selectedTemplate: nextTemplate,
            layoutId:
              prev.layoutId ??
              defaultLayoutId(nextTemplate?.id),
            selectedBrand: prev.selectedBrand ?? merged[0] ?? null,
            selectedMotion: prev.selectedMotion,
            contentType: prev.selectedTemplate
              ? prev.contentType
              : tpl[0]
                ? templateTypeToContentType(
                    tpl[0].type,
                    defaultsForCatalog(tpl[0]).fieldValues
                  )
                : 'slide',
            fieldValues: nextTemplate
              ? {
                  ...defaultsForCatalog(nextTemplate).fieldValues,
                  ...(prev.fieldValues.title
                    ? { title: prev.fieldValues.title }
                    : {}),
                }
              : prev.fieldValues,
            parts:
              prev.parts.length > 0
                ? prev.parts
                : nextTemplate
                  ? defaultsForCatalog(nextTemplate).parts
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
    if (step === 2)
      return Boolean(
        selection.layoutId || defaultLayoutId(selection.selectedTemplate?.id)
      )
    if (step === 3) return Boolean(selection.selectedBrand)
    if (step === 4) {
      return fieldsComplete(selection) && selectionHasContent(selection)
    }
    return false
  }, [step, selection])

  const goNext = useCallback(() => {
    setStep((s) => {
      if (s === 4) {
        setSelection((prev) => ({
          ...prev,
          prompt: resolvePrompt(prev),
        }))
        setResult(INITIAL_RESULT)
        setError(null)
        setRenderPhase('idle')
      }
      return s < 5 ? ((s + 1) as StudioStep) : s
    })
  }, [])

  const goBack = useCallback(() => {
    setStep((s) => (s > 1 ? ((s - 1) as StudioStep) : s))
  }, [])

  const requestPreview = useCallback(
    async (sel: StudioSelection, notifyOk = true) => {
      const prompt = resolvePrompt(sel)
      if (!prompt.trim()) return
      setPreviewLoading(true)
      setError(null)
      setSelection((prev) => ({ ...prev, prompt }))
      try {
        const response = await apiGeneratePreview({
          prompt,
          type: sel.contentType,
          templateId: sel.selectedTemplate?.id,
          templateType: sel.selectedTemplate?.type,
          layoutId:
            sel.layoutId ??
            defaultLayoutId(sel.selectedTemplate?.id),
          layoutKind: layoutKindFrom(sel),
          brandId: sel.selectedBrand?.id,
          motionId: sel.selectedMotion?.motionType || sel.selectedMotion?.id,
          fieldValues: sel.fieldValues,
          parts: sel.parts,
          brandPalette: brandPaletteFrom(sel),
          brandMedia: brandMediaFrom(sel),
        })
        if (!response.success || !response.previewUrl) {
          throw new Error(response.error || 'Xem trước không trả về URL.')
        }
        setResult((prev) => ({ ...prev, previewUrl: response.previewUrl! }))
        if (notifyOk) onNotify?.('Đã tạo xem trước — bản HTML sống có chuyển động.')
      } catch (err) {
        const message = extractErrorMessage(err)
        setError(message)
        onNotify?.(message, true)
      } finally {
        setPreviewLoading(false)
      }
    },
    [onNotify]
  )

  const runAiAssist = useCallback(async () => {
    if (!selection.aiBrief.trim() && !selection.scriptNotes.trim()) {
      onNotify?.('Viết brief ngắn (bạn muốn làm gì) rồi bấm AI điền form.', true)
      return false
    }
    if (!selection.selectedTemplate) {
      onNotify?.('Chọn mẫu trước.', true)
      return false
    }
    setAiAssistLoading(true)
    setError(null)
    try {
      const response = await normalizeScriptForm({
        templateType: selection.selectedTemplate.type,
        templateId: selection.selectedTemplate.id,
        layoutId:
          selection.layoutId ??
          defaultLayoutId(selection.selectedTemplate.id),
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
      const incoming: Record<string, string> = {
        ...(response.fieldValues ?? {}),
      }
      const keep = [
        'outputFormat',
        'size',
        'aspect',
        'postType',
        'platform',
        'paper',
      ]
      const fieldValues: Record<string, string> = {
        ...selection.fieldValues,
        ...incoming,
        title: incoming.title || response.title || selection.fieldValues.title,
      }
      for (const key of keep) {
        if (!incoming[key]?.trim() && selection.fieldValues[key]) {
          fieldValues[key] = selection.fieldValues[key]
        }
      }
      const nextSelection: StudioSelection = {
        ...selection,
        fieldValues,
        parts: response.parts ?? selection.parts,
      }
      setSelection(nextSelection)
      onNotify?.('AI đã điền form — đang mở bản xem trước sống.')
      void requestPreview(nextSelection, false)
      return true
    } catch (err) {
      const message = extractErrorMessage(err)
      setError(message)
      onNotify?.(message, true)
      return false
    } finally {
      setAiAssistLoading(false)
    }
  }, [selection, onNotify, requestPreview])

  const applyFilledForm = useCallback(
    (
      response: {
        title?: string
        fieldValues?: Record<string, string>
        parts?: StudioSelection['parts']
      },
      extra?: Partial<StudioSelection>
    ) => {
      const incoming: Record<string, string> = {
        ...(response.fieldValues ?? {}),
      }
      const keep = [
        'outputFormat',
        'size',
        'aspect',
        'postType',
        'platform',
        'paper',
      ]
      const fieldValues: Record<string, string> = {
        ...selection.fieldValues,
        ...incoming,
        title: incoming.title || response.title || selection.fieldValues.title,
      }
      for (const key of keep) {
        if (!incoming[key]?.trim() && selection.fieldValues[key]) {
          fieldValues[key] = selection.fieldValues[key]
        }
      }
      return {
        ...selection,
        fieldValues,
        parts: response.parts ?? selection.parts,
        ...extra,
      } satisfies StudioSelection
    },
    [selection]
  )

  const runDeepResearch = useCallback(
    async (opts?: { depth?: number; breadth?: number }) => {
      if (!selection.aiBrief.trim() && !selection.scriptNotes.trim()) {
        onNotify?.('Viết ý tưởng rồi bấm nghiên cứu sâu.', true)
        return false
      }
      if (!selection.selectedTemplate) {
        onNotify?.('Chọn mẫu trước.', true)
        return false
      }
      setDeepResearchLoading(true)
      setError(null)
      try {
        const response = await researchAndWriteScript({
          templateType: selection.selectedTemplate.type,
          templateId: selection.selectedTemplate.id,
          layoutId:
            selection.layoutId ??
            defaultLayoutId(selection.selectedTemplate.id),
          brief: [selection.aiBrief, selection.scriptNotes]
            .filter(Boolean)
            .join('\n'),
          fieldValues: selection.fieldValues,
          parts: selection.parts,
          brandName: selection.selectedBrand?.name,
          breadth: opts?.breadth ?? 2,
          depth: opts?.depth ?? 1,
        })
        if (!response.success || !response.parts) {
          throw new Error(response.error || 'Nghiên cứu chưa viết được kịch bản.')
        }
        const nextSelection = applyFilledForm(response, {
          researchReport: response.researchReport || '',
          researchSources: response.researchSources ?? [],
        })
        setSelection(nextSelection)
        onNotify?.(
          response.message ||
            'Đã nghiên cứu nguồn rồi viết kịch bản — kiểm tra rồi xem trước.'
        )
        void requestPreview(nextSelection, false)
        return true
      } catch (err) {
        const message = extractErrorMessage(err)
        setError(message)
        onNotify?.(message, true)
        return false
      } finally {
        setDeepResearchLoading(false)
      }
    },
    [selection, onNotify, requestPreview, applyFilledForm]
  )

  const handleGeneratePreview = useCallback(async () => {
    await requestPreview(selection)
  }, [selection, requestPreview])

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
          layoutId:
            selection.layoutId ??
            defaultLayoutId(selection.selectedTemplate?.id),
          layoutKind: layoutKindFrom(selection),
          brandId: selection.selectedBrand?.id,
          motionId:
            selection.selectedMotion?.motionType ||
            selection.selectedMotion?.id,
          publishTarget: target,
          fieldValues: selection.fieldValues,
          parts: selection.parts,
          brandPalette: brandPaletteFrom(selection),
          brandMedia: brandMediaFrom(selection),
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
          degraded: Boolean(response.degraded),
        }))
        setRenderPhase('done')
        onNotify?.(
          response.degraded
            ? response.message ||
                'Đã có file HTML. Nếu cần MP4/PDF, xuất lại sau khi máy nhận Chrome/FFmpeg.'
            : response.message ||
                (response.uploadedToDrive
                  ? 'File hoàn chỉnh đã lên Google Drive.'
                  : 'File hoàn chỉnh đã sẵn sàng — bấm Tải về.'),
          Boolean(response.degraded)
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
      runDeepResearch,
      aiAssistLoading,
      deepResearchLoading,
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
      runDeepResearch,
      aiAssistLoading,
      deepResearchLoading,
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
                  LYON Studio
                </p>
                <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
                  {step === 1 && '1. Chọn loại sản phẩm'}
                  {step === 2 && '2. Chọn bố cục có sẵn'}
                  {step === 3 && '3. Màu sắc và style'}
                  {step === 4 && '4. Kịch bản / nội dung'}
                  {step === 5 && '5. Chạy và tải file'}
                </h1>
                <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                  Loại → bố cục → màu / style → kịch bản → chạy
                </p>
              </div>
              <ol className="flex items-center gap-1.5" aria-label="Tiến trình">
                {([1, 2, 3, 4, 5] as const).map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => {
                        if (s === 5 && !fieldsComplete(selection)) return
                        if (s === 5 && !selectionHasContent(selection)) return
                        setStep(s)
                      }}
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
                {step === 2 && <LayoutPicker />}
                {step === 3 && <BrandPicker />}
                {step === 4 && <ContentMotionPane />}
                {step === 5 && <FinalExport />}
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
