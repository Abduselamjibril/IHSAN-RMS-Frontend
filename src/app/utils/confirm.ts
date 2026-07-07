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

    // 3. Set HTML content
    container.innerHTML = `
      <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; gap: 10px;">
        <span class="material-icons-outlined" style="color: var(--color-lost); font-size: 24px;">warning</span>
        <h2 style="font-size: 16px; font-weight: 700; margin: 0; color: var(--text-main); font-family: var(--font-family);">${title}</h2>
      </div>
      <div style="padding: 24px; font-size: 14px; color: var(--text-secondary); line-height: 1.5; font-family: var(--font-family); text-align: left;">
        ${message}
      </div>
      <div style="padding: 16px 24px; background-color: var(--bg-main); border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 12px;">
        <button id="custom-confirm-cancel" class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px; border-radius: 6px; cursor: pointer;">Cancel</button>
        <button id="custom-confirm-ok" class="btn btn-primary" style="padding: 8px 16px; font-size: 13px; background-color: var(--color-lost); color: white; border-radius: 6px; cursor: pointer;">Yes, Confirm</button>
      </div>
    `;

    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // 4. Attach events
    const cancelBtn = container.querySelector('#custom-confirm-cancel') as HTMLButtonElement;
    const okBtn = container.querySelector('#custom-confirm-ok') as HTMLButtonElement;

    const cleanup = (result: boolean) => {
      document.body.removeChild(overlay);
      resolve(result);
    };

    // Close on overlay click (optional, but good UX)
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

    container.innerHTML = `
      <div style="background: linear-gradient(135deg, ${headerColor} 0%, #111827 100%); padding: 28px 24px; text-align: center; color: white;">
        <span class="material-icons-outlined" style="font-size: 54px; display: block; margin-bottom: 8px; color: white;">${icon}</span>
        <h2 style="font-size: 18px; font-weight: 700; margin: 0; color: white; font-family: var(--font-family);">${title}</h2>
      </div>
      <div style="padding: 24px; font-size: 14px; color: var(--text-secondary); line-height: 1.5; font-family: var(--font-family); text-align: center;">
        ${message}
      </div>
      <div style="padding: 16px 24px; background-color: var(--bg-main); border-top: 1px solid var(--border-color); display: flex; justify-content: center;">
        <button id="custom-alert-ok" class="btn btn-primary" style="padding: 8px 32px; font-size: 13px; background: linear-gradient(135deg, var(--brand-primary) 0%, #3b2b80 100%); color: white; border-radius: 8px; border: none; cursor: pointer; box-shadow: 0 4px 10px rgba(76, 58, 147, 0.25); font-weight: 600;">OK</button>
      </div>
    `;

    overlay.appendChild(container);
    document.body.appendChild(overlay);

    const okBtn = container.querySelector('#custom-alert-ok') as HTMLButtonElement;

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

