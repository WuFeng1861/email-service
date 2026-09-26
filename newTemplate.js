// 创建 wallet-redo 邮件模板脚本
// 运行: node newTemplate.js
const BASE_URL = 'https://wufeng98.cn/emailServerApi/api'; // 如服务在其他地址，请修改这里

// 邮件模板：用于发送"重新绑定验证器"链接邮件，{{link}} 为链接参数
const template = {
  name: 'wallet-redo',
  subject: '重新绑定验证器',
  content:
    "<div style=\"background-color:#eef1f7; padding:32px 16px;\"><div style=\"max-width:600px; margin:0 auto; background-color:#ffffff; border-radius:16px; overflow:hidden; font-family:'Segoe UI',Arial,'PingFang SC','Microsoft YaHei',sans-serif;\"><div style=\"background:linear-gradient(135deg,#1d2b64,#2b3fd6 60%,#5a4fe0); padding:32px 40px; text-align:center;\"><span style=\"display:inline-block; background:rgba(255,255,255,0.14); border:1px solid rgba(255,255,255,0.3); border-radius:999px; padding:6px 14px; color:#ffffff; font-size:12px; letter-spacing:2px; font-weight:600;\">SECURITY</span><h1 style=\"margin:16px 0 0; color:#ffffff; font-size:24px; line-height:1.4;\">重新绑定验证器</h1><p style=\"margin:6px 0 0; color:rgba(255,255,255,0.7); font-size:13px;\">Authenticator Rebind</p></div><div style=\"padding:32px 40px 28px;\"><p style=\"margin:0 0 12px; color:#26313f; font-size:15px; line-height:1.8;\">您好！</p><p style=\"margin:0 0 28px; color:#5b6b7f; font-size:15px; line-height:1.9;\">检测到您的验证器需要重新绑定。请点击下方按钮，进入安全页面完成验证器绑定，以保障您的账户安全。链接自发送起 24 小时内有效。</p><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" align=\"center\" style=\"margin:0 auto 28px;\"><tr><td style=\"border-radius:12px; background:linear-gradient(135deg,#2b3fd6,#5a4fe0); box-shadow:0 6px 16px rgba(43,63,214,0.3);\"><a href=\"{{link}}\" target=\"_blank\" style=\"display:inline-block; padding:14px 44px; color:#ffffff; text-decoration:none; font-size:16px; font-weight:600; border-radius:12px;\">立即重新绑定验证器</a></td></tr></table><p style=\"margin:0 0 6px; color:#9aa7b8; font-size:12px; text-align:center;\">按钮无法点击？请复制以下链接到浏览器打开：</p><p style=\"margin:0 0 28px; color:#3b4fd8; font-size:13px; word-break:break-all; text-align:center;\">{{link}}</p><div style=\"border-top:1px solid #e6eaf2; margin:0 0 20px;\"></div><p style=\"margin:0; color:#8b97a8; font-size:12px; line-height:1.8;\">此邮件由系统自动发送，请勿直接回复。若您未发起此操作，请忽略本邮件，并建议尽快检查您的账户安全。</p></div><div style=\"background-color:#f7f9fc; padding:16px 40px; text-align:center;\"><p style=\"margin:0; color:#a7b1bf; font-size:12px;\">Wallet Service · 安全邮件 · 谨防钓鱼</p></div></div></div>",
  type: 'html',
};

async function createTemplate() {
  try {
    const res = await fetch(`${BASE_URL}/email-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`创建模板失败 (HTTP ${res.status}): ${JSON.stringify(data)}`);
    }

    console.log('模板创建成功，ID:', data.id);
    console.log('模板信息:', data);
  } catch (err) {
    console.error('创建模板出错:', err.message);
  }
}

createTemplate();
