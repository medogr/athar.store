/* =========================================================
   app.js — مكونات واجهة مشتركة بين كل الصفحات
   ========================================================= */
const Athar = (() => {

  // بيانات عرض للفئات (المفتاح = القيمة المكتوبة في عمود "الفئة" بالشيت)
  // لو كتبت فئة جديدة مش موجودة هنا، هتظهر باسمها كما هو وبأيقونة افتراضية
  const CATEGORY_META = {
    Notebooks: { label: "نوت بوك",     icon: "📓", desc: "دفاتر بورق مريح للعين وأغلفة تفضل معاك." },
    TodoLists: { label: "تو-دو ليست",  icon: "☑️", desc: "قوائم مهام تخلّي يومك واضح ومرتّب." },
    Pens:      { label: "أقلام",       icon: "🖊️", desc: "أقلام بحبر ناعم وتصميم بسيط." },
    Mugs:      { label: "مجات",        icon: "☕", desc: "مجات سيراميك بعبارات تبدأ بيها صباحك." },
    Posters:   { label: "بوسترات",     icon: "🖼️", desc: "بوسترات مطبوعة بجودة عالية لمكتبك أو غرفتك." }
  };

  const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
      <rect width="400" height="500" fill="#efe8d9"/>
      <text x="200" y="260" font-family="serif" font-size="90" fill="#1b2333" text-anchor="middle" opacity=".25">أثر</text>
    </svg>`);

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => `${Number(n || 0).toLocaleString("en-US")} ج.م`;
  const categoryMeta = (name) => CATEGORY_META[name] || { label: name || "فئة", icon: "✦", desc: "" };

  // ---------- الهيدر والفوتر ----------
  function renderLayout() {
    const header = document.getElementById("site-header");
    const footer = document.getElementById("site-footer");
    const page = location.pathname.split("/").pop() || "index.html";

    if (header) header.innerHTML = `
      <header class="site-header">
        <div class="container header-inner">
          <a href="index.html" class="logo" aria-label="أثر — الرئيسية">
            <span class="logo-mark">أ</span>
            <span><span class="logo-word">أثر</span><span class="logo-tag">مستلزمات مكتبية بروح</span></span>
          </a>
          <button class="menu-toggle" id="menuToggle" aria-label="القائمة">☰</button>
          <nav class="nav" id="mainNav">
            <a href="index.html">الرئيسية</a>
            <a href="index.html#offers">العروض</a>
            <a href="index.html#categories">الفئات</a>
            <a href="checkout.html">اطلب الآن</a>
          </nav>
          <form class="search" id="searchForm" role="search">
            <input type="search" id="searchInput" placeholder="ابحث عن منتج… (نوت بوك، مج، قلم)" autocomplete="off" aria-label="بحث">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          </form>
          <div class="header-actions">
            <a href="checkout.html" class="btn btn-primary btn-sm">اطلب الآن</a>
          </div>
        </div>
      </header>`;

    if (footer) footer.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-inner">
            <div>
              <a href="index.html" class="logo"><span class="logo-mark">أ</span><span class="logo-word">أثر</span></a>
              <p>منتجات مكتبية مصممة بعناية علشان تسيب أثر في يومك — من أول صفحة لآخر رشفة قهوة.</p>
            </div>
            <div>
              <h4>الفئات</h4>
              <ul>${Object.keys(CATEGORY_META).map(k => `<li><a href="category.html?cat=${encodeURIComponent(k)}">${CATEGORY_META[k].label}</a></li>`).join("")}</ul>
            </div>
            <div>
              <h4>روابط</h4>
              <ul>
                <li><a href="index.html#offers">العروض</a></li>
                <li><a href="checkout.html">اطلب الآن</a></li>
                <li><a href="https://wa.me/2010XXXXXXXX" target="_blank" rel="noopener">تواصل واتساب</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${new Date().getFullYear()} أثر — جميع الحقوق محفوظة</span>
            <span>صُنع بحب في مصر</span>
          </div>
        </div>
      </footer>`;

    const toggle = document.getElementById("menuToggle");
    if (toggle) toggle.addEventListener("click", () => document.getElementById("mainNav").classList.toggle("is-open"));
  }

  // ---------- البحث ----------
  // handler(q): لو موجود، بحث حي داخل الصفحة. لو null، بيحوّل للرئيسية بـ ?q=
  function initSearch(handler) {
    const form = document.getElementById("searchForm");
    const input = document.getElementById("searchInput");
    if (!form || !input) return;
    let timer;
    form.addEventListener("submit", e => {
      e.preventDefault();
      const q = input.value.trim();
      if (handler) handler(q);
      else location.href = `index.html?q=${encodeURIComponent(q)}`;
    });
    if (handler) {
      input.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => handler(input.value), 120);
      });
    }
  }
  function setSearch(q) {
    const input = document.getElementById("searchInput");
    if (input) { input.value = q; input.dispatchEvent(new Event("input")); }
  }
  const getInitialQuery = () => new URLSearchParams(location.search).get("q") || "";

  // ---------- البطاقات ----------
  function productCard(p) {
    const meta = categoryMeta(p.category);
    return `
      <article class="product-card ${p.available ? "" : "is-out"}" data-name="${esc(p.name)}">
        <a href="product.html?id=${p.id}" class="product-media">
          <img src="${esc(p.image || PLACEHOLDER)}" alt="${esc(p.name)}" loading="lazy" onerror="this.src=Athar.PLACEHOLDER">
          ${p.hasOffer ? `<span class="badge">خصم ${p.discountPct}%</span>` : ""}
          ${!p.available ? `<span class="badge badge-out">غير متاح</span>` : ""}
        </a>
        <div class="product-body">
          <a class="product-cat" href="category.html?cat=${encodeURIComponent(p.category)}">${meta.icon} ${esc(meta.label)}</a>
          <h3 class="product-name"><a href="product.html?id=${p.id}">${esc(p.name)}</a></h3>
          <div class="price-row">
            <span class="price">${fmt(p.finalPrice)}</span>
            ${p.hasOffer ? `<span class="price-old">${fmt(p.price)}</span>` : ""}
          </div>
          <div class="product-actions">
            <a href="product.html?id=${p.id}" class="btn btn-outline">التفاصيل</a>
            ${p.available
              ? `<a href="checkout.html?id=${p.id}" class="btn btn-primary">اطلب</a>`
              : `<span class="btn btn-ghost is-disabled">غير متاح</span>`}
          </div>
        </div>
      </article>`;
  }

  function categoryCard(c) {
    const meta = categoryMeta(c.name);
    return `
      <a class="category-card" href="category.html?cat=${encodeURIComponent(c.name)}">
        <img src="${esc(c.image || PLACEHOLDER)}" alt="" loading="lazy" onerror="this.src=Athar.PLACEHOLDER">
        <div class="cat-overlay">
          <div class="cat-icon">${meta.icon}</div>
          <h3>${esc(meta.label)}</h3>
          <span>${c.count} منتج</span>
        </div>
      </a>`;
  }

  const skeletons = (n, type = "product") =>
    Array.from({ length: n }, () => `<div class="skeleton ${type === "category" ? "skeleton-cat" : "skeleton-card"}"></div>`).join("");

  const emptyState = (title, text) =>
    `<div class="empty"><div class="empty-icon">✎</div><h3>${esc(title)}</h3><p>${esc(text || "")}</p></div>`;

  // ---------- Toast ----------
  function toast(msg, type = "") {
    let el = document.querySelector(".toast");
    if (!el) { el = document.createElement("div"); el.className = "toast"; document.body.appendChild(el); }
    el.textContent = msg;
    el.className = `toast ${type}`;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 3200);
  }

  return { renderLayout, initSearch, setSearch, getInitialQuery, productCard, categoryCard, skeletons, emptyState, toast, categoryMeta, esc, fmt, PLACEHOLDER, CATEGORY_META };
})();