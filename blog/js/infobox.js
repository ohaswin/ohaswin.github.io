class NeoBrutalInfobox extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'icon', 'color', 'bg', 'position', 'width', 'href'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._visible = false;
  }

  connectedCallback() {
    this.render();
    this.attachEvents();
  }

  attributeChangedCallback() {
    this.render();
  }

  attachEvents() {
    // Show/hide on hover or focus
    const trigger = this.shadowRoot.querySelector('.trigger');
    const box = this.shadowRoot.querySelector('.infobox');
    if (!trigger || !box) return;

    trigger.addEventListener('mouseenter', () => this.show());
    trigger.addEventListener('mouseleave', () => this.hide());
    trigger.addEventListener('focus', () => this.show());
    trigger.addEventListener('blur', () => this.hide());
    // Touch support
    trigger.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this._visible ? this.hide() : this.show();
    });
    // Optional: click outside to close
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target)) this.hide();
    });
  }

  show() {
    this._visible = true;
    this.shadowRoot.querySelector('.infobox').classList.add('visible');
  }

  hide() {
    this._visible = false;
    this.shadowRoot.querySelector('.infobox').classList.remove('visible');
  }

  render() {
    const title = this.getAttribute('title') || 'Info';
    const icon = this.getAttribute('icon') || '💡';
    const color = this.getAttribute('color') || '#0a7cff';
    const bg = this.getAttribute('bg') || '#e0f7fa';
    const position = this.getAttribute('position') || 'top';
    const width = this.getAttribute('width') || '320px';
    const href = this.getAttribute('href') || '';
    const content = this.innerHTML;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --neo-shadow: 4px 4px 0 #000, 8px 8px 0 #0ff2, 0 0 0 #fff;
          --neo-radius: 18px;
          --neo-border: 3px solid #000;
          --neo-bg: ${bg};
          --neo-color: ${color};
          display: inline-block;
          position: relative;
          font-family: 'Segoe UI', 'Arial', 'Frutiger', sans-serif;
        }
        .trigger {
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5em;
          font-weight: bold;
          background: var(--neo-bg);
          color: var(--neo-color);
          border: var(--neo-border);
          border-radius: var(--neo-radius);
          box-shadow: var(--neo-shadow);
          padding: 0.5em 1em;
          font-size: 1em;
          transition: background 0.2s, color 0.2s;
          outline: none;
        }
        .trigger:focus {
          outline: 2px dashed var(--neo-color);
        }
        .infobox {
          position: absolute;
          ${position === 'top' ? 'bottom: 120%; left: 50%; transform: translateX(-50%);' : ''}
          ${position === 'bottom' ? 'top: 120%; left: 50%; transform: translateX(-50%);' : ''}
          ${position === 'left' ? 'right: 110%; top: 50%; transform: translateY(-50%);' : ''}
          ${position === 'right' ? 'left: 110%; top: 50%; transform: translateY(-50%);' : ''}
          min-width: 220px;
          max-width: 90vw;
          width: ${width};
          background: var(--neo-bg);
          color: #222;
          border: var(--neo-border);
          border-radius: var(--neo-radius);
          box-shadow: var(--neo-shadow);
          padding: 1em 1.2em;
          z-index: 999;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.18s cubic-bezier(.4,2,.6,1), transform 0.18s;
          font-size: 1em;
          line-height: 1.5;
          display: flex;
          flex-direction: column;
          gap: 0.5em;
        }
        .infobox.visible {
          opacity: 1;
          pointer-events: auto;
        }
        .infobox-title {
          font-size: 1.1em;
          font-weight: 700;
          margin-bottom: 0.2em;
          display: flex;
          align-items: center;
          gap: 0.5em;
          color: var(--neo-color);
          text-shadow: 1px 1px 0 #fff, 2px 2px 0 #0002;
        }
        .infobox-content {
          font-size: 0.98em;
          color: #222;
        }
        .infobox-link {
          margin-top: 0.5em;
          font-size: 0.95em;
          color: var(--neo-color);
          text-decoration: underline;
          font-weight: 500;
        }
        /* Frutiger Aero inspired gradient accent */
        .infobox::before {
          content: "";
          display: block;
          position: absolute;
          left: 0; top: 0; right: 0; height: 8px;
          border-radius: var(--neo-radius) var(--neo-radius) 0 0;
          background: linear-gradient(90deg, #0a7cff 0%, #00eaff 100%);
          opacity: 0.7;
        }
        /* Responsive */
        @media (max-width: 600px) {
          .infobox {
            width: 95vw !important;
            min-width: 0;
            left: 50% !important;
            transform: translateX(-50%) !important;
            font-size: 0.98em;
          }
        }
      </style>
      <span class="trigger" tabindex="0">
        <span class="icon">${icon}</span>
        <span class="label">${title}</span>
      </span>
      <div class="infobox" role="tooltip" aria-live="polite">
        <div class="infobox-title">
          <span class="icon">${icon}</span>
          <span>${title}</span>
        </div>
        <div class="infobox-content">${content}</div>
        ${href ? `<a class="infobox-link" href="${href}" target="_blank" rel="noopener">Learn more</a>` : ''}
      </div>
    `;
  }
}

customElements.define('neo-brutal-infobox', NeoBrutalInfobox);