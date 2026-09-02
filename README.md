# OmniStudio OS (OmmiStudio)

Local content studio: React UI + Express engine wrapping nexu-io CLIs (`html-anything`, `motion-anything`, `html-video`, `open-design`) for Vietnamese video / slide / poster generation.

**GitHub:** [duongcanhquan/OmmiStudio](https://github.com/duongcanhquan/OmmiStudio)

## Đồng bộ Windows ↔ Mac

```bash
# Máy mới (Mac)
git clone https://github.com/duongcanhquan/OmmiStudio.git
cd OmmiStudio
pnpm install
pnpm setup          # clone tools + edge-tts (một lần)
pnpm dev            # server :3001 + client :5173
```

Cấu hình API Key / Drive trong **Cài đặt** trên UI (không commit `server/data/settings.json`).

Sau khi sửa code trên máy khác:

```bash
git pull
pnpm install        # nếu lockfile đổi
pnpm dev
```

## Monorepo

```
/
├── client/          # Vite + React + Tailwind — Studio UI
├── server/          # Express + LLM + pipeline
│   ├── tools/       # gitignored — nexu CLIs (pnpm setup)
│   ├── workspaces/  # gitignored — output tạm
│   └── data/        # gitignored — settings.json (API keys)
└── package.json
```

## Prerequisites

- Node.js **20+**
- pnpm 9+ (`corepack enable` rồi `corepack prepare pnpm@latest --activate`)
- git
- **FFmpeg** — macOS: `brew install ffmpeg`
- **Playwright Chromium** (sau `pnpm setup`):  
  `cd server/tools/html-video && npx playwright install chromium`

## Develop

```bash
pnpm install
pnpm setup       # một lần: tools + .venv edge-tts
pnpm dev         # concurrently server + client
```

| URL | Vai trò |
|-----|---------|
| http://localhost:5173 | Studio UI |
| http://localhost:3001 | API engine |

## Tính năng chính

- Studio 4 bước: mẫu → thương hiệu → brief AI → xuất bản
- Multi LLM: Gemini, OpenAI, DeepSeek, Claude, Groq, Ollama…
- Dự án / Brand assets / Settings (Drive, giọng Bắc-Nam)
- Preview HTML luôn chạy được khi có API key; MP4 đầy đủ cần `pnpm setup` + FFmpeg

## API nhanh

```bash
# Health
curl http://localhost:3001/api/health

# Generate (cần API key trong Settings UI)
curl -X POST http://localhost:3001/api/v1/generate \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Video giới thiệu 30 giây","type":"video","voiceRegion":"south"}'
```

## Bảo mật — không commit

- `.env`, `server/data/settings.json` (API keys)
- `server/credentials/*`, `server/tools/*`, `server/.venv/`, `server/workspaces/*`

Xem `.gitignore` và `server/.env.example`.

## License

Private / personal use unless otherwise stated.
