# 小柱 · 脊柱健康助手 (XiaoZhu Spine Health Assistant)

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/TailwindCSS-4.3-06B6D4?logo=tailwindcss" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/Zustand-5.0-FF6B6B?logo=react" alt="Zustand">
  <img src="https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/DeepSeek-LLM-1E90FF?logo=openai" alt="DeepSeek">
</p>

<p align="center">
  <b>中文</b> | <a href="#english">English</a>
</p>

---

## 项目简介

**小柱** 是一款面向脊柱侧弯患者家长端的智能康复助手，定位为**康复师指令的承接终端** —— 康复师做判断，家长做执行。

家长通过康复师提供的**家庭码**绑定孩子档案后，即可查看评估报告、执行训练处方、完成每日打卡，所有数据自动同步至康复师端。

### 产品定位

```
康复师端（专业判断）              家长端（执行承接）
┌─────────────────────┐          ┌──────────────────────┐
│ · 专业评估            │   推送    │ · 查看评估报告         │
│ · 制定训练处方        │ ──────→ │ · 执行训练打卡         │
│ · 下发量表评定        │          │ · 填写量表问卷         │
│ · 查看打卡数据        │ ←────── │ · 日常症状记录         │
└─────────────────────┘   回流    └──────────────────────┘
```

### 核心功能

| 模块 | 功能 | 技术亮点 |
|------|------|----------|
| **智能对话** | 日常答疑、医学术语通俗化 | 意图路由 + 结构化上下文注入 + WebSocket 流式 + 本地缓存 |
| **评估报告** | 查看康复师推送的专业评估 | 自动拉取最新评估摘要，支持风险等级可视化 |
| **训练处方** | 执行康复师制定的训练计划 | 实时同步处方内容，打卡数据自动回传 |
| **每日打卡** | 2分钟记录疼痛/训练/支具/情绪 | 自动预警 + 7天趋势 + ChildContext 进度同步 |
| **量表评定** | 填写康复师下发的 SRS-22/ODI/VAS | 嵌入式填写，结果自动回传 |

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| **v2.1.0** | 2026-05 | 结构化上下文工程：意图路由 + 动态注入 + 提取闭环 |
| **v2.0.0** | 2026-05 | 家长端重新定位为康复师指令承接终端，砍掉自筛流程 |
| v1.x | 2026-04 | 初始版本：智能对话 + 拍照初筛 + 日常追踪 |

### v2.1.0 — 结构化上下文工程

- **7层结构化 ChildContext**：identity / assessment / treatment / progress / memory / flags / stage
- **RehabStage 状态机**：unbound → waiting_assessment → assessed → in_training → awaiting_review → completed
- **规则引擎意图路由**：5种意图（chat / training / assessment / medical / feedback），加权关键词打分
- **动态注入引擎**：系统提示词按意图裁剪至 200-570 tokens（节省 ~40%）
- **异步提取闭环**：对话后 LLM 提取要点 → JSON → 回写 ChildContext，附退避机制
- **跨日记忆收敛**：自动清理过期话题，保留关键上下文

### v2.0.0 — 家长端重新定位

- **删除**：拍照初筛、自建患者、Adams 拍照、reassess 分支
- **重构**：数据源从"家长自筛"切换到"康复师推送"
- **新增**：4条康复师↔家长 API 通道（处方推送/评估摘要/打卡上传/家庭码绑定）
- **底部导航**：4 tab → 3 tab（首页 / 训练打卡 / 评估报告）
- **Design System**：统一设计令牌 + 基础UI组件库（Button/Card/Chip/Badge/Input/Progress）+ 临床/报告/布局组件

---

## 技术架构

```
┌──────────────────────────────────────────────────────────────────┐
│                         前端 (Frontend)                           │
│  React 19 + TypeScript + Vite + TailwindCSS + Zustand            │
│                                                                  │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌──────────────────┐ │
│  │ 智能对话   │ │ 评估报告   │ │ 训练打卡   │ │ 结构化上下文引擎  │ │
│  │ Chatbot   │ │ Report    │ │ Tracking  │ │ Context Engine   │ │
│  │           │ │           │ │           │ │ · Intent Router  │ │
│  │ · 流式LLM │ │ · 评估摘要 │ │ · 训练处方 │ │ · Injection      │ │
│  │ · 意图路由│ │ · 风险雷达 │ │ · 每日打卡 │ │ · Extraction     │ │
│  │ · 量表填写│ │ · 趋势图表 │ │ · 趋势总览 │ │ · Memory         │ │
│  └───────────┘ └───────────┘ └───────────┘ └──────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Design System: tokens.css + UI Kit (Button/Card/Chip/...)     │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼ HTTP / WebSocket
┌──────────────────────────────────────────────────────────────────┐
│                         后端 (Backend)                            │
│  FastAPI + WebSocket + DeepSeek API                              │
│                                                                  │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌──────────────────┐ │
│  │ LLM 对话   │ │ 处方管理   │ │ 评估管理   │ │ 家庭码绑定        │ │
│  │ Service   │ │ Plan API  │ │ Assmt API │ │ Family Link API  │ │
│  └───────────┘ └───────────┘ └───────────┘ └──────────────────┘ │
│  ┌───────────┐ ┌───────────┐                                     │
│  │ 打卡回流   │ │ 量表管理   │                                     │
│  │ Tracking  │ │ Scale API │                                     │
│  └───────────┘ └───────────┘                                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 功能特性

### 1. 智能对话 (Smart Chat)

- **意图路由**：规则引擎 5 类意图分类，低置信度 LLM 兜底
- **上下文注入**：按意图动态装配系统提示词（200-570 tokens），含身份/评估/治疗/进度/记忆
- **流式传输**：WebSocket 实时输出 + 本地缓存命中即时响应
- **提取闭环**：对话后异步 LLM 提取要点，自动回写 ChildContext
- **离线兜底**：连续失败自动切换规则引擎，保证可用性

### 2. 评估报告 (Assessment Report)

- **数据来源**：康复师端推送的专业评估摘要（非家长自筛）
- **风险可视化**：RiskRadarCard + RiskGauge 展示风险等级
- **关注点展示**：体态不对称、弯曲度、疼痛、家族史、生长风险
- **空状态**：未绑定时显示"等待康复师评估"

### 3. 训练打卡 (Training & Tracking)

- **训练处方** tab：展示康复师推送的个性化训练方案（动作/组数/备注）
- **每日打卡** tab：4步向导（疼痛 → 训练 → 支具 → 其他），2分钟完成
- **趋势总览** tab：7天疼痛/训练/支具柱状图 + 依从性统计
- **自动预警**：
  - 🔴 疼痛 ≥ 7分 → 高优先级
  - 🟡 训练缺失/支具不足 → 中优先级
  - 🔴 异常症状/皮肤破溃 → 高优先级
  - 🔵 情绪低落 → 低优先级
- **数据上行**：打卡后静默同步至后端（失败不影响本地保存）

### 4. 量表评定 (Scales)

- 填写康复师下发的 SRS-22 / ODI / VAS 量表
- 对话内嵌入式填写，无需跳转
- 提交后自动回传康复师端

---

## 快速开始

### 环境要求

- Node.js ≥ 18
- npm ≥ 9
- DeepSeek API Key

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env` 文件：

```env
# DeepSeek API
VITE_DEEPSEEK_API_KEY=your_api_key_here
VITE_DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions

# 后端 API 地址（如使用独立后端）
VITE_API_BASE=http://localhost:8000
```

### 启动项目

```bash
# 启动前端开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

前端默认运行在 `http://localhost:5173`

---

## 项目结构

```
chatbotagent/
├── src/
│   ├── chatbot/                    # 智能对话模块
│   │   ├── components/             # 聊天UI组件 (ChatWindow, QuickQuestions, ScaleForm...)
│   │   ├── constants/              # 分支路由 + 流程定义
│   │   ├── prompts/                # LLM提示词工程 + 系统提示词
│   │   ├── store/                  # Zustand状态管理
│   │   │   ├── agentCoreSlice.ts   # 对话引擎 + 生命周期
│   │   │   ├── agentLLMSlice.ts    # LLM集成 + 流式对话 + 提取闭环
│   │   │   ├── agentToolSlice.ts   # 工具调用
│   │   │   └── agentTypes.ts       # 类型定义
│   │   ├── utils/                  # 工具函数 (缓存/LLM服务/Token计数/上下文窗口)
│   │   └── types.ts
│   ├── context/                    # 结构化上下文引擎 ⭐ v2.1.0
│   │   ├── types.ts                # ChildContext 7层模型类型
│   │   ├── ChildContextStore.ts    # Zustand上下文Store (persist)
│   │   ├── intentRouter.ts         # 规则引擎意图路由器
│   │   ├── injectionEngine.ts      # 动态系统提示词装配
│   │   ├── extractionService.ts    # 对话后异步提取服务
│   │   ├── updateRules.ts          # 状态推导 + 标记计算纯函数
│   │   └── useChildContext.ts      # 统一Hook
│   ├── tracking/                   # 日常追踪系统
│   │   ├── components/             # DailyTrackingForm + TrackingDashboard
│   │   ├── store/                  # useTrackingStore (localStorage persist)
│   │   └── types.ts
│   ├── components/
│   │   ├── ui/                     # 基础UI组件 (Button/Card/Chip/Badge/Input/Progress)
│   │   ├── layout/                 # 布局组件 (AppShell/PageHeader/SectionHeader/SidebarNav)
│   │   ├── clinical/               # 临床组件 (RiskRadarCard/PatientContextBar/AssessmentModuleCard...)
│   │   ├── report/                 # 报告组件 (TrendMiniChart/MetricDelta/ReportStatusPanel...)
│   │   └── assistant/              # 助手组件 (BottomNav/Greeting/Advice/TodayActions...)
│   ├── pages/                      # 页面组件
│   │   ├── ChatPage.tsx            # 首页 — 智能对话工作台
│   │   ├── TrackingPage.tsx        # 训练打卡 — 3 tab
│   │   ├── ResultPage.tsx          # 评估报告页
│   │   ├── LoginPage.tsx           # 家庭码登录
│   │   ├── PrescriptionsPage.tsx   # 处方详情
│   │   ├── ScalesPage.tsx          # 量表中心
│   │   ├── hooks/                  # 页面数据层 hooks
│   │   ├── assessment/             # 评估页
│   │   ├── dashboard/              # 仪表板
│   │   └── reports/                # 报告页
│   ├── styles/
│   │   ├── tokens.css              # Design Tokens (颜色/字体/间距/圆角/阴影)
│   │   └── globals.css             # 全局样式 + 动画
│   ├── api/                        # API封装
│   ├── types/                      # 全局类型
│   ├── App.tsx                     # 路由配置
│   └── main.tsx                    # 入口
├── server/                         # 后端服务 (FastAPI)
└── package.json
```

---

## 数据流

### 家长端核心数据流

```
 LoginPage                  ChatPage                    TrackingPage
 ┌──────────┐             ┌──────────────┐             ┌──────────────┐
 │ 输入家庭码 │ ────────→ │ 初始化Chatbot │             │              │
 │ 绑定患者  │   patientId │ + ChildContext│             │              │
 └──────────┘             └──────┬───────┘             └──────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
             ┌─────────────┐          ┌─────────────┐
             │ 拉取评估摘要  │          │ 拉取训练处方  │
             │ GET /assmt/  │          │ GET /plan/   │
             │ summary/{id} │          │ pending/{id} │
             └──────┬──────┘          └──────┬──────┘
                    │                         │
                    ▼                         ▼
             ┌─────────────┐          ┌─────────────┐
             │ ChildContext │          │ ChildContext │
             │ .assessment  │          │ .treatment   │
             └─────────────┘          └─────────────┘
                                           │
                          ┌────────────────┴────────────────┐
                          ▼                                 ▼
                   ┌─────────────┐                   ┌─────────────┐
                   │ 小柱建议     │                   │ 训练打卡     │
                   │ (LLM驱动)   │                   │ submitDaily │
                   └─────────────┘                   └──────┬──────┘
                                                           │
                                              POST /tracking/submit
                                                           │
                                                           ▼
                                                   ┌─────────────┐
                                                   │ 康复师端     │
                                                   │ 查看打卡数据  │
                                                   └─────────────┘
```

### 对话上下文流 (v2.1.0)

```
 用户输入 → classifyIntent() → buildDynamicSystemPrompt(intent, ctx)
                │                        │
                ▼                        ▼
          5种意图分类            按意图裁剪提示词(200-570t)
                │                        │
                └────────┬───────────────┘
                         ▼
                   sendFreeTextStream()
                         │
                         ▼
                   LLM 流式回复
                         │
                         ▼
                   shouldExtract() ?
                    │        │
                   Yes       No → 结束
                    │
                    ▼
            scheduleExtraction() → 异步LLM提取 → JSON → ChildContext.writeback
```

---

## 贡献指南

欢迎提交 Issue 和 PR！

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/xxx`
3. 提交更改：`git commit -m 'feat: add xxx'`
4. 推送分支：`git push origin feature/xxx`
5. 创建 Pull Request

---

## 许可证

[MIT License](./LICENSE)

---

## 联系我们

如有问题或建议，欢迎通过 GitHub Issue 联系。

---

<p align="center">
  <i>让脊柱侧弯康复更简单、更温暖</i>
</p>

---

<h1 id="english">XiaoZhu · Spine Health Assistant</h1>

<p align="center">
  <b>English</b> | <a href="#">中文</a>
</p>

---

## Introduction

**XiaoZhu** is an intelligent rehabilitation assistant for parents of scoliosis patients, positioned as a **therapist instruction terminal** — therapists make the clinical judgments, parents handle the execution.

Parents bind their child's profile via a **family code** provided by their therapist, then view assessment reports, execute training prescriptions, and complete daily check-ins. All data syncs automatically back to the therapist's dashboard.

### Product Positioning

```
Therapist Side (Clinical Judgment)       Parent Side (Execution)
┌─────────────────────┐          ┌──────────────────────┐
│ · Professional assess│   Push   │ · View reports        │
│ · Prescribe training │ ──────→ │ · Execute exercises   │
│ · Assign scales      │          │ · Complete scales     │
│ · Review check-in    │ ←────── │ · Daily symptom log   │
└─────────────────────┘   Sync   └──────────────────────┘
```

### Core Modules

| Module | Function | Technical Highlights |
|--------|----------|---------------------|
| **Smart Chat** | Daily Q&A, medical term explanation | Intent routing + structured context injection + WebSocket streaming + local cache |
| **Assessment** | View therapist-pushed assessment reports | Auto-fetch latest summary, risk level visualization |
| **Prescriptions** | Execute therapist-designed training plans | Real-time sync, auto check-in feedback |
| **Daily Tracking** | 2-min daily pain/training/brace/mood log | Auto alerts + 7-day trends + ChildContext sync |
| **Scales** | Complete SRS-22/ODI/VAS assigned by therapist | Embedded form, auto-submit results |

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| **v2.1.0** | 2026-05 | Structured Context Engineering: intent router + dynamic injection + extraction loop |
| **v2.0.0** | 2026-05 | Repositioned as therapist instruction terminal, removed self-screening flow |
| v1.x | 2026-04 | Initial: smart chat + photo screening + daily tracking |

---

## Tech Stack

- **Frontend**: React 19, TypeScript 5.8, Vite 6.3, TailwindCSS 4.3, Zustand 5.0
- **Backend**: FastAPI, WebSocket, DeepSeek API
- **Design System**: Custom design tokens (tokens.css) + reusable UI component library

---

## Features

### 1. Smart Chat

- **Intent Router**: Rule-based 5-type intent classification, LLM fallback for low confidence
- **Context Injection**: Dynamic system prompt assembly per intent (200-570 tokens), covering identity/assessment/treatment/progress/memory
- **Streaming**: WebSocket real-time output + instant cache-hit responses
- **Extraction Loop**: Async LLM extraction post-dialogue → JSON → ChildContext writeback with backoff
- **Offline Fallback**: Auto-switch to rule engine after consecutive failures

### 2. Assessment Report

- **Data Source**: Therapist-pushed professional assessment summaries (not parent self-screening)
- **Risk Visualization**: RiskRadarCard + RiskGauge for risk level display
- **Concern Tracking**: Posture asymmetry, curvature, pain, family history, growth risk
- **Empty State**: "Awaiting therapist assessment" when unbound

### 3. Training & Tracking

- **Prescription Tab**: Therapist-designed training plan (exercises/sets/notes)
- **Daily Check-in Tab**: 4-step wizard (Pain → Training → Brace → Other), 2 minutes
- **Trends Tab**: 7-day bar charts + adherence statistics
- **Auto Alerts**: Pain ≥ 7 (high), missed training (medium), brace < 12h (medium), abnormal symptoms (high), mood low (low)
- **Data Upload**: Silent sync to backend after check-in (non-blocking)

### 4. Scales

- Complete therapist-assigned SRS-22 / ODI / VAS scales
- Embedded in-chat completion, no page navigation needed
- Auto-submit results back to therapist

---

## Quick Start

### Requirements

- Node.js ≥ 18
- npm ≥ 9
- DeepSeek API Key

### Install

```bash
npm install
```

### Environment Variables

Create `.env`:

```env
VITE_DEEPSEEK_API_KEY=your_api_key_here
VITE_DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
VITE_API_BASE=http://localhost:8000
```

### Start

```bash
npm run dev      # Dev server at http://localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
```

---

## Project Structure

```
chatbotagent/
├── src/
│   ├── chatbot/                    # Chat engine + LLM integration
│   │   ├── components/             # Chat UI (ChatWindow, QuickQuestions, ScaleForm...)
│   │   ├── constants/              # Branch routing + flow definitions
│   │   ├── prompts/                # LLM prompt engineering
│   │   ├── store/                  # Zustand state (core/LLM/tool/report slices)
│   │   └── utils/                  # Cache, LLM service, token counter, context window
│   ├── context/                    # Structured Context Engine ⭐ v2.1.0
│   │   ├── types.ts                # ChildContext 7-layer model
│   │   ├── ChildContextStore.ts    # Zustand context store (persist)
│   │   ├── intentRouter.ts         # Rule-based intent classifier
│   │   ├── injectionEngine.ts      # Dynamic system prompt assembler
│   │   ├── extractionService.ts    # Async post-dialogue extraction
│   │   └── updateRules.ts          # State derivation pure functions
│   ├── tracking/                   # Daily tracking system
│   ├── components/
│   │   ├── ui/                     # UI Kit (Button/Card/Chip/Badge/Input/Progress)
│   │   ├── layout/                 # Layout (AppShell/PageHeader/SectionHeader)
│   │   ├── clinical/               # Clinical (RiskRadar/PatientContext/AssessmentModule)
│   │   ├── report/                 # Reports (TrendMiniChart/MetricDelta/ReportStatus)
│   │   └── assistant/              # Assistant (BottomNav/Greeting/Advice/TodayActions)
│   ├── pages/                      # Pages + data hooks
│   ├── styles/                     # tokens.css + globals.css
│   └── api/                        # API wrappers
├── server/                         # Backend (FastAPI)
└── package.json
```

---

## Contributing

Issues and PRs are welcome!

1. Fork this repository
2. Create feature branch: `git checkout -b feature/xxx`
3. Commit changes: `git commit -m 'feat: add xxx'`
4. Push branch: `git push origin feature/xxx`
5. Create Pull Request

---

## License

[MIT License](./LICENSE)

---

<p align="center">
  <i>Making scoliosis rehabilitation simpler and warmer</i>
</p>
