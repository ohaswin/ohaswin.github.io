class CalloutBox extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'color', 'bg', 'border', 'width', 'bgimg', 'blur', 'imgcorner', 'imgcornerpos', 'imgcornersize'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const label = this.getAttribute('label') || 'NOTE';
    const color = this.getAttribute('color') || '#222';
    const bg = this.getAttribute('bg') || '#f6f5f3';
    const border = this.getAttribute('border') || '1px solid #d1cfc7';
    const width = this.getAttribute('width') || '100%';
    const bgimg = this.getAttribute('bgimg') || '';
    const blur = this.getAttribute('blur') || '0px';
    const imgcorner = this.getAttribute('imgcorner') || '';
    const imgcornerpos = this.getAttribute('imgcornerpos') || 'rb'; // rb, rt, lb, lt
    const imgcornersize = this.getAttribute('imgcornersize') || '';

    // Determine corner position styles
    let imgPosStyle = '';
    let imgClass = 'corner-img';
    switch (imgcornerpos) {
      case 'rt':
        imgPosStyle = 'top: -18px; right: -18px;';
        imgClass += ' corner-img-rt';
        break;
      case 'lt':
        imgPosStyle = 'top: -18px; left: -18px;';
        imgClass += ' corner-img-lt';
        break;
      case 'lb':
        imgPosStyle = 'bottom: -18px; left: -18px;';
        imgClass += ' corner-img-lb';
        break;
      default: // 'rb'
        imgPosStyle = 'bottom: -18px; right: -18px;';
        imgClass += ' corner-img-rb';
    }
    let imgSizeStyle = '';
    if (imgcornersize) {
      imgSizeStyle = `width: ${imgcornersize}; height: auto; max-width: 40%; max-height: 60%;`;
    } else {
      imgSizeStyle = 'width: 64px; height: 64px; max-width: 28%; max-height: 48%;';
    }
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin: 1.5em 0;
          width: ${width};
          max-width: 100vw;
        }
        aside.callout {
          background: ${bg}${bgimg ? ` url('${bgimg}') center/cover no-repeat` : ''};
          color: #222;
          border: ${border};
          border-radius: 0;
          box-shadow: 0 2px 8px 0 rgba(40,40,40,0.06);
          padding: 1.1em 1.3em 1.1em 1.3em;
          margin: 0;
          position: relative;
          overflow: visible;
          font-family: 'Inter', 'Noto Sans', 'Segoe UI', 'Arial', sans-serif;
          transition: background 0.2s, color 0.2s;
        }
        ${bgimg ? `
        aside.callout::before {
          content: "";
          position: absolute;
          inset: 0;
          background: inherit;
          filter: blur(${blur});
          z-index: 0;
          border-radius: 0;
        }
        .callout-content {
          position: relative;
          z-index: 1;
        }
        ` : ''}
        .callout-content {
          font-size: 1em;
          line-height: 1.6;
        }
        .callout::after {
          content: "${label}";
          position: absolute;
          top: -1.1em;
          left: 0.8em;
          background: #f6f5f3;
          color: ${color};
          border: none;
          border-radius: 0;
          font-size: 0.78em;
          font-family: 'Inter', 'JetBrains Mono', monospace;
          padding: 0.18em 0.8em;
          box-shadow: 0 1px 4px 0 rgba(40,40,40,0.07);
          letter-spacing: 0.07em;
          opacity: 0.92;
          pointer-events: none;
          z-index: 2;
        }
        .corner-img {
          position: absolute;
          object-fit: contain;
          opacity: 0.92;
          pointer-events: auto;
          z-index: 3;
          filter: drop-shadow(0 2px 8px rgba(40,40,40,0.10));
          transition: transform 0.18s;
        }
        .corner-img:hover {
          transform: scale(1.07) rotate(-2deg);
        }
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          aside.callout {
            background: #232526;
            color: #e0e0e0;
            border: 1px solid #444;
          }
          .callout::after {
            background: #232526;
            color: #e0e0e0;
            box-shadow: 0 1px 4px 0 rgba(0,0,0,0.18);
          }
          .corner-img {
            filter: invert(1) drop-shadow(0 2px 8px rgba(0,0,0,0.18));
          }
        }
        :host-context([data-theme="dark"]) aside.callout {
          background: #232526 !important;
          color: #e0e0e0 !important;
          border: 1px solid #444 !important;
        }
        :host-context([data-theme="dark"]) .callout::after {
          background: #232526 !important;
          color: #e0e0e0 !important;
          box-shadow: 0 1px 4px 0 rgba(0,0,0,0.18) !important;
        }
        :host-context([data-theme="dark"]) .corner-img {
          filter: invert(1) drop-shadow(0 2px 8px rgba(0,0,0,0.18)) !important;
        }
        @media (max-width: 600px) {
          aside.callout {
            padding: 0.9em 0.5em 0.9em 0.5em;
            font-size: 0.98em;
            border-radius: 0;
          }
          .callout::after {
            left: 0.5em;
            font-size: 0.7em;
          }
          .corner-img {
            width: 44px !important;
            height: auto !important;
            max-width: 24vw !important;
            max-height: 32vw !important;
            /* Adjust position for mobile */
          }
          .corner-img-rb { bottom: -10px !important; right: -10px !important; }
          .corner-img-rt { top: -10px !important; right: -10px !important; }
          .corner-img-lb { bottom: -10px !important; left: -10px !important; }
          .corner-img-lt { top: -10px !important; left: -10px !important; }
        }
      </style>
      <aside class="callout" role="note" aria-label="${label}">
        <div class="callout-content"><slot></slot></div>
        ${imgcorner ? `<img class="${imgClass}" src="${imgcorner}" alt="" loading="lazy" style="${imgPosStyle}${imgSizeStyle}">` : ''}
      </aside>
    `;
  }
}

customElements.define('callout-box', CalloutBox);