# 工单标注系统

一个基于Python Flask后端的工单标注系统，支持工单管理、标签标注和数据统计。

## 功能特性

- ✅ 工单列表展示和管理
- ✅ 工单详情查看和标注
- ✅ 自定义标签创建和管理
- ✅ CSV批量导入工单
- ✅ 手工新增工单
- ✅ 打标统计饼图展示
- ✅ 数据自动保存到本地文件（无需下载）

## 安装和运行

### 1. 安装Python依赖

```bash
pip install -r requirements.txt
```

### 2. 启动后端服务

```bash
python app.py
```

服务将在 `http://localhost:5000` 启动

### 3. 访问前端

在浏览器中打开 `http://localhost:5000`

## 文件说明

- `app.py` - Python Flask后端，提供RESTful API
- `index.html` - 前端页面
- `app.js` - 前端JavaScript代码
- `tickets.csv` - 工单数据文件（自动生成）
- `labels.json` - 标签列表文件（自动生成）
- `label_colors.json` - 标签颜色配置（自动生成）

## API接口

- `GET /api/tickets` - 获取所有工单
- `POST /api/tickets` - 创建新工单
- `PUT /api/tickets/<id>/label` - 更新工单标签
- `POST /api/tickets/import` - 导入CSV工单
- `GET /api/labels` - 获取所有标签
- `POST /api/labels` - 创建新标签
- `GET /api/next-id` - 获取下一个工单ID

## 数据格式

### CSV导入格式

```csv
id,title,content,label
1001,工单标题,工单内容,训练
1002,另一个工单,工单详情,预测
```

注：id和label为可选字段

## 注意事项

- 所有数据自动保存到本地文件，无需手动下载
- 刷新页面后数据不会丢失
- 标签和颜色配置持久化保存

