# 模板 4（wallet-redo）发送 API

用于发送「重新绑定验证器」链接邮件，链接为参数 `link`。

## 发送邮件

`POST https://wufeng98.cn/emailServerApi/api/email/send`

请求体：

```json
{
  "app": "WuFeng163",
  "templateId": 4,
  "templateData": {
    "link": "https://your-domain.com/rebind-validator?token=abc123"
  },
  "recipient": "user@example.com",
  "recipientName": "张三"
}
```

字段：`app` 应用标识（须与已建凭证一致）、`templateId` 模板 id（4）、`templateData.link` 跳转链接、`recipient` 收件人邮箱、`recipientName` 收件人姓名（可选）、`cc`/`bcc` 抄送/密送（可选）。

返回结果（异步发送，`status` 为 `pending` 表示已入队）：

```json
{
  "id": 1001,
  "app": "WuFeng163",
  "recipient": "张三 <user@example.com>",
  "subject": "重新绑定验证器",
  "contentType": "html",
  "templateId": 4,
  "templateData": { "link": "https://your-domain.com/rebind-validator?token=abc123" },
  "emailKeyId": 1,
  "status": "pending",
  "createdAt": "2026-08-22T08:02:00.000Z",
  "updatedAt": "2026-08-22T08:02:00.000Z"
}
```

## 查询结果

`GET https://wufeng98.cn/emailServerApi/api/email/stats`

```json
{ "total": 1, "pending": 0, "sent": 1, "failed": 0 }
```
