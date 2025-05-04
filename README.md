# NestJS Email Service

A complete email sending service built with NestJS and MySQL, featuring template-based emails, queue system, and custom caching.

## Features

- Email credentials management with daily sending limits
- Template-based email sending with HTML and text support
- Asynchronous email queue to prevent API blocking
- Custom in-memory caching implementation
- Comprehensive statistics tracking
- Multiple email providers support (QQ, 163, Ali, Gmail, Outlook)

## API Endpoints

### Email Keys

- `POST /api/email-keys` - Create a new email credential
- `GET /api/email-keys` - Get all email credentials
- `GET /api/email-keys/:id` - Get a specific email credential
- `GET /api/email-keys/app/:app` - Get email credentials for a specific app
- `PATCH /api/email-keys/:id` - Update an email credential
- `DELETE /api/email-keys/:id` - Delete an email credential

### Email Templates

- `POST /api/email-templates` - Create a new email template
- `GET /api/email-templates` - Get all email templates
- `GET /api/email-templates/:id` - Get a specific email template
- `PATCH /api/email-templates/:id` - Update an email template
- `DELETE /api/email-templates/:id` - Delete an email template

### Email Sending

- `POST /api/email/send` - Send an email using a template
- `GET /api/email/stats` - Get overall email queue statistics
- `GET /api/email/app-stats` - Get email statistics for a specific app

### Statistics

- `GET /api/statistics` - Get overall system statistics
- `GET /api/statistics/app` - Get statistics for a specific app

## Setup

1. Clone the repository
2. Configure .env file with your database settings
3. Run `npm install`
4. Run `npm run start:dev` for development or `npm run start:prod` for production

## Example Email Send Request

```json
{
  "app": "my-app",
  "templateId": 1,
  "templateData": {
    "name": "John Doe",
    "confirmationLink": "https://example.com/confirm"
  },
  "recipient": "user@example.com",
  "recipientName": "User Name"
}
```

## Custom Caching

The service includes a custom caching implementation that caches:

1. Email credentials
2. Email templates 
3. Email statistics

This improves performance and reduces database load for frequently accessed data.

## Email Queue

Emails are processed asynchronously in a background queue, which:

1. Stores emails in MySQL when they are submitted
2. Processes them in the background
3. Updates their status in the database
4. Respects daily sending limits for each email credential

This ensures the API remains responsive even when sending large numbers of emails.