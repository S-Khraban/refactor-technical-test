class FeaturedProducts extends HTMLElement {
  constructor() {
    super();
    this.onClick = this.onClick.bind(this);
  }

  connectedCallback() {
    this.addEventListener('click', this.onClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
  }

  get root() {
    return window.Shopify?.routes?.root || '/';
  }

  async addToCart(variantId) {
    const res = await fetch(`${this.root}cart/add.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: Number(variantId), quantity: 1 }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.description || data?.message || 'Failed to add to cart');
    }

    return data;
  }

  async refreshDrawer() {
    const cartDrawer = document.querySelector('cart-drawer');
    if (!cartDrawer || typeof cartDrawer.renderContents !== 'function') return false;

    const res = await fetch(`${this.root}?sections=cart-drawer,cart-icon-bubble`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return false;

    const sections = await res.json().catch(() => null);
    if (!sections) return false;

    cartDrawer.renderContents(sections);
    cartDrawer.open();
    return true;
  }

  async refreshHeader() {
    const res = await fetch(`${this.root}?sections=header`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return false;

    const sections = await res.json().catch(() => null);
    const html = sections?.header;
    if (!html) return false;

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const current = document.querySelector('.header-wrapper') || document.querySelector('header');
    const next = doc.querySelector('.header-wrapper') || doc.querySelector('header');

    if (current && next) {
      current.replaceWith(next);
      return true;
    }

    return false;
  }

  removeAddedItem(btn) {
    const item =
      btn.closest('.featured-products__item') || btn.closest('li') || btn.closest('article');

    if (item) item.remove();
  }

  async onClick(e) {
    const btn = e.target.closest('[data-variant-id]');
    if (!btn || !this.contains(btn)) return;

    e.preventDefault();

    const variantId = btn.dataset.variantId;
    if (!variantId) return;

    btn.setAttribute('aria-busy', 'true');
    btn.disabled = true;

    try {
      await this.addToCart(variantId);
      this.removeAddedItem(btn);

      const drawerUpdated = await this.refreshDrawer();
      if (!drawerUpdated) {
        await this.refreshHeader();
      }
    } catch (err) {
      console.error('[FeaturedProducts] addToCart error:', err);
      btn.disabled = false;
    } finally {
      btn.removeAttribute('aria-busy');
    }
  }
}

if (!customElements.get('featured-products')) {
  customElements.define('featured-products', FeaturedProducts);
}
