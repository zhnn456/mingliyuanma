// (public) 组路由 ISR：品牌名等动态元数据定期重新生成
export const revalidate = 60;

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
