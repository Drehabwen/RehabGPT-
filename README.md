# 小柱 (XiaoZhu) — 儿童脊柱健康 AI 陪伴助手

> 康复师做判断，家长做执行。小柱是康复师指令的承接层，连接诊室内外。

## 架构

```
家长端 (Vite :5175)              小柱 Node (:8002)            Rehab Python (:8000)
+------------------+           +---------------------+      +----------------------+
|  React SPA       |--HTTP/WS--| LLM 流式对话         |--HTTP-| 数据 CRUD (SQLite)   |
|  (Zustand + Vite)|           | WebSocket 代理       |      | 姿态分析引擎         |
|                  |           | 6 条 chatbot 辅助路由|      | 家庭码管理 (SHA-256) |
+------------------+           +---------------------+      +----------------------+
        |                                                             |
        +-------- HTTP (Vite 代理) ----------------------------------+
                 /api/integration/* -> :8000
                 /api/chatbot/*     -> :8002
```

**Python 为唯一数据源**，Node 仅负责 LLM 流式对话和 WebSocket 通信。

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 19 + TypeScript + Vite 8 + Tailwind CSS 4 |
| 状态管理 | Zustand 5 |
| 路由 | React Router 7 |
| LLM | DeepSeek API (WebSocket 流式代理) |
| 后端运行时 | Node.js + tsx |
| 数据后端 | Python FastAPI + SQLite (独立服务) |

## 项目结构

```
chatbotagent/
├── src/
│   ├── pages/           # 页面组件
│   │   ├── ChatPage.tsx       # 首页 - 小柱对话
│   │   ├── TrackingPage.tsx   # 训练打卡
│   │   ├── ResultPage.tsx     # 评估报告
│   │   ├── LoginPage.tsx      # 家庭码登录
│   │   └── hooks/             # 页面级 hooks
│   ├── chatbot/         # 小柱核心模块
│   │   ├── store/             # Zustand stores
│   │   ├── prompts/           # 系统提示词
│   │   ├── constants/         # 分支流程定义
│   │   └── components/        # 对话相关组件
│   ├── components/      # 共享组件
│   │   ├── assistant/         # 首页卡片
│   │   ├── layout/            # 底部导航
│   │   └── ui/                # 通用 UI
│   ├── services/        # API 抽象层
│   ├── context/         # 上下文引擎
│   ├── tracking/        # 训练追踪模块
│   └── App.tsx
├── server/              # Node 后端
│   ├── index.ts               # 服务入口
│   ├── llmClient.ts           # DeepSeek API 客户端
│   ├── db.ts                  # 数据目录初始化
│   └── routes/
│       ├── chatbot.ts         # chatbot 辅助路由
│       └── utils.ts
├── vite.config.ts
└── package.json
```

## 快速开始

### 前置条件

- Node.js >= 18
- Rehab Python 后端运行于 `localhost:8000`
- DeepSeek API Key

### 安装

```bash
cd chatbotagent
npm install
```

### 配置

在 `server/.env` 中配置 DeepSeek API：

```env
DEEPSEEK_API_KEY=sk-your-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

> `.env` 和 `server/data/` 已在 `.gitignore` 中，不会提交到仓库。

### 启动

```bash
# 终端 1 - 启动 Python 数据后端 (在 Rehab-main/backend)
uvicorn main:app --port 8000

# 终端 2 - 启动 Node LLM 服务
npm run server          # -> :8002

# 终端 3 - 启动前端
npm run dev             # -> :5175
```

浏览器打开 `http://localhost:5175`。

### 测试账号

| 家庭码 | 患者 | 说明 |
|--------|------|------|
| `ABC123` | 小明 | 中度脊柱侧弯风险，含训练处方和打卡数据 |
| `XYZ789` | 小红 | 轻度姿态异常 |

## 功能

- **家庭码登录** - 康复师发放，SHA-256 哈希安全存储
- **小柱对话** - DeepSeek 流式 AI 对话，WebSocket 双向通信
- **评估报告** - 康复师推送的脊柱评估结果
- **训练处方** - Schroth 个人化康复训练方案
- **每日打卡** - 训练记录 + 症状追踪 + 趋势图表
- **量表填写** - SRS-22 等标准化量表
- **上下文引擎** - 多模型协作的患儿状态感知

## 构建

```bash
npm run build            # tsc + vite build -> dist/
```

## 相关项目

- [Rehab-main](https://github.com/Drehabwen/RehabGPT-) - 康复师端 (Python FastAPI + 姿态分析引擎)

## License

Private - Drehab 项目内部使用。
