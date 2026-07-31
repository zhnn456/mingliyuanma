/**
 * 为模拟代理商生成测试授权码
 * 运行：node scripts/generate-test-license.js
 */

const crypto = require('crypto');

const CENTER_SECRET_KEY = 'mingli-center-secret-key-v4';

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateLicense(agentId, domain) {
  const payload = {
    agentId,
    features: ['bazi', 'ziwei', 'qimen', 'meihua'],
    maxUsers: 1000,
    issuedAt: Date.now(),
    expiryAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    version: 2,
    domain,
    level: 'basic',
    monthlyFee: 99,
  };

  const payloadStr = JSON.stringify(payload);
  
  // HMAC-SHA256 签名
  const signature = crypto
    .createHmac('sha256', CENTER_SECRET_KEY)
    .update(payloadStr)
    .digest('hex');

  const license = `LIC.${base64UrlEncode(payloadStr)}.${signature}`;
  
  return { license, payload, signature };
}

// 生成测试授权码
const agentId = 'agt_test_001';
const domain = 'agent-test.zhnn456.workers.dev';
const result = generateLicense(agentId, domain);

console.log('='.repeat(60));
console.log('📋 模拟代理商测试授权码');
console.log('='.repeat(60));
console.log('');
console.log(`Agent ID: ${agentId}`);
console.log(`Domain:   ${domain}`);
console.log(`Expires:  ${new Date(result.payload.expiryAt).toLocaleDateString('zh-CN')}`);
console.log('');
console.log('🔑 授权码（复制使用）：');
console.log('');
console.log(result.license);
console.log('');
console.log('='.repeat(60));
console.log('💡 使用方法：');
console.log('   将此授权码填入 wrangler-agent-test.toml 的 APP_LICENSE_KEY');
console.log('   或在 Cloudflare Dashboard 中设置环境变量');
console.log('='.repeat(60));
