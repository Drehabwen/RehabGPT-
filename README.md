# 小柱 · 脊柱健康助手 (XiaoZhu Spine Health Assistant)

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.6-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/TailwindCSS-4.3-06B6D4?logo=tailwindcss" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/Zustand-5.0-FF6B6B?logo=react" alt="Zustand">
  <img src="https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/DeepSeek-LLM-1E90FF?logo=openai" alt="DeepSeek">
</p>

<p align="center">
  <b>中文</b> | <a href="#english">English</a>
</p>

---

## 项目简介

**小柱** 是一款面向脊柱侧弯患者家长的智能康复助手，基于大语言模型（LLM）技术，提供从筛查评估、日常答疑到康复追踪的全流程支持。

### 核心痛点
脊柱侧弯患者的康复周期长达数年，家长需要：
- 📋 理解复杂的医学术语和康复方案
- 💬 随时咨询日常护理问题（支具佩戴、训练动作等）
- 📊 长期追踪孩子的疼痛、训练、支具佩戴情况
- 📢 及时向康复师汇报异常状况

### 解决方案
| 模块 | 功能 | 技术亮点 |
|------|------|----------|
| **智能对话** | 日常答疑、医学术语通俗化 | 本地缓存 + WebSocket 流式传输，高频问题秒回 |
| **康复处方** | 查看康复师开具的训练方案 | 实时同步，支持反馈打卡 |
| **日常追踪** | 每日2分钟记录疼痛/训练/支具/情绪 | 自动预警 + 7天趋势可视化 |
| **评估报告** | LLM 生成个性化康复进展报告 | 异步生成，不阻塞用户操作 |

---

## 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Frontend)                       │
│  React 19 + TypeScript + Vite + TailwindCSS + Zustand       │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  智能对话    │  │  康复处方    │  │  日常追踪系统        │ │
│  │  Chatbot    │  │Prescriptions│  │  Tracking System    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ WebSocket / HTTP
┌─────────────────────────────────────────────────────────────┐
│                        后端 (Backend)                        │
│  FastAPI + Python + WebSocket + DeepSeek API                │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  LLM 对话   │  │  处方管理    │  │  报告生成服务        │ │
│  │  Service    │  │  API        │  │  Report Generator   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 功能特性

### 1. 智能对话 (Smart Chat)
- **本地缓存**：15个高频问题预设回复，无需等待 LLM
- **流式传输**：WebSocket 实时输出，减少等待焦虑
- **智能状态**："正在连接"→"正在思考"→"正在生成"，清晰反馈
- **离线兜底**：连续失败自动切换离线模式，保证可用性

### 2. 日常追踪 (Daily Tracking)
- **4步向导**：疼痛 → 训练 → 支具 → 其他，2分钟完成
- **自动预警**：
  - 🔴 疼痛 ≥ 7分 → 高优先级预警
  - 🟡 未完成训练 → 中优先级提醒
  - 🟡 支具佩戴 < 12小时 → 佩戴不足提醒
  - 🔴 异常症状 → 立即预警
- **趋势可视化**：7天疼痛/训练/支具柱状图，直观展示康复进展
- **本地持久化**：Zustand + persist，刷新不丢失

### 3. 康复处方 (Prescriptions)
- 查看康复师开具的个性化训练方案
- 支持"收到/执行中/完成/有疑问"四种反馈状态
- 留言功能，方便与康复师沟通

---

## 快速开始

### 环境要求
- Node.js ≥ 18
- Python ≥ 3.10
- DeepSeek API Key

### 安装依赖

```bash
# 前端依赖
npm install

# 后端依赖 (如果需要本地 LLM 服务)
pip install fastapi uvicorn websockets httpx
```

### 配置环境变量

创建 `.env` 文件：

```env
# DeepSeek API
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions

# 可选：本地模型配置
LOCAL_MODEL_ENABLED=false
```

### 启动项目

```bash
# 启动前端开发服务器
npm run dev

# 启动后端服务（另一个终端）
npm run server
```

前端默认运行在 `http://localhost:5173`
后端默认运行在 `http://localhost:3000`

---

## 项目结构

```
chatbotagent/
├── src/
│   ├── chatbot/              # 智能对话模块
│   │   ├── components/       # 聊天UI组件
│   │   ├── store/            # Zustand状态管理
│   │   ├── utils/            # 工具函数（缓存、LLM服务）
│   │   └── prompts/          # LLM提示词工程
│   ├── tracking/             # 日常追踪系统 ⭐ 新增
│   │   ├── components/       # 表单+仪表板
│   │   ├── store/            # 追踪数据状态
│   │   └── types.ts          # 类型定义
│   ├── pages/                # 页面组件
│   ├── api/                  # API接口
│   └── App.tsx               # 路由配置
├── server/                   # 后端服务
│   ├── index.ts              # FastAPI入口
│   └── llmClient.ts          # LLM客户端
└── package.json
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

**XiaoZhu** is an intelligent rehabilitation assistant for parents of scoliosis patients, powered by Large Language Model (LLM) technology, providing full-process support from screening assessment, daily Q&A to rehabilitation tracking.

### Core Pain Points
The rehabilitation cycle for scoliosis patients lasts several years. Parents need to:
- 📋 Understand complex medical terminology and rehabilitation plans
- 💬 Consult daily care questions anytime (brace wearing, training exercises, etc.)
- 📊 Long-term tracking of child's pain, training, and brace wearing status
- 📢 Report abnormal conditions to therapists in a timely manner

### Solutions
| Module | Function | Technical Highlights |
|--------|----------|---------------------|
| **Smart Chat** | Daily Q&A, medical term simplification | Local cache + WebSocket streaming, instant response for frequent questions |
| **Prescriptions** | View training plans prescribed by therapists | Real-time sync, supports feedback check-in |
| **Daily Tracking** | 2-minute daily recording of pain/training/brace/mood | Auto alerts + 7-day trend visualization |
| **Assessment Report** | LLM-generated personalized rehabilitation progress reports | Async generation, non-blocking user operations |

---

## Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│  React 19 + TypeScript + Vite + TailwindCSS + Zustand       │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Smart Chat │  │Prescriptions│  │  Tracking System    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ WebSocket / HTTP
┌─────────────────────────────────────────────────────────────┐
│                        Backend                              │
│  FastAPI + Python + WebSocket + DeepSeek API                │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  LLM Chat   │  │ Prescription│  │  Report Generator   │ │
│  │  Service    │  │  API        │  │  Service            │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

### 1. Smart Chat
- **Local Cache**: 15 preset responses for frequent questions, no LLM waiting
- **Streaming**: WebSocket real-time output, reducing waiting anxiety
- **Smart Status**: "Connecting" → "Thinking" → "Generating", clear feedback
- **Offline Fallback**: Auto-switch to offline mode after consecutive failures

### 2. Daily Tracking ⭐ New
- **4-Step Wizard**: Pain → Training → Brace → Others, complete in 2 minutes
- **Auto Alerts**:
  - 🔴 Pain ≥ 7/10 → High priority alert
  - 🟡 Training missed → Medium priority reminder
  - 🟡 Brace wearing < 12 hours → Insufficient wearing alert
  - 🔴 Abnormal symptoms → Immediate alert
- **Trend Visualization**: 7-day bar charts for pain/training/brace
- **Local Persistence**: Zustand + persist, data survives page refresh

### 3. Prescriptions
- View personalized training plans prescribed by therapists
- Four feedback states: "Acknowledged/In Progress/Completed/Questions"
- Message function for easy communication with therapists

---

## Quick Start

### Requirements
- Node.js ≥ 18
- Python ≥ 3.10
- DeepSeek API Key

### Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies (if local LLM service needed)
pip install fastapi uvicorn websockets httpx
```

### Environment Variables

Create `.env` file:

```env
# DeepSeek API
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions

# Optional: Local model config
LOCAL_MODEL_ENABLED=false
```

### Start Project

```bash
# Start frontend dev server
npm run dev

# Start backend server (another terminal)
npm run server
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:3000`

---

## Project Structure

```
chatbotagent/
├── src/
│   ├── chatbot/              # Smart chat module
│   │   ├── components/       # Chat UI components
│   │   ├── store/            # Zustand state management
│   │   ├── utils/            # Utilities (cache, LLM service)
│   │   └── prompts/          # LLM prompt engineering
│   ├── tracking/             # Daily tracking system ⭐ New
│   │   ├── components/       # Form + Dashboard
│   │   ├── store/            # Tracking data state
│   │   └── types.ts          # Type definitions
│   ├── pages/                # Page components
│   ├── api/                  # API interfaces
│   └── App.tsx               # Route config
├── server/                   # Backend service
│   ├── index.ts              # FastAPI entry
│   └── llmClient.ts          # LLM client
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

## Contact

For questions or suggestions, please contact via GitHub Issue.

---

<p align="center">
  <i>Making scoliosis rehabilitation simpler and warmer</i>
</p>
