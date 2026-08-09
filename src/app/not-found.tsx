import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-4">
        <div className="text-8xl mb-6">🔮</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-xl text-gray-700 mb-4">页面未找到</h2>
        <p className="text-gray-500 mb-8">
          您访问的页面不存在，可能是链接已失效或输入了错误的地址。
          不妨试试去首页看看？
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn-primary px-8 py-3 inline-block">
            返回首页
          </Link>
          <Link href="/bazi" className="btn-outline px-8 py-3 inline-block">
            开始排盘
          </Link>
        </div>
        <div className="mt-12 text-sm text-gray-400">
          先知命理网 · 传承智慧 · 启迪人生
        </div>
      </div>
    </div>
  );
}
