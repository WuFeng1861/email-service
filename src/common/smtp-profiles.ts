/**
 * 邮箱服务商 → SMTP 连接参数。
 *
 * 抽出来是为了让「发信」和「保存凭证前的连通性校验」用同一张表，
 * 避免两处各写一份、改一个漏一个。
 *
 * 注意：key 一律小写匹配，`163Self` 和 `163` 是两个不同的服务商
 *   - 163Self：网易个人邮箱 smtp.163.com
 *   - 163    ：网易企业邮箱 smtphz.qiye.163.com
 */
export interface SmtpProfile {
  host: string;
  port: number;
  secure: boolean;
  requireTLS: boolean;
}

export const SMTP_PROFILES: Record<string, SmtpProfile> = {
  qq: { host: 'smtp.qq.com', port: 465, secure: true, requireTLS: true },
  '163self': { host: 'smtp.163.com', port: 465, secure: true, requireTLS: true },
  '163': { host: 'smtphz.qiye.163.com', port: 465, secure: true, requireTLS: true },
  ali: { host: 'smtp.aliyun.com', port: 465, secure: true, requireTLS: true },
  gmail: { host: 'smtp.gmail.com', port: 587, secure: false, requireTLS: true },
  outlook: { host: 'smtp.office365.com', port: 587, secure: false, requireTLS: true },
};

/** 未知服务商时返回一个明显不可用的占位配置，调用方需自行判断 host */
export function resolveSmtpProfile(emailCompany?: string): SmtpProfile {
  return (
    SMTP_PROFILES[String(emailCompany || '').toLowerCase()] ?? {
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      requireTLS: true,
    }
  );
}
