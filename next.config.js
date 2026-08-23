const WebpackObfuscator = require('webpack-obfuscator');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 本地预览时临时改 distDir: '.next_dev' 避免安全钩子干扰
  // distDir: '.next_dev',
  images: {
    domains: ['localhost'],
  },
  // 生产环境前端代码混淆（保护源码，防止逆向）
  // 优化版：关闭控制流扁平化（最耗体积），保留变量名+字符串加密
  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      config.plugins.push(new WebpackObfuscator({
        // ===== 保留的源码保护 =====
        stringArray: true,                    // 字符串数组化
        stringArrayEncoding: ['base64'],      // 字符串 base64 加密
        stringArrayThreshold: 0.5,            // 50%字符串加密（平衡体积）
        rotateStringArray: true,              // 字符串数组旋转
        identifierNamesGenerator: 'hexadecimal', // 变量名十六进制
        compact: true,                        // 压缩输出
        simplify: true,                       // 简化表达式

        // ===== 关闭的高耗体积选项 =====
        controlFlowFlattening: false,         // 关闭控制流扁平化（节省 40% 体积）
        deadCodeInjection: false,             // 不注入死代码
        debugProtection: false,               // 不开调试保护
      }, ['vendors*.js', 'manifest*.js', 'polyfills*.js']));
    }
    return config;
  },
  // 安全响应头
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' https:",
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
  // 隐藏 X-Powered-By 头
  poweredByHeader: false,
};

module.exports = nextConfig
