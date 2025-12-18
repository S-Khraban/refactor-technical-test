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

  async onClick(e) {
    const btn = e.target.closest('[data-variant-id]');
    if (!btn) return;

    e.preventDefault();

    const variantId = btn.dataset.variantId;
    if (!variantId) return;

    btn.setAttribute('aria-busy', 'true');
    btn.disabled = true;

    try {
      await fetch(`${window.Shopify?.routes?.root || '/'}cart/add.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: Number(variantId), quantity: 1 }),
      });

      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer && typeof cartDrawer.renderContents === 'function') {
        const res = await fetch(`${window.Shopify?.routes?.root || '/'}?sections=cart-drawer,cart-icon-bubble`);
        const data = await res.json();

        cartDrawer.renderContents(data);
        cartDrawer.open();
      } else {
        window.location.assign(`${window.Shopify?.routes?.root || '/'}cart`);
      }
    } catch (err) {
      console.error(err);
      btn.disabled = false;
    } finally {
      btn.removeAttribute('aria-busy');
    }
  }
}

customElements.define('featured-products', FeaturedProducts);
