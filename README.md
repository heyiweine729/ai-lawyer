# AI 律师助手 🏛️

智能法律案件管理与文书生成平台，帮助律师高效处理案件、分析案情、自动生成法律文书。

## 功能特性

### 📋 案件管理
- 案件建档、状态追踪（草稿→准备中→审理中→已结案）
- 当事人信息管理（原告/被告/第三人）
- 案件时间线与关键日期提醒
- 证据材料管理

### 🤖 AI 智能分析
- **录音文本智能分析**：导入钉钉/飞书录音转写文本，AI 自动识别发言人角色、提取关键事实、生成案情摘要
- **AI 追问补充**：分析后自动识别缺失的关键信息，以提问形式引导律师补充
- **法律对话咨询**：基于案情的 AI 对话，提供法条引用、策略建议、风险评估
- **流式输出**：实时显示 AI 生成内容，体验流畅

### 📄 文书自动生成
- 6 种文书模板：民事起诉状、答辩状、律师函、法律意见书、合同审查报告、上诉状
- AI 根据案情自动生成规范文书
- 在线编辑和修改
- 导出 Word/PDF

## 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 14 | 全栈框架（前端+后端API） |
| React 18 | UI 组件 |
| Tailwind CSS | 样式系统 |
| Kimi API (Moonshot) | AI 大模型引擎 |
| Prisma + SQLite | 数据库（本地轻量） |
| OpenAI SDK | API 调用（Kimi 兼容 OpenAI 格式） |
| TipTap | 富文本编辑器 |
| docx | Word 文档生成 |

---

## 🚀 快速开始

### 第一步：安装 Node.js

1. 打开 https://nodejs.org
2. 下载 **LTS 版本**（长期支持版）
3. 双击安装，一路 "Next" 即可
4. 安装完成后，打开 **终端**（Windows 搜索 "cmd" 或 "PowerShell"），输入：
   ```bash
   node --version
   ```
   看到类似 `v20.x.x` 就表示安装成功。

### 第二步：获取 Kimi API Key

1. 打开 https://platform.moonshot.cn
2. 用手机号注册登录
3. 点左侧「API Key 管理」→「新建」
4. **立即复制保存** API Key（只显示一次！）
5. 新用户有 15 元免费额度，足够开发测试

### 第三步：下载项目并配置

```bash
# 1. 进入项目目录
cd ai-lawyer

# 2. 安装依赖（第一次需要等几分钟）
npm install

# 3. 配置环境变量
# 复制配置文件
copy .env.example .env.local        # Windows
# cp .env.example .env.local        # Mac/Linux

# 4. 用 VS Code 打开项目
code .
```

然后打开 `.env.local` 文件，把 `your_kimi_api_key_here` 替换为你的真实 API Key：

```
KIMI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

### 第四步：初始化数据库

```bash
npx prisma db push
```

### 第五步：启动项目

```bash
npm run dev
```

打开浏览器访问 http://localhost:3000 即可看到项目！

---

## 📁 项目结构

```
ai-lawyer/
├── app/                          # Next.js 页面和 API
│   ├── layout.tsx               # 全局布局（侧边栏+顶栏）
│   ├── globals.css              # 全局样式+设计系统
│   ├── page.tsx                 # 首页（跳转到工作台）
│   ├── dashboard/page.tsx       # 工作台（统计+快捷入口）
│   ├── cases/
│   │   ├── page.tsx             # 案件列表（搜索+筛选）
│   │   ├── new/page.tsx         # 新建案件（录音导入+AI分析）⭐核心
│   │   └── [id]/page.tsx        # 案件详情
│   ├── chat/page.tsx            # AI 对话页面（流式输出）
│   ├── documents/
│   │   ├── page.tsx             # 文书中心（模板库+我的文书）
│   │   └── new/page.tsx         # 生成文书（AI 生成+编辑+导出）
│   └── api/
│       ├── chat/route.ts        # AI 对话 API（流式）
│       ├── analyze/route.ts     # 录音分析 API
│       └── generate-doc/route.ts # 文书生成 API（流式）
├── components/
│   └── layout/
│       ├── Sidebar.tsx          # 侧边导航
│       └── Header.tsx           # 顶部导航栏
├── lib/
│   ├── kimi.ts                  # Kimi API 配置+提示词
│   └── prisma.ts                # 数据库连接
├── prisma/
│   └── schema.prisma            # 数据模型定义
├── types/
│   └── index.ts                 # TypeScript 类型+常量
├── .env.example                 # 环境变量模板
├── package.json                 # 依赖配置
└── README.md                    # 你正在看的这个文件
```

## 开发路线图

- [x] 阶段一：项目框架搭建
- [x] 阶段二：UI 界面设计
- [x] 阶段三A：案件管理模块
- [x] 阶段三B：AI 对话（Kimi API 接入）
- [x] 阶段四：文书自动生成
- [ ] 阶段五：数据库持久化（连接真实数据）
- [ ] 阶段六：本地知识库（相似案例检索）
- [ ] 阶段七：打磨 + 部署上线
