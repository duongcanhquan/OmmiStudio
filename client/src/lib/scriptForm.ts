import type { TemplateType } from './templateTypes'

export type ScriptPartRole =
  | 'hook'
  | 'body'
  | 'cta'
  | 'slide'
  | 'section'
  | 'item'

export interface ScriptPart {
  id: string
  role: ScriptPartRole
  title: string
  body: string
  notes?: string
}

export type ExportKind = 'video' | 'html' | 'pdf' | 'image'

export interface ScriptMetaField {
  key: string
  label: string
  options?: { value: string; label: string }[]
}

function uid(): string {
  return `part-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function exportKindForType(
  type: TemplateType,
  fieldValues?: Record<string, string>
): ExportKind {
  if (type === 'video') return 'video'
  if (type === 'social') {
    return fieldValues?.outputFormat === 'video' ? 'video' : 'image'
  }
  if (
    type === 'document' ||
    type === 'newsletter' ||
    type === 'resume' ||
    type === 'brochure' ||
    type === 'event' ||
    type === 'worksheet' ||
    type === 'quiz'
  ) {
    return 'pdf'
  }
  return 'html'
}

export function maxPartsForType(type: TemplateType): number {
  if (type === 'video' || type === 'social') return 12
  if (type === 'deck') return 20
  if (
    type === 'poster' ||
    type === 'landing' ||
    type === 'infographic' ||
    type === 'certificate' ||
    type === 'event'
  ) {
    return 6
  }
  if (type === 'resume') return 12
  if (type === 'worksheet' || type === 'quiz') return 20
  return 16
}

export function defaultRoleForType(type: TemplateType): ScriptPartRole {
  if (type === 'video' || type === 'social') return 'body'
  if (type === 'deck') return 'slide'
  if (type === 'worksheet' || type === 'quiz' || type === 'resume') return 'item'
  return 'section'
}

export function partLabel(type: TemplateType, part: ScriptPart, index: number): string {
  if (part.role === 'hook') return 'Mở đầu'
  if (part.role === 'cta') return 'Kêu gọi hành động'
  if (type === 'video') return `Cảnh ${index + 1}`
  if (type === 'social') return `Khung ${index + 1}`
  if (type === 'deck') return `Slide ${index + 1}`
  if (type === 'quiz' || type === 'worksheet') return `Câu ${index + 1}`
  return `Phần ${index + 1}`
}

export function defaultParts(type: TemplateType): ScriptPart[] {
  if (type === 'video') {
    return [
      {
        id: uid(),
        role: 'hook',
        title: 'Chọn trường cho con không chỉ là chọn điểm',
        body: 'Một câu mở — rõ, tiếng Việt.',
        notes: 'Chọn trường cho con không chỉ là chọn điểm.',
      },
      {
        id: uid(),
        role: 'body',
        title: 'Ba lợi ích',
        body: 'Đồng hành · thực hành · việc làm',
        notes: 'Ba lợi ích: đồng hành, thực hành, việc làm.',
      },
      {
        id: uid(),
        role: 'cta',
        title: 'Đăng ký ngày hội mở cửa',
        body: 'Giữ chỗ buổi tham quan campus.',
        notes: 'Đăng ký ngày hội mở cửa hôm nay.',
      },
    ]
  }
  if (type === 'deck') {
    return [
      {
        id: uid(),
        role: 'slide',
        title: 'Chào tân sinh viên',
        body: 'Ba điều sẽ biết hôm nay: lịch học, hỗ trợ, việc làm.',
      },
      {
        id: uid(),
        role: 'slide',
        title: 'Lịch học kỳ',
        body: 'Tuần định hướng · đăng ký môn · gặp cố vấn.',
      },
      {
        id: uid(),
        role: 'slide',
        title: 'Hỏi đáp',
        body: 'Gặp cố vấn tại sảnh A sau buổi này.',
      },
    ]
  }
  if (
    type === 'social' ||
    type === 'poster' ||
    type === 'landing' ||
    type === 'infographic' ||
    type === 'certificate' ||
    type === 'event'
  ) {
    return [
      {
        id: uid(),
        role: 'hook',
        title: 'Ngày hội mở cửa 12/09',
        body: 'Tham quan campus · gặp giảng viên · tư vấn ngành học.',
      },
      {
        id: uid(),
        role: 'body',
        title: 'Thời gian & địa điểm',
        body: '8:00–16:00 · Hội trường A · Miễn phí đăng ký.',
      },
      {
        id: uid(),
        role: 'cta',
        title: 'Giữ chỗ ngay',
        body: 'Quét QR hoặc nhắn tin fanpage.',
      },
    ]
  }
  if (type === 'resume') {
    return [
      {
        id: uid(),
        role: 'item',
        title: 'Nguyễn Minh Anh — Giáo vụ',
        body: 'Ứng tuyển chuyên viên tuyển sinh. 5 năm đồng hành phụ huynh.',
      },
      {
        id: uid(),
        role: 'item',
        title: 'Kinh nghiệm',
        body: 'Tổ chức 12 ngày hội mở cửa · phụ trách tư vấn ngành.',
      },
      {
        id: uid(),
        role: 'item',
        title: 'Kỹ năng',
        body: 'Tư vấn · thuyết trình · Excel · tiếng Anh B2.',
      },
    ]
  }
  if (type === 'worksheet' || type === 'quiz') {
    return [
      {
        id: uid(),
        role: 'item',
        title: 'Câu 1',
        body: 'Thì hiện tại đơn dùng để nói việc gì? Nêu 1 ví dụ.',
      },
      {
        id: uid(),
        role: 'item',
        title: 'Câu 2',
        body: 'Chọn đáp án đúng: She ___ to school every day. (go / goes)',
      },
      {
        id: uid(),
        role: 'item',
        title: 'Câu 3',
        body: 'Viết lại câu phủ định: They play football on Sunday.',
      },
    ]
  }
  return [
    {
      id: uid(),
      role: 'section',
      title: 'Tóm tắt',
      body: 'Phụ huynh cần nhìn đồng hành và việc làm, không chỉ điểm đầu vào.',
    },
    {
      id: uid(),
      role: 'section',
      title: 'Ba lợi ích',
      body: 'Đồng hành học tập, thực hành nghề, hỗ trợ việc làm sau tốt nghiệp.',
    },
    {
      id: uid(),
      role: 'section',
      title: 'Bước tiếp theo',
      body: 'Đăng ký ngày hội mở cửa để tham quan và gặp cố vấn.',
    },
  ]
}

export function metaFieldsForType(
  type: TemplateType,
  fieldValues?: Record<string, string>
): ScriptMetaField[] {
  const title: ScriptMetaField = { key: 'title', label: 'Tiêu đề sản phẩm' }
  if (type === 'social') {
    const asVideo = fieldValues?.outputFormat === 'video'
    return [
      title,
      {
        key: 'outputFormat',
        label: 'File xuất',
        options: [
          { value: 'image', label: 'Ảnh tĩnh — PNG để đăng' },
          { value: 'video', label: 'Video chữ động — MP4' },
        ],
      },
      {
        key: 'platform',
        label: 'Nền tảng',
        options: [
          { value: 'instagram', label: 'Instagram' },
          { value: 'facebook', label: 'Facebook' },
          { value: 'tiktok', label: 'TikTok' },
          { value: 'zalo', label: 'Zalo' },
          { value: 'youtube-shorts', label: 'YouTube Shorts' },
        ],
      },
      {
        key: 'aspect',
        label: 'Tỷ lệ khung hình',
        options: [
          { value: '1:1', label: '1:1 vuông — bài đăng' },
          { value: '3:4', label: '3:4 — thẻ kiến thức' },
          { value: '4:5', label: '4:5 — bảng tin dọc' },
          { value: '9:16', label: '9:16 dọc — Story' },
        ],
      },
      ...(asVideo
        ? [
            {
              key: 'duration',
              label: 'Thời lượng gợi ý (giây)',
              options: [
                { value: '15', label: '15 giây' },
                { value: '30', label: '30 giây' },
                { value: '45', label: '45 giây' },
                { value: '60', label: '60 giây' },
              ],
            },
          ]
        : []),
    ]
  }
  if (type === 'video') {
    return [
      title,
      {
        key: 'aspect',
        label: 'Tỷ lệ khung hình',
        options: [
          { value: '16:9', label: '16:9 ngang' },
          { value: '9:16', label: '9:16 dọc' },
          { value: '1:1', label: '1:1 vuông' },
        ],
      },
      {
        key: 'duration',
        label: 'Thời lượng gợi ý (giây)',
        options: [
          { value: '15', label: '15 giây' },
          { value: '30', label: '30 giây' },
          { value: '45', label: '45 giây' },
          { value: '60', label: '60 giây' },
        ],
      },
    ]
  }
  if (type === 'deck') {
    return [
      title,
      {
        key: 'aspect',
        label: 'Tỷ lệ trình chiếu',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '4:3', label: '4:3' },
        ],
      },
    ]
  }
  if (exportKindForType(type) === 'pdf') {
    return [
      title,
      {
        key: 'paper',
        label: 'Khổ giấy',
        options: [
          { value: 'A4', label: 'A4' },
          { value: 'Letter', label: 'Letter' },
        ],
      },
    ]
  }
  return [
    title,
    {
      key: 'aspect',
      label: 'Khổ / hướng',
      options: [
        { value: '16:9', label: '16:9 ngang' },
        { value: '9:16', label: '9:16 dọc' },
        { value: '1:1', label: '1:1' },
        { value: 'A4', label: 'A4 dọc' },
      ],
    },
  ]
}

export function defaultMetaValues(type: TemplateType): Record<string, string> {
  const values: Record<string, string> = {}
  for (const field of metaFieldsForType(type)) {
    if (field.options?.[0]) values[field.key] = field.options[0].value
  }
  if (!values.title) {
    if (type === 'video' || type === 'social') values.title = 'Chọn trường cho con'
    else if (type === 'deck') values.title = 'Định hướng tân sinh viên'
    else if (type === 'resume') values.title = 'Hồ sơ ứng tuyển'
    else values.title = 'Ngày hội mở cửa'
  }
  return values
}

export function partHasContent(part: ScriptPart): boolean {
  return Boolean(part.title.trim() || part.body.trim() || part.notes?.trim())
}

export function formIsReady(
  type: TemplateType | undefined,
  fieldValues: Record<string, string>,
  parts: ScriptPart[]
): { ok: boolean; missing: string[] } {
  const missing: string[] = []
  if (!type) {
    return { ok: false, missing: ['Mẫu'] }
  }
  if (!fieldValues.title?.trim()) missing.push('Tiêu đề sản phẩm')
  if (!parts.some(partHasContent)) missing.push('Ít nhất một phần có nội dung')
  return { ok: missing.length === 0, missing }
}

export function newPart(type: TemplateType, index: number): ScriptPart {
  const role = defaultRoleForType(type)
  return {
    id: uid(),
    role,
    title: partLabel(type, { id: '', role, title: '', body: '' }, index),
    body: '',
    notes: '',
  }
}

export function partsToPrompt(
  type: TemplateType,
  fieldValues: Record<string, string>,
  parts: ScriptPart[]
): string {
  const lines = [
    `Loại nội dung: ${type}`,
    `Tiêu đề: ${fieldValues.title || ''}`.trim(),
  ]
  if (fieldValues.aspect) lines.push(`Tỷ lệ khung hình: ${fieldValues.aspect}`)
  if (fieldValues.duration) lines.push(`Thời lượng: ${fieldValues.duration}`)
  if (fieldValues.paper) lines.push(`Khổ giấy: ${fieldValues.paper}`)
  lines.push('', 'Nội dung soạn thảo:')
  for (const [index, part] of parts.entries()) {
    if (!partHasContent(part)) continue
    const label = partLabel(type, part, index)
    lines.push(`${label}: ${part.title}`.trim())
    if (part.body.trim()) lines.push(part.body.trim())
    if (part.notes?.trim()) lines.push(`Lời đọc: ${part.notes.trim()}`)
  }
  return lines.filter(Boolean).join('\n')
}
