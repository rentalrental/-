"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { categoryLabels, type Category, type MenuItem } from "@/lib/types";

type Cart = Record<string, number>;

export function FriendMenu({ slug }: { slug: string }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [category, setCategory] = useState<Category | "all">("all");
  const [cart, setCart] = useState<Cart>({});
  const [form, setForm] = useState({ guest_name: "", note: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/menu?slug=${slug}`)
      .then((response) => response.json())
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, [slug]);

  const visible = useMemo(() => {
    return items.filter((item) => item.available && (category === "all" || item.category === category));
  }, [category, items]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([id, quantity]) => {
        const item = items.find((entry) => entry.id === id);
        return item ? { item, quantity } : null;
      })
      .filter(Boolean) as { item: MenuItem; quantity: number }[];
  }, [cart, items]);

  const total = cartItems.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);

  function changeQuantity(id: string, delta: number) {
    setCart((current) => {
      const next = Math.max(0, (current[id] || 0) + delta);
      const copy = { ...current };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  }

  async function submitOrder(event: FormEvent) {
    event.preventDefault();
    if (!cartItems.length) {
      setMessage("先选择至少一道菜");
      return;
    }

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kitchen_slug: slug,
        guest_name: form.guest_name,
        note: form.note,
        contact: "",
        requested_time: "",
        items: cartItems.map((entry) => ({ menu_item_id: entry.item.id, quantity: entry.quantity }))
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "提交失败");
      return;
    }

    setCart({});
    setForm({ guest_name: "", note: "" });
    setMessage(`订单已提交：${data.order.id}`);
  }

  return (
    <main className="appShell">
      <header className="appHeader">
        <div>
          <p className="eyebrow">朋友点单</p>
          <h1>暖厨今日菜单</h1>
          <p className="mutedText">选好菜品和时间后提交，厨房会收到通知。</p>
        </div>
      </header>

      {message ? <div className="notice">{message}</div> : null}

      <nav className="tabs">
        <button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")} type="button">
          全部
        </button>
        {(Object.keys(categoryLabels) as Category[]).map((key) => (
          <button className={category === key ? "active" : ""} key={key} onClick={() => setCategory(key)} type="button">
            {categoryLabels[key]}
          </button>
        ))}
      </nav>

      <section className="twoPane">
        <div className="grid">
          {loading ? <div className="panel">菜单加载中</div> : null}
          {!loading && !visible.length ? <div className="panel">今天这个分类暂时没有可点菜品。</div> : null}
          {visible.map((item) => (
            <article className="dish" key={item.id}>
              {item.image_url ? <img alt={item.name} className="dishImage" src={item.image_url} /> : <div className="imageFallback">{categoryLabels[item.category]}</div>}
              <div className="dishBody">
                <div className="dishTop">
                  <h3>{item.name}</h3>
                  <strong>¥{item.price}</strong>
                </div>
                <p>{item.description}</p>
                <div className="tagRow">
                  <span>{categoryLabels[item.category]}</span>
                  {item.recommended ? <span className="hot">推荐</span> : null}
                  {item.prep_time ? <span>{item.prep_time}</span> : null}
                </div>
                <div className="qty">
                  <button onClick={() => changeQuantity(item.id, -1)} type="button">−</button>
                  <span>{cart[item.id] || 0}</span>
                  <button onClick={() => changeQuantity(item.id, 1)} type="button">+</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="panel sticky">
          <h2>预订单</h2>
          <div className="orderList">
            {cartItems.length ? cartItems.map((entry) => (
              <div className="orderLine" key={entry.item.id}>
                <span>{entry.item.name} × {entry.quantity}</span>
                <strong>¥{entry.item.price * entry.quantity}</strong>
              </div>
            )) : <p className="mutedText">还没有选择菜品。</p>}
          </div>
          <div className="total">
            <span>合计</span>
            <strong>¥{total}</strong>
          </div>

          <form className="formGrid" onSubmit={submitOrder}>
            <label>
              姓名
              <input value={form.guest_name} onChange={(event) => setForm({ ...form, guest_name: event.target.value })} required />
            </label>
            <label>
              备注
              <textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="忌口、少辣、份量、取餐说明" />
            </label>
            <button className="button primary" type="submit">
              提交订单
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}
