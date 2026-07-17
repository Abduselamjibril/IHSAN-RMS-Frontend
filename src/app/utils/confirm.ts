export function customConfirm(message: string, title: string = 'Confirm Action'): Promise<boolean> {
  return new Promise((resolve) => {
    // 1. Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(19, 13, 43, 0.4)';
    overlay.style.backdropFilter = 'blur(4px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '99999';
    overlay.style.animation = 'fadeIn 0.2s ease-out';

    // 2. Create modal container
    const container = document.createElement('div');
    container.className = 'modal-container card';
    container.style.maxWidth = '450px';
    container.style.width = '90%';
    container.style.padding = '0';
    container.style.backgroundColor = 'var(--bg-card)';
    container.style.borderRadius = '12px';
    container.style.boxShadow = 'var(--shadow-lg)';
    container.style.overflow = 'hidden';
    container.style.animation = 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)';

    // Header
    const header = document.createElement('div');
    header.style.padding = '20px 24px';
    header.style.borderBottom = '1px solid var(--border-color)';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = '10px';

    const warnIcon = document.createElement('span');
    warnIcon.className = 'material-icons-outlined';
    warnIcon.style.color = 'var(--color-lost)';
    warnIcon.style.fontSize = '24px';
    warnIcon.textContent = 'warning';
    header.appendChild(warnIcon);

    const titleEl = document.createElement('h2');
    titleEl.style.fontSize = '16px';
    titleEl.style.fontWeight = '700';
    titleEl.style.margin = '0';
    titleEl.style.color = 'var(--text-main)';
    titleEl.style.fontFamily = 'var(--font-family)';
    titleEl.textContent = title;
    header.appendChild(titleEl);

    // Body Message
    const msgEl = document.createElement('div');
    msgEl.style.padding = '24px';
    msgEl.style.fontSize = '14px';
    msgEl.style.color = 'var(--text-secondary)';
    msgEl.style.lineHeight = '1.5';
    msgEl.style.fontFamily = 'var(--font-family)';
    msgEl.style.textAlign = 'left';
    msgEl.textContent = message; // Completely secure from DOM XSS injection

    // Footer actions
    const footer = document.createElement('div');
    footer.style.padding = '16px 24px';
    footer.style.backgroundColor = 'var(--bg-main)';
    footer.style.borderTop = '1px solid var(--border-color)';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'flex-end';
    footer.style.gap = '12px';

    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'custom-confirm-cancel';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.style.padding = '8px 16px';
    cancelBtn.style.fontSize = '13px';
    cancelBtn.style.borderRadius = '6px';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.textContent = 'Cancel';
    footer.appendChild(cancelBtn);

    const okBtn = document.createElement('button');
    okBtn.id = 'custom-confirm-ok';
    okBtn.className = 'btn btn-primary';
    okBtn.style.padding = '8px 16px';
    okBtn.style.fontSize = '13px';
    okBtn.style.backgroundColor = 'var(--color-lost)';
    okBtn.style.color = 'white';
    okBtn.style.borderRadius = '6px';
    okBtn.style.cursor = 'pointer';
    okBtn.textContent = 'Yes, Confirm';
    footer.appendChild(okBtn);

    container.appendChild(header);
    container.appendChild(msgEl);
    container.appendChild(footer);

    overlay.appendChild(container);
    document.body.appendChild(overlay);

    const cleanup = (result: boolean) => {
      document.body.removeChild(overlay);
      resolve(result);
    };

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup(false);
      }
    });

    cancelBtn.addEventListener('click', () => cleanup(false));
    okBtn.addEventListener('click', () => cleanup(true));
  });
}

export function customAlert(message: string, title: string = 'Success'): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(19, 13, 43, 0.4)';
    overlay.style.backdropFilter = 'blur(4px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '99999';
    overlay.style.animation = 'fadeIn 0.2s ease-out';

    const container = document.createElement('div');
    container.className = 'modal-container card';
    container.style.maxWidth = '400px';
    container.style.width = '90%';
    container.style.padding = '0';
    container.style.backgroundColor = 'var(--bg-card)';
    container.style.borderRadius = '16px';
    container.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.2)';
    container.style.overflow = 'hidden';
    container.style.animation = 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)';

    const isSuccess = title.toLowerCase().includes('success') || message.toLowerCase().includes('success');
    const headerColor = 'var(--brand-primary)';
    const icon = isSuccess ? 'check_circle' : 'info';

    // Build Header
    const header = document.createElement('div');
    header.style.background = `linear-gradient(135deg, ${headerColor} 0%, #111827 100%)`;
    header.style.padding = '28px 24px';
    header.style.textAlign = 'center';
    header.style.color = 'white';

    const iconEl = document.createElement('span');
    iconEl.className = 'material-icons-outlined';
    iconEl.style.fontSize = '54px';
    iconEl.style.display = 'block';
    iconEl.style.marginBottom = '8px';
    iconEl.style.color = 'white';
    iconEl.textContent = icon;
    header.appendChild(iconEl);

    const titleEl = document.createElement('h2');
    titleEl.style.fontSize = '18px';
    titleEl.style.fontWeight = '700';
    titleEl.style.margin = '0';
    titleEl.style.color = 'white';
    titleEl.style.fontFamily = 'var(--font-family)';
    titleEl.textContent = title;
    header.appendChild(titleEl);

    // Build Body
    const bodyEl = document.createElement('div');
    bodyEl.style.padding = '24px';
    bodyEl.style.fontSize = '14px';
    bodyEl.style.color = 'var(--text-secondary)';
    bodyEl.style.lineHeight = '1.5';
    bodyEl.style.fontFamily = 'var(--font-family)';
    bodyEl.style.textAlign = 'center';
    bodyEl.textContent = message; // Safe textContent protection

    // Build Footer
    const footer = document.createElement('div');
    footer.style.padding = '16px 24px';
    footer.style.backgroundColor = 'var(--bg-main)';
    footer.style.borderTop = '1px solid var(--border-color)';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'center';

    const okBtn = document.createElement('button');
    okBtn.id = 'custom-alert-ok';
    okBtn.className = 'btn btn-primary';
    okBtn.style.padding = '8px 32px';
    okBtn.style.fontSize = '13px';
    okBtn.style.background = 'linear-gradient(135deg, var(--brand-primary) 0%, #3b2b80 100%)';
    okBtn.style.color = 'white';
    okBtn.style.borderRadius = '8px';
    okBtn.style.border = 'none';
    okBtn.style.cursor = 'pointer';
    okBtn.style.boxShadow = '0 4px 10px rgba(76, 58, 147, 0.25)';
    okBtn.style.fontWeight = '600';
    okBtn.textContent = 'OK';
    footer.appendChild(okBtn);

    container.appendChild(header);
    container.appendChild(bodyEl);
    container.appendChild(footer);

    overlay.appendChild(container);
    document.body.appendChild(overlay);

    const cleanup = () => {
      document.body.removeChild(overlay);
      resolve();
    };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
      }
    });

    okBtn.addEventListener('click', () => cleanup());
  });
}

