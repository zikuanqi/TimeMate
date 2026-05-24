# TimeMate - AI 时间管理工具

面向独立开发者的 AI 驱动时间管理工具，解决拖延、专注力保护、时间规划等痛点。

## 项目结构

```
ai-timemate/
├── frontend/                 # React + TypeScript 前端
│   ├── src/
│   │   ├── components/      # 组件库
│   │   │   ├── ui/         # 基础 UI 组件
│   │   │   ├── calendar/   # 日历视图组件
│   │   │   ├── timer/      # 番茄钟组件
│   │   │   ├── chat/       # AI 聊天组件
│   │   │   └── analytics/  # 分析组件
│   │   ├── stores/         # Zustand 状态管理
│   │   ├── types/          # TypeScript 类型定义
│   │   ├── lib/            # 工具函数
│   │   └── services/       # API 服务层
│   └── package.json
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── routers/        # API 路由
│   │   ├── models/         # SQLAlchemy 数据模型
│   │   ├── schemas/        # Pydantic 数据验证
│   │   ├── services/       # 业务逻辑层
│   │   └── database.py     # 数据库配置
│   └── requirements.txt
└── package.json            # 根项目配置
```

## 技术栈

### 前端
- **React 18** + **TypeScript** - 类型安全的前端框架
- **Vite** - 快速构建工具
- **Tailwind CSS v4** - 原子化 CSS 框架
- **Radix UI** - 无样式组件库
- **Zustand** - 轻量状态管理
- **date-fns** - 日期处理
- **Recharts** - 数据可视化
- **Lucide React** - 图标库

### 后端
- **FastAPI** - 高性能 Python Web 框架
- **SQLAlchemy** + **SQLite** - ORM 和数据库
- **Pydantic** - 数据验证和序列化
- **Uvicorn** - ASGI 服务器

## 核心功能

### 已实现
1. **番茄钟计时器**
   - 25+5 标准模式
   - 进度环可视化
   - 中断记录
   - 本地状态持久化

2. **日历周视图**
   - 时间块展示
   - 日期导航
   - 响应式布局

3. **AI 聊天界面**
   - 消息历史
   - 打字状态模拟
   - 快速操作入口

4. **数据模型**
   - Task（任务）
   - TimeBlock（时间块）
   - FocusSession（专注会话）
   - Interruption（中断记录）

### 待实现（Phase 1）
1. 时间块拖拽编辑
2. 任务管理
3. 数据同步到后端
4. 专注会话记录
5. 基础分析仪表盘

## 快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
pip install -r requirements.txt
```

### 2. 启动开发服务器

```bash
# 根目录下运行（需要先安装 concurrently）
npm run dev

# 或分别启动
npm run dev:frontend  # 前端 http://localhost:3000
npm run dev:backend   # 后端 http://localhost:8000
```

### 3. 访问应用

- 前端：http://localhost:3000
- 后端 API：http://localhost:8000
- 后端文档：http://localhost:8000/docs

## 开发计划

### Phase 1: MVP（当前）
- 基础日历和时间块管理
- 番茄钟核心功能
- 本地数据存储
- 基础任务管理

### Phase 2: AI 集成
- OpenAI API 集成
- 早晚 Check-in 流程
- 自然语言任务解析
- 智能排期算法

### Phase 3: 日历集成
- Google Calendar API
- 外部事件冲突检测
- 时间块自动调整

### Phase 4: 分析与优化
- 高级分析仪表盘
- 效率洞察报告
- AI 排期优化

## API 接口

### 任务管理
- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks` - 创建任务
- `PUT /api/tasks/{id}` - 更新任务
- `DELETE /api/tasks/{id}` - 删除任务

### 时间块管理
- `GET /api/timeblocks` - 获取时间块列表
- `POST /api/timeblocks` - 创建时间块
- `PUT /api/timeblocks/{id}` - 更新时间块
- `DELETE /api/timeblocks/{id}` - 删除时间块

### 专注会话
- `GET /api/focus-sessions` - 获取专注会话
- `POST /api/focus-sessions` - 创建专注会话
- `PUT /api/focus-sessions/{id}` - 更新专注会话
- `POST /api/focus-sessions/{id}/interrupt` - 记录中断

## 设计理念

1. **本地优先** - 数据默认存储在本地，可选云同步
2. **AI 驱动** - AI 作为教练、分析师、陪伴者三重角色
3. **专注保护** - 通过时间块和番茄钟保护深度工作时间
4. **独立友好** - 针对独立开发者工作模式优化

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 发起 Pull Request

## 许可证

MIT