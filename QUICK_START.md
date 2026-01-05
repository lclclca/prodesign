# 快速启动指南

## 问题：如何同时运行多个进程？

在 Windows 上，您有几种方式同时运行后端服务器和其他命令：

## 方法1：开多个 PowerShell 窗口（最简单）

### 窗口1：启动后端服务器
```powershell
cd C:\Users\86138\Desktop\frontend\backend
node server.js
```

### 窗口2：运行数据库脚本或其他命令
```powershell
cd C:\Users\86138\Desktop\frontend\backend
# 现在可以运行任何命令
node scripts/dbManager.js test-data
node scripts/dbManager.js stats
```

### 窗口3：启动前端（在项目根目录）
```powershell
cd C:\Users\86138\Desktop\frontend
npm run dev
```

**提示：** 同时按 `Win + X`，然后选择"Windows PowerShell"即可打开新窗口。

---

## 方法2：使用 VS Code 的多终端（推荐）

如果您使用 VS Code：

1. 打开 VS Code
2. 按 `` Ctrl + ` `` 打开终端
3. 点击终端右上角的 `+` 号可以创建新终端
4. 或者点击分屏图标，同时查看多个终端

![VS Code 终端示意](https://code.visualstudio.com/assets/docs/editor/integrated-terminal/terminal-multiple.png)

这样您可以：
- **终端1** 运行后端：`node server.js`
- **终端2** 运行数据库命令：`node scripts/dbManager.js ...`
- **终端3** 运行前端：`npm run dev`

---

## 方法3：一键启动所有服务（最方便）

我已经为您准备了启动脚本，只需一个命令即可启动所有服务！

### Windows 用户（使用 PowerShell）

#### 第一次使用前的准备：

1. **后端目录** 安装依赖（如果还没安装）：
```powershell
cd C:\Users\86138\Desktop\frontend\backend
npm install
```

2. **项目根目录** 安装依赖：
```powershell
cd C:\Users\86138\Desktop\frontend
npm install
```

#### 启动服务：

**方式A：分别启动（推荐，便于调试）**

终端1 - 启动后端：
```powershell
cd C:\Users\86138\Desktop\frontend\backend
npm start
```

终端2 - 启动前端：
```powershell
cd C:\Users\86138\Desktop\frontend
npm run dev
```

**方式B：后台启动后端**
```powershell
# 在后端目录
cd C:\Users\86138\Desktop\frontend\backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node server.js"

# 然后在当前窗口运行其他命令
node scripts/dbManager.js test-data
```

---

## 常用操作流程

### 1. 首次启动

**第1步：初始化数据库**
```powershell
# 在后端目录
cd backend
node scripts/dbManager.js init
node scripts/dbManager.js test-data
```

**第2步：开两个终端窗口**

终端1（后端）：
```powershell
cd backend
node server.js
```

终端2（前端）：
```powershell
npm run dev
```

### 2. 日常开发

每天开始工作时：

1. **打开两个 PowerShell 窗口**
2. **窗口1** 启动后端：
   ```powershell
   cd C:\Users\86138\Desktop\frontend\backend
   node server.js
   ```
3. **窗口2** 启动前端：
   ```powershell
   cd C:\Users\86138\Desktop\frontend
   npm run dev
   ```
4. 如果需要操作数据库，再开 **窗口3**

### 3. 测试时清理数据库

如果需要清理测试数据：

**重要：先停止后端服务器！**
- 在运行 `node server.js` 的窗口按 `Ctrl + C` 停止服务器

然后在另一个窗口：
```powershell
cd backend
node scripts/dbManager.js clear      # 清空数据
node scripts/dbManager.js test-data  # 创建测试数据
```

再重新启动服务器：
```powershell
node server.js
```

---

## 数据库管理命令（需要先停止服务器）

```powershell
# ⚠️ 执行这些命令前，先在服务器窗口按 Ctrl+C 停止服务器

# 查看数据库状态
node scripts/dbManager.js stats

# 创建测试数据
node scripts/dbManager.js test-data

# 清空所有数据（保留表结构）
node scripts/dbManager.js clear

# 完全重置数据库
node scripts/dbManager.js reset

# 备份数据库
node scripts/dbManager.js backup

# 恢复数据库
node scripts/dbManager.js restore
```

---

## 停止服务

在任何运行服务的终端窗口按 `Ctrl + C` 即可停止该服务。

---

## 端口说明

- **后端服务器**: `http://localhost:3000`
- **前端开发服务器**: `http://localhost:5173`
- **API 请求**: 前端会自动代理到后端

访问地址：打开浏览器访问 `http://localhost:5173`

---

## 快速参考

| 操作 | 命令 | 位置 |
|---|---|---|
| 启动后端 | `node server.js` | `backend/` |
| 启动前端 | `npm run dev` | 根目录 |
| 停止服务 | `Ctrl + C` | 运行服务的窗口 |
| 查看数据 | `node scripts/dbManager.js stats` | `backend/` |
| 清空数据 | `node scripts/dbManager.js clear` | `backend/` |
| 创建测试数据 | `node scripts/dbManager.js test-data` | `backend/` |

---

## 常见问题

### Q: 为什么运行 dbManager 时提示表不存在？

**A:** 确保后端服务器至少启动过一次！服务器启动时会自动创建数据表。

步骤：
1. 启动服务器：`node server.js`
2. 看到"✅ 数据库模型同步完成"后，按 `Ctrl+C` 停止
3. 现在可以运行 dbManager 命令了

### Q: 端口被占用怎么办？

**A:** 检查是否已经有服务在运行：

```powershell
# 查看3000端口占用
netstat -ano | findstr :3000

# 查看5173端口占用
netstat -ano | findstr :5173
```

如果有进程占用，找到 PID 后：
```powershell
taskkill /PID <进程ID> /F
```

### Q: 如何在后台运行服务器？

**A:** 使用 PowerShell：

```powershell
# 后台启动后端
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\86138\Desktop\frontend\backend; node server.js"

# 后台启动前端
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\86138\Desktop\frontend; npm run dev"
```

---

## 推荐工作流程

1. **早上开始工作**：
   - 打开 VS Code
   - 创建 3 个终端标签
   - 终端1: 启动后端
   - 终端2: 启动前端
   - 终端3: 备用（运行其他命令）

2. **开发过程中**：
   - 保持后端和前端一直运行
   - 需要操作数据库时，在终端3运行命令

3. **下班前**：
   - 在每个终端按 `Ctrl + C` 停止服务
   - 可选：备份数据库 `node scripts/dbManager.js backup`

---

## 技巧

1. **VS Code 快捷键**：
   - `` Ctrl + ` ``: 打开/关闭终端
   - `Ctrl + Shift + 5`: 分屏终端
   - `Ctrl + Shift + \``: 新建终端

2. **PowerShell 历史命令**：
   - 按 `↑` 键查看上一条命令
   - 按 `↓` 键查看下一条命令

3. **快速定位**：
   - 创建快捷方式或别名到常用目录
