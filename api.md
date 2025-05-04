# NestJS 邮件服务 API 文档

## 基础信息

- 基础路径: `/api`
- 所有请求和响应均使用 JSON 格式
- 所有日期时间字段使用 ISO 8601 格式

## 邮件凭证管理 (Email Keys)

### 创建邮件凭证

- 路径: `POST /email-keys`
- 描述: 创建新的邮件发送凭证

请求体:
```json
{
  "user": "example@qq.com",
  "pass": "your-password",
  "app": "my-app",
  "emailCompany": "QQ",  // 可选值: QQ, 163, ali, gmail, outlook, other
  "limitCount": 1000     // 每日发送限制
}
```

响应:
```json
{
  "id": 1,
  "user": "example@qq.com",
  "pass": "your-password",
  "app": "my-app",
  "emailCompany": "QQ",
  "limitCount": 1000,
  "sentCount": 0,
  "lastResetDate": "2023-10-20",
  "createdAt": "2023-10-20T10:00:00Z",
  "updatedAt": "2023-10-20T10:00:00Z"
}
```

### 获取所有邮件凭证

- 路径: `GET /email-keys`
- 描述: 获取所有邮件凭证列表

### 获取特定邮件凭证

- 路径: `GET /email-keys/:id`
- 描述: 获取指定ID的邮件凭证

### 获取应用的邮件凭证

- 路径: `GET /email-keys/app/:app`
- 描述: 获取指定应用的所有邮件凭证

### 更新邮件凭证

- 路径: `PATCH /email-keys/:id`
- 描述: 更新指定ID的邮件凭证

请求体:
```json
{
  "limitCount": 2000,
  "pass": "new-password"
}
```

### 删除邮件凭证

- 路径: `DELETE /email-keys/:id`
- 描述: 删除指定ID的邮件凭证

## 邮件模板管理 (Email Templates)

### 创建邮件模板

- 路径: `POST /email-templates`
- 描述: 创建新的邮件模板

请求体:
```json
{
  "name": "Welcome Email",
  "subject": "Welcome to {{appName}}",
  "content": "<h1>Welcome {{userName}}!</h1><p>Thank you for joining {{appName}}.</p>",
  "type": "html"  // 可选值: html, text
}
```

### 获取所有模板

- 路径: `GET /email-templates`
- 描述: 获取所有邮件模板列表

### 获取特定模板

- 路径: `GET /email-templates/:id`
- 描述: 获取指定ID的邮件模板

### 更新模板

- 路径: `PATCH /email-templates/:id`
- 描述: 更新指定ID的邮件模板

### 删除模板

- 路径: `DELETE /email-templates/:id`
- 描述: 删除指定ID的邮件模板

## 邮件发送 (Email Sending)

### 发送邮件

- 路径: `POST /email/send`
- 描述: 使用模板发送邮件

请求体:
```json
{
  "app": "my-app",
  "templateId": 1,
  "templateData": {
    "userName": "John",
    "appName": "My App"
  },
  "recipient": "user@example.com",
  "recipientName": "John Doe",
  "cc": [
    {
      "email": "cc@example.com",
      "name": "CC User"
    }
  ],
  "bcc": [
    {
      "email": "bcc@example.com",
      "name": "BCC User"
    }
  ]
}
```

### 获取队列统计

- 路径: `GET /email/stats`
- 描述: 获取邮件队列统计信息

响应:
```json
{
  "total": 100,
  "pending": 10,
  "sent": 85,
  "failed": 5
}
```

### 获取应用统计

- 路径: `GET /email/app-stats`
- 参数:
    - app: 应用名称
    - startDate: 开始日期 (YYYY-MM-DD)
    - endDate: 结束日期 (YYYY-MM-DD)
- 描述: 获取指定应用的邮件发送统计

## 系统统计 (Statistics)

### 获取系统统计

- 路径: `GET /statistics`
- 描述: 获取系统整体统计信息

响应:
```json
{
  "emailQueue": {
    "total": 100,
    "pending": 10,
    "sent": 85,
    "failed": 5
  },
  "emailKeys": {
    "total": 5,
    "byApp": {
      "my-app": {
        "count": 2,
        "totalDailyLimit": 2000
      }
    }
  },
  "templates": {
    "total": 10
  }
}
```

### 获取应用统计

- 路径: `GET /statistics/app`
- 参数:
    - app: 应用名称
    - startDate: 开始日期 (YYYY-MM-DD)
    - endDate: 结束日期 (YYYY-MM-DD)
- 描述: 获取指定应用的详细统计信息

## 系统管理 (System)

### 重启系统

- 路径: `POST /system/restart-p`
- 描述: 重启系统服务
- 注意: 需要提供正确的密码

请求体:
```json
{
  "password": "your-password"
}
```
