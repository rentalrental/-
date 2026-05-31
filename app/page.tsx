import Link from "next/link";

const slug = process.env.NEXT_PUBLIC_KITCHEN_SLUG || "warm-kitchen";

export default function HomePage() {
  return (
    <main className="landing">
      <section className="landingHero">
        <p className="eyebrow">暖厨菜单</p>
        <h1>一个固定链接，朋友提前点单。</h1>
        <p>
          菜单存在数据库里，朋友打开公网链接就能看到最新菜品；提交订单后，后台保存订单并触发通知。
        </p>
        <div className="buttonRow">
          <Link className="button primary" href={`/m/${slug}`}>
            朋友点单页
          </Link>
          <Link className="button" href="/admin">
            主人后台
          </Link>
        </div>
      </section>
    </main>
  );
}
