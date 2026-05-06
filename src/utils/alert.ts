/**
 * Global alert utility module
 *
 * @example
 * // Basic usage
 * import { alertUseMui } from '@/utils/alert';
 *
 * // Success alert
 * alertUseMui('Operation successful!');
 *
 * // Error alert
 * alertUseMui('Operation failed!', 3000, { kind: 'error' });
 *
 * // Warning alert
 * alertUseMui('Please note!', 2500, { kind: 'warning' });
 *
 * // Info alert
 * alertUseMui('This is an info message', 2000, { kind: 'info' });
 *
 * // Non-auto-dismiss alert
 * const closeAlert = alertUseMui('Requires manual dismiss', 0, { kind: 'warning' });
 * // Manually dismiss later
 * closeAlert();
 */

// Alert type
type AlertKind = 'success' | 'error' | 'warning' | 'info';

// Global container management
let alertContainer: HTMLElement | null = null;
let alertCount = 0;

/**
 * Get or create alert container
 */
const getAlertContainer = () => {
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    alertContainer.className = 'mui-alert-wrapper';
    alertContainer.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
    document.body.appendChild(alertContainer);
  }
  return alertContainer;
};

/**
 * Create icon
 */
const createIcon = (kind: AlertKind) => {
  const iconElement = document.createElement('span');
  iconElement.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    margin-right: 6px;
    margin-top: 2px;
    flex-shrink: 0;
  `;

  const icons = {
    success: {
      html: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm3.5 6.1L7.1 10.4c-.2.2-.4.3-.7.3s-.5-.1-.7-.3L3.5 8.2c-.4-.4-.4-1 0-1.4s1-.4 1.4 0L6.4 8.3l3.7-3.7c.4-.4 1-.4 1.4 0s.4 1 0 1.5z"/>
      </svg>`,
      color: '#52c41a'
    },
    error: {
      html: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm3.5 10.1c.4.4.4 1 0 1.4-.2.2-.4.3-.7.3s-.5-.1-.7-.3L8 9.4l-2.1 2.1c-.2.2-.4.3-.7.3s-.5-.1-.7-.3c-.4-.4-.4-1 0-1.4L6.6 8 4.5 5.9c-.4-.4-.4-1 0-1.4s1-.4 1.4 0L8 6.6l2.1-2.1c.4-.4 1-.4 1.4 0s.4 1 0 1.4L9.4 8l2.1 2.1z"/>
      </svg>`,
      color: '#ff4d4f'
    },
    warning: {
      html: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8.7.1c-.4-.2-.9-.2-1.3 0-.2.1-.4.2-.5.4L.2 13.2c-.2.4-.2.8 0 1.2.1.2.3.3.5.4.2.1.4.1.6.1h13.4c.2 0 .4 0 .6-.1.2-.1.4-.2.5-.4.2-.4.2-.8 0-1.2L8.2.5c-.1-.2-.3-.3-.5-.4zM9 12H7v-2h2v2zm0-3H7V5h2v4z"/>
      </svg>`,
      color: '#faad14'
    },
    info: {
      html: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 12H7V7h2v5zm0-6H7V4h2v2z"/>
      </svg>`,
      color: '#1890ff'
    }
  };

  const iconConfig = icons[kind] || icons.success;
  iconElement.innerHTML = iconConfig.html;
  iconElement.style.color = iconConfig.color;

  return iconElement;
};

/**
 * Get border color
 */
const getBorderColor = (kind: AlertKind): string => {
  const colors = {
    success: '#52c41a40',
    error: '#ff4d4f40',
    warning: '#faad1440',
    info: '#1890ff40'
  };
  return colors[kind] || colors.success;
};

/**
 * Generic alert function
 * @param msg Alert message
 * @param time Display duration (ms), 0 means no auto-dismiss
 * @param objConfig Configuration object
 * @returns Returns a close function that can be called to dismiss the alert manually
 */
export const alertUseMui = (
  msg: string,
  time: number = 2500,
  objConfig?: {
    kind?: AlertKind;
    zIndex?: number;
    extraConfig?: any;
  }
) => {
  const _kind = objConfig?.kind ?? 'success';
  const _zIndex = objConfig?.zIndex ?? 9999;
  const _duration = time;

  // Get container
  const container = getAlertContainer();
  container.style.zIndex = String(_zIndex);

  // Create alert element
  const alertElement = document.createElement('div');
  alertElement.className = 'mui-alert-item';
  alertElement.setAttribute('data-alert-id', String(++alertCount));

  alertElement.style.cssText = `
    max-width: 500px;
    width: fit-content;
    border: 1px solid ${getBorderColor(_kind)};
    border-radius: 6px;
    box-shadow: 0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08), 0 9px 28px 8px rgba(0,0,0,.05);
    font-size: 14px;
    font-weight: 400;
    padding: 10px 16px;
    display: inline-flex;
    align-items: flex-start;
    gap: 8px;
    cursor: pointer;
    pointer-events: auto;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.5715;
    background-color: #ffffff;
    color: #000000d9;
    opacity: 0;
    transform: translateY(-30px) scale(0.9);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-sizing: border-box;
  `;

  // Add icon
  const iconElement = createIcon(_kind);

  // Add message text
  const messageSpan = document.createElement('span');
  messageSpan.textContent = msg;
  messageSpan.style.cssText = `
    flex: 1;
    min-width: 0;
    text-align: left;
    word-wrap: break-word;
    word-break: break-word;
    white-space: normal;
  `;

  alertElement.appendChild(iconElement);
  alertElement.appendChild(messageSpan);

  // Append to container
  container.appendChild(alertElement);

  // Entrance animation
  requestAnimationFrame(() => {
    alertElement.style.opacity = '1';
    alertElement.style.transform = 'translateY(0) scale(1)';
  });

  // Close handler
  const handleClose = () => {
    alertElement.style.opacity = '0';
    alertElement.style.transform = 'translateY(-20px) scale(0.9)';

    setTimeout(() => {
      if (alertElement.parentNode) {
        container.removeChild(alertElement);

        // Remove container if empty
        if (container.children.length === 0) {
          document.body.removeChild(container);
          alertContainer = null;
        }
      }
    }, 300);
  };

  // Dismiss on click
  alertElement.addEventListener('click', handleClose);

  // Auto dismiss
  if (_duration > 0) {
    setTimeout(handleClose, _duration);
  }

  return handleClose;
};

/**
 * Clean up all alerts
 */
export const cleanupAlerts = () => {
  if (alertContainer && alertContainer.parentNode) {
    document.body.removeChild(alertContainer);
    alertContainer = null;
  }
  alertCount = 0;
};

// Convenience methods
export const alertSuccess = (msg: string, time: number = 2500) => 
  alertUseMui(msg, time, { kind: 'success' });

export const alertError = (msg: string, time: number = 3000) => 
  alertUseMui(msg, time, { kind: 'error' });

export const alertWarning = (msg: string, time: number = 2500) => 
  alertUseMui(msg, time, { kind: 'warning' });

export const alertInfo = (msg: string, time: number = 2000) => 
  alertUseMui(msg, time, { kind: 'info' });
