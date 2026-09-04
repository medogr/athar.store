/* =========================================================
   api.js — كل الاتصال بالباك إند (Google Apps Script) في مكان واحد
   ========================================================= */

// 👇 حط هنا رابط الـ Web App بعد ما تنشره من Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbxqCnjJtOOgrhZBmnhh8N-kaGKiSke5wPLzyJL0Gxa5nPrHikaQvVqwVDYkLASk_vUI/exec";

const API = (() => {
  const CACHE_KEY = "athar_products_cache";
  const CACHE_TTL = 5 * 60 * 1000; // 5 دقايق
  const isConfigured = () => API_URL && !API_URL.includes("PASTE_YOUR");

  // ---------- طلب GET عام ----------
  async function get(params) {
    if (!isConfigured()) return mockGet(params);
    const url = new URL(API_URL);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { method: "GET", redirect: "follow" });
    if (!res.ok) throw new Error("فشل الاتصال بالخادم");
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "خطأ غير معروف");
    return json.data;
  }

  // ---------- كاش خفيف للمنتجات ----------
  function readCache() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { t, data } = JSON.parse(raw);
      return Date.now() - t < CACHE_TTL ? data : null;
    } catch { return null; }
  }
  function writeCache(data) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data })); } catch {}
  }

  // ---------- الدوال العامة ----------
  async function getProducts(force = false) {
    if (!force) { const c = readCache(); if (c) return c; }
    const data = await get({ action: "getProducts" });
    writeCache(data);
    return data;
  }

  async function getCategories() {
    return get({ action: "getCategories" });
  }

  async function getOffers() {
    return get({ action: "getOffers" });
  }

  async function searchProducts(q) {
    return get({ action: "searchProducts", q });
  }

  async function getProductsByCategory(cat) {
    return get({ action: "getProductsByCategory", cat });
  }

  // بنجيب المنتج من الكاش المحلي (أسرع) وإلا نطلبه من الخادم
  async function getProduct(id) {
    const list = await getProducts();
    const found = list.find(p => String(p.id) === String(id));
    if (found) return found;
    try { return await get({ action: "getProduct", id }); } catch { return null; }
  }

  // ---------- إنشاء طلب (POST) ----------
  // ملاحظة: بنبعت كـ text/plain علشان نتجنب الـ CORS preflight مع Apps Script
  async function createOrder(order) {
    if (!isConfigured()) return mockPost(order);
    const res = await fetch(API_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(order)
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "تعذّر تسجيل الطلب");
    return json.data; // { orderNo, createdAt }
  }

  // =========================================================
  // وضع المعاينة (Mock) — يشتغل تلقائيًا لو API_URL لسه ما اتحطش
  // علشان تقدر تشوف التصميم قبل ما تربط الباك إند
  // =========================================================
  const MOCK = [
    { id: 2, name: "نوت بوك «صفحة جديدة» A5", category: "Notebooks", price: 180, salePrice: 145, images: ["https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800"], description: "دفتر بغلاف قماشي وورق كريمي 100 جرام، 160 صفحة مسطّرة بنقاط.", available: true, featured: true },
    { id: 3, name: "نوت بوك جيب «أثر»", category: "Notebooks", price: 95, salePrice: null, images: ["https://images.unsplash.com/photo-1544816155-12df9643f363?w=800"], description: "دفتر صغير يناسب الشنطة، 80 صفحة سادة.", available: true, featured: false },
    { id: 4, name: "تو-دو ليست أسبوعية", category: "TodoLists", price: 70, salePrice: 55, images: ["https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800"], description: "دفتر مهام أسبوعي بـ52 ورقة قابلة للنزع.", available: true, featured: true },
    { id: 5, name: "بلوك مهام يومي", category: "TodoLists", price: 60, salePrice: null, images: ["https://images.unsplash.com/photo-1517842645767-c639042777db?w=800"], description: "100 ورقة، تصميم بسيط للتركيز على 3 أولويات.", available: true, featured: false },
    { id: 6, name: "طقم أقلام جل «حبر»", category: "Pens", price: 120, salePrice: null, images: ["https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800"], description: "5 أقلام جل بألوان ترابية، سن 0.5.", available: true, featured: true },
    { id: 7, name: "قلم حبر سائل خشبي", category: "Pens", price: 220, salePrice: 189, images: ["https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=800"], description: "جسم خشب زان طبيعي مع سن معدني، يأتي في علبة هدية.", available: false, featured: false },
    { id: 8, name: "مج سيراميك «قهوة وأثر»", category: "Mugs", price: 150, salePrice: null, images: ["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800"], description: "مج سيراميك 350 مل بطباعة داخلية، آمن لغسالة الأطباق.", available: true, featured: true },
    { id: 9, name: "بوستر «ابدأ من هنا» 50×70", category: "Posters", price: 130, salePrice: 99, images: ["https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800"], description: "طباعة على ورق مطفي 250 جرام، ألوان ثابتة.", available: true, featured: false }
  ].map(normalize);

  function normalize(p) {
    const hasOffer = p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price;
    return {
      ...p,
      hasOffer,
      finalPrice: hasOffer ? p.salePrice : p.price,
      discountPct: hasOffer ? Math.round((1 - p.salePrice / p.price) * 100) : 0,
      image: (p.images && p.images[0]) || ""
    };
  }

  async function mockGet({ action, q, cat, id }) {
    await new Promise(r => setTimeout(r, 400));
    switch (action) {
      case "getProducts": return MOCK;
      case "getOffers": return MOCK.filter(p => p.hasOffer);
      case "searchProducts": return MOCK.filter(p => p.name.includes(q || ""));
      case "getProductsByCategory": return MOCK.filter(p => p.category === cat);
      case "getProduct": return MOCK.find(p => String(p.id) === String(id)) || null;
      case "getCategories": {
        const map = {};
        MOCK.forEach(p => { (map[p.category] ||= { name: p.category, count: 0, image: p.image }).count++; });
        return Object.values(map);
      }
      default: throw new Error("Unknown action");
    }
  }
  async function mockPost(order) {
    await new Promise(r => setTimeout(r, 700));
    console.info("[MOCK] order:", order);
    return { orderNo: "ATH-DEMO-" + Math.floor(Math.random() * 900 + 100), createdAt: new Date().toISOString() };
  }
  // =========================================================
  // الأدمن — كل العمليات POST ومعاها المفتاح
  // =========================================================
  const ADMIN_KEY_STORE = "athar_admin_key";
  const adminKey = () => sessionStorage.getItem(ADMIN_KEY_STORE) || "";

  async function admin(action, payload = {}) {
    if (!isConfigured()) return mockAdmin(action, payload);
    const res = await fetch(API_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, key: adminKey(), ...payload })
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "فشل تنفيذ العملية");
    // أي تعديل في المنتجات → امسح الكاش علشان الموقع يشوف الجديد فورًا
    if (["addProduct", "updateProduct", "deleteProduct"].includes(action)) sessionStorage.removeItem(CACHE_KEY);
    return json.data;
  }

  const Admin = {
    async login(key) {
      sessionStorage.setItem(ADMIN_KEY_STORE, key);
      try { await admin("adminLogin"); return true; }
      catch (e) { sessionStorage.removeItem(ADMIN_KEY_STORE); throw e; }
    },
    logout: () => sessionStorage.removeItem(ADMIN_KEY_STORE),
    isLoggedIn: () => !!adminKey(),
    getOrders: () => admin("getOrders"),
    updateOrderStatus: (orderNo, status) => admin("updateOrderStatus", { orderNo, status }),
    addProduct: (product) => admin("addProduct", { product }),
    updateProduct: (id, product) => admin("updateProduct", { id, product }),
    deleteProduct: (id) => admin("deleteProduct", { id })
  };

  // Mock للأدمن (المفتاح في وضع المعاينة: admin)
  const MOCK_ORDERS = [
    { row: 2, orderNo: "ATH-0001", customer: "سارة أحمد", phone: "01012345678", address: "القاهرة - مدينة نصر - ش عباس العقاد 12", product: "مج سيراميك «قهوة وأثر»", quantity: 2, createdAt: "2024-05-01 14:20:00", status: "جديد" },
    { row: 3, orderNo: "ATH-0002", customer: "محمد علي", phone: "01198765432", address: "الجيزة - الدقي - ش التحرير 45", product: "نوت بوك «صفحة جديدة» A5", quantity: 1, createdAt: "2024-05-02 09:05:00", status: "تم الشحن" }
  ];
  async function mockAdmin(action, payload) {
    await new Promise(r => setTimeout(r, 400));
    if (adminKey() !== "admin") throw new Error("غير مصرح: مفتاح الأدمن غير صحيح (في وضع المعاينة استخدم: admin)");
    switch (action) {
      case "adminLogin": return { authorized: true };
      case "getOrders": return [...MOCK_ORDERS].reverse();
      case "updateOrderStatus": { const o = MOCK_ORDERS.find(x => x.orderNo === payload.orderNo); if (o) o.status = payload.status; return payload; }
      case "addProduct": { const id = Math.max(...MOCK.map(p => p.id)) + 1; MOCK.push(normalize({ id, ...payload.product, images: String(payload.product.images).split(",").map(s => s.trim()).filter(Boolean) })); return { id }; }
      case "updateProduct": { const i = MOCK.findIndex(p => p.id == payload.id); if (i > -1) MOCK[i] = normalize({ id: MOCK[i].id, ...payload.product, images: String(payload.product.images).split(",").map(s => s.trim()).filter(Boolean) }); return { id: payload.id }; }
      case "deleteProduct": { const i = MOCK.findIndex(p => p.id == payload.id); if (i > -1) MOCK.splice(i, 1); return { deleted: payload.id }; }
      default: throw new Error("Unknown admin action");
    }
  }

  return { getProducts, getCategories, getOffers, searchProducts, getProductsByCategory, getProduct, createOrder, isConfigured, Admin };
  return { getProducts, getCategories, getOffers, searchProducts, getProductsByCategory, getProduct, createOrder, isConfigured };
})();
