"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { categoryLabels, statusLabels, type Category, type MenuItem, type Order, type OrderStatus } from "@/lib/types";

const kitchenSlug = process.env.NEXT_PUBLIC_KITCHEN_SLUG || "warm-kitchen";
const emptyForm = {
  id: "",
  name: "",
  category: "main" as Category,
  description: "",
  price: 0,
  image_url: "",
  prep_time: "",
  tags: "",
  available: true,
  recommended: false,
  daily_limit: 8,
  sort_order: 0
};

export function AdminApp() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [tab, setTab] = useState<"menu" | "orders" | "share">("menu");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = window.sessionStorage.getItem("warmKitchenAdminToken") || "";
    setTokenInput(saved);
    if (saved) validateAdmin(saved);
  }, []);

  const friendLink = useMemo(() => {
    if (typeof window === "undefined") return `/m/${kitchenSlug}`;
    return `${window.location.origin}/m/${kitchenSlug}`;
  }, []);

  async function loadMenu() {
    const response = await fetch(`/api/menu?slug=${kitchenSlug}`);
    const data = await response.json();
    if (response.ok) setItems(data.items || []);
    else setMessage(data.error || "菜单读取失败");
  }

  async function loadOrders(authToken = token) {
    if (!authToken) return;
    const response = await fetch(`/api/orders?slug=${kitchenSlug}`, {
      headers: { "x-admin-token": authToken }
    });
    const data = await response.json();
    if (response.ok) setOrders(data.orders || []);
    else setMessage(data.error || "订单读取失败");
  }

  async function validateAdmin(authToken: string) {
    const response = await fetch(`/api/orders?slug=${kitchenSlug}`, {
      headers: { "x-admin-token": authToken }
    });
    const data = await response.json();
    if (!response.ok) {
      setIsUnlocked(false);
      setToken("");
      window.sessionStorage.removeItem("warmKitchenAdminToken");
      setMessage(data.error === "Unauthorized" ? "主人密码不对" : data.error || "进入后台失败");
      return false;
    }
    setToken(authToken);
    setIsUnlocked(true);
    setOrders(data.orders || []);
    setMessage("已进入后台");
    await loadMenu();
    return true;
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    if (!tokenInput.trim()) {
      setMessage("请输入主人密码");
      return;
    }
    window.sessionStorage.setItem("warmKitchenAdminToken", tokenInput);
    await validateAdmin(tokenInput);
  }

  function logout() {
    window.sessionStorage.removeItem("warmKitchenAdminToken");
    setToken("");
    setTokenInput("");
    setIsUnlocked(false);
    setOrders([]);
    setMessage("已退出后台");
  }

  function editItem(item: MenuItem) {
    setForm({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description || "",
      price: item.price,
      image_url: item.image_url || "",
      prep_time: item.prep_time || "",
      tags: item.tags.join("，"),
      available: item.available,
      recommended: item.recommended,
      daily_limit: item.daily_limit || 0,
      sort_order: item.sort_order
    });
    setTab("menu");
  }

  async function saveItem(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      setMessage("先输入主人密码");
      return;
    }

    const payload = {
      kitchen_slug: kitchenSlug,
      name: form.name,
      category: form.category,
      description: form.description,
      price: Number(form.price || 0),
      image_url: form.image_url || null,
      prep_time: form.prep_time || null,
      tags: form.tags.split(/[，,]/).map((tag) => tag.trim()).filter(Boolean),
      available: form.available,
      recommended: form.recommended,
      daily_limit: Number(form.daily_limit || 0),
      sort_order: Number(form.sort_order || 0)
    };
    const isEdit = Boolean(form.id);
    const response = await fetch(isEdit ? `/api/menu/${form.id}` : "/api/menu", {
      method: isEdit ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "保存失败");
      return;
    }
    setForm(emptyForm);
    setMessage("菜品已保存");
    loadMenu();
  }

  async function deleteItem(id: string) {
    if (!token) return;
    const response = await fetch(`/api/menu/${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": token }
    });
    if (response.ok) {
      setMessage("菜品已删除");
      loadMenu();
    }
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token
      },
      body: JSON.stringify({ status })
    });
    if (response.ok) loadOrders();
  }

  return (
    <main className="appShell">
      <header className="appHeader">
        <div>
          <p className="eyebrow">主人后台</p>
          <h1>暖厨菜单管理</h1>
        </div>
        <a className="button" href={friendLink}>
          打开朋友点单页
        </a>
      </header>

      {!isUnlocked ? (
        <form className="loginBar" onSubmit={login}>
          <label>
            主人密码
            <input value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} placeholder="ADMIN_TOKEN" type="password" />
          </label>
          <button className="button primary" type="submit">
            进入后台
          </button>
        </form>
      ) : (
        <div className="loginBar">
          <div>
            <strong>已进入后台</strong>
            <p className="mutedText">现在可以编辑菜单、查看订单和复制分享链接。</p>
          </div>
          <button className="button" onClick={logout} type="button">
            退出
          </button>
        </div>
      )}

      {message ? <div className="notice">{message}</div> : null}

      {!isUnlocked ? (
        <section className="panel">
          <h2>需要主人密码</h2>
          <p className="mutedText">输入你在 Vercel 里设置的 ADMIN_TOKEN 后，后台管理功能会显示出来。</p>
        </section>
      ) : null}

      {isUnlocked ? (
        <nav className="tabs">
          <button className={tab === "menu" ? "active" : ""} onClick={() => setTab("menu")} type="button">
            菜单管理
          </button>
          <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")} type="button">
            订单板
          </button>
          <button className={tab === "share" ? "active" : ""} onClick={() => setTab("share")} type="button">
            分享
          </button>
        </nav>
      ) : null}

      {isUnlocked && tab === "menu" ? (
        <section className="twoPane">
          <div className="grid">
            {items.map((item) => (
              <article className={!item.available ? "dish muted" : "dish"} key={item.id}>
                <DishImage item={item} />
                <div className="dishBody">
                  <div className="dishTop">
                    <h3>{item.name}</h3>
                    <strong>¥{item.price}</strong>
                  </div>
                  <p>{item.description}</p>
                  <div className="tagRow">
                    <span>{categoryLabels[item.category]}</span>
                    {item.recommended ? <span className="hot">推荐</span> : null}
                    {!item.available ? <span>暂停</span> : null}
                  </div>
                  <div className="buttonRow">
                    <button className="button small" onClick={() => editItem(item)} type="button">
                      编辑
                    </button>
                    <button className="button small danger" onClick={() => deleteItem(item.id)} type="button">
                      删除
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <form className="panel formGrid" onSubmit={saveItem}>
            <h2>{form.id ? "编辑菜品" : "新增菜品"}</h2>
            <label>
              菜名
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label>
              分类
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as Category })}>
                <option value="main">主菜</option>
                <option value="dessert">甜点</option>
                <option value="drink">饮料</option>
              </select>
            </label>
            <div className="split">
              <label>
                价格
                <input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
              </label>
              <label>
                备餐时间
                <input value={form.prep_time} onChange={(event) => setForm({ ...form, prep_time: event.target.value })} />
              </label>
            </div>
            <label>
              描述
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
            <label>
              标签
              <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="少甜，冷饮，可外带" />
            </label>
            <label>
              图片 URL
              <input value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} />
            </label>
            <div className="split">
              <label>
                每日限量
                <input type="number" value={form.daily_limit} onChange={(event) => setForm({ ...form, daily_limit: Number(event.target.value) })} />
              </label>
              <label>
                排序
                <input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })} />
              </label>
            </div>
            <label className="check">
              <input checked={form.available} onChange={(event) => setForm({ ...form, available: event.target.checked })} type="checkbox" />
              可点
            </label>
            <label className="check">
              <input checked={form.recommended} onChange={(event) => setForm({ ...form, recommended: event.target.checked })} type="checkbox" />
              今日推荐
            </label>
            <div className="buttonRow">
              <button className="button primary" type="submit">
                保存
              </button>
              <button className="button" onClick={() => setForm(emptyForm)} type="button">
                新建
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {isUnlocked && tab === "orders" ? (
        <section className="panel">
          <div className="sectionHeader">
            <h2>订单板</h2>
            <button className="button" onClick={() => loadOrders()} type="button">
              刷新
            </button>
          </div>
          <div className="orderList">
            {orders.map((order) => (
              <article className="order" key={order.id}>
                <div>
                  <strong>{order.guest_name}</strong>
                  <span>{statusLabels[order.status]} · ¥{order.total}</span>
                </div>
                <p>{order.order_items?.map((item) => `${item.name_snapshot} × ${item.quantity}`).join("，")}</p>
                <p>{order.requested_time || "未填时间"} · {order.contact || "未填联系方式"}</p>
                {order.note ? <p>{order.note}</p> : null}
                <div className="buttonRow">
                  {(["accepted", "cooking", "completed", "cancelled"] as OrderStatus[]).map((status) => (
                    <button className="button small" key={status} onClick={() => updateStatus(order.id, status)} type="button">
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {isUnlocked && tab === "share" ? (
        <section className="panel">
          <h2>固定朋友链接</h2>
          <p className="mutedText">部署到公网后，这个链接可以直接发给朋友。菜单从数据库读取，你在后台改完，朋友刷新就能看到。</p>
          <textarea className="shareBox" readOnly value={friendLink} />
          <button className="button primary" onClick={() => navigator.clipboard.writeText(friendLink)} type="button">
            复制链接
          </button>
        </section>
      ) : null}
    </main>
  );
}

function DishImage({ item }: { item: MenuItem }) {
  if (!item.image_url) return <div className="imageFallback">{categoryLabels[item.category]}</div>;
  return <img alt={item.name} className="dishImage" src={item.image_url} />;
}
