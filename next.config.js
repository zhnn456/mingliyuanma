const WebpackObfuscator = require('webpack-obfuscator');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
  // 生产环境前端代码混淆（保护源码，防止逆向）
  webpack: (config, { isServer, dev }) => {
    // 只在生产环境且客户端构建时混淆
    if (!dev && !isServer) {
      config.plugins.push(new WebpackObfuscator({
        rotateStringArray: true,           // 字符串数组旋转
        controlFlowFlattening: true,       // 控制流扁平化
        controlFlowFlatteningThreshold: 0.5, // 50%的代码扁平化（平衡性能）
        deadCodeInjection: false,          // 不注入死代码（减少体积）
        stringArray: true,                // 字符串数组化
        stringArrayEncoding: ['base64'],   // 字符串加密
        stringArrayThreshold: 0.75,        // 75%的字符串被加密
        debugProtection: false,            // 不开调试保护（避免影响用户）
        compact: true,                    // 压缩输出
        simplify: true,                   // 简化表达式
        identifierNamesGenerator: 'hexadecimal', // 变量名改为十六进制
      }, ['vendors*.js', 'manifest*.js', 'polyfills*.js'])); // 排除第三方库
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
