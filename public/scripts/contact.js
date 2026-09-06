/**
 * Contact Form Handler
 * Handles form validation, submission, loading states, and toast notifications
 * @helix:story USER-761000
 */

(function () {
  'use strict';

  // DOM Elements
  const form = document.getElementById('contact-form');
  const formStatus = document.querySelector('.form__status');
  const submitBtn = form?.querySelector('button[type="submit"]');
  const submitBtnText = submitBtn?.querySelector('.btn__text');
  const submitBtnLoader = submitBtn?.querySelector('.btn__loader');

  // Toast container
  let toastContainer = null;

  /**
   * Initialize toast container
   */
  function initToastContainer() {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      toastContainer.setAttribute('role', 'status');
      toastContainer.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  /**
   * Show toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type: 'success' | 'error' | 'info'
   * @param {number} duration - Duration in ms (default: 5000)
   */
  function showToast(message, type = 'info', duration = 5000) {
    const container = initToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__icon">
        ${type === 'success' ? `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ` : type === 'error' ? `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        ` : `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        `}
      </span>
      <span class="toast__message">${escapeHtml(message)}</span>
      <button type="button" class="toast__close" aria-label="Close notification">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('toast--visible');
    });

    // Close button handler
    const closeBtn = toast.querySelector('.toast__close');
    closeBtn.addEventListener('click', () => removeToast(toast));

    // Auto remove
    if (duration > 0) {
      setTimeout(() => removeToast(toast), duration);
    }

    return toast;
  }

  /**
   * Remove toast with animation
   * @param {HTMLElement} toast
   */
  function removeToast(toast) {
    if (!toast || !toast.parentElement) return;
    toast.classList.remove('toast--visible');
    toast.classList.add('toast--hiding');
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 300);
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text
   * @returns {string}
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Validation rules
   */
  const validators = {
    name: {
      validate: (value) => {
        const trimmed = value.trim();
        if (!trimmed) {
          return { valid: false, message: 'Please enter your name' };
        }
        if (trimmed.length < 2) {
          return { valid: false, message: 'Name must be at least 2 characters' };
        }
        if (trimmed.length > 100) {
          return { valid: false, message: 'Name must be less than 100 characters' };
        }
        return { valid: true };
      }
    },
    email: {
      validate: (value) => {
        const trimmed = value.trim();
        if (!trimmed) {
          return { valid: false, message: 'Please enter your email address' };
        }
        // RFC 5322 simplified email regex
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
        if (!emailRegex.test(trimmed)) {
          return { valid: false, message: 'Please enter a valid email address' };
        }
        return { valid: true };
      }
    },
    message: {
      validate: (value) => {
        const trimmed = value.trim();
        if (!trimmed) {
          return { valid: false, message: 'Please enter a message' };
        }
        if (trimmed.length < 10) {
          return { valid: false, message: 'Message must be at least 10 characters' };
        }
        if (trimmed.length > 2000) {
          return { valid: false, message: 'Message must be less than 2000 characters' };
        }
        return { valid: true };
      }
    }
  };

  /**
   * Validate a single field
   * @param {HTMLElement} field - Input element
   * @returns {object} - { valid: boolean, message?: string }
   */
  function validateField(field) {
    const name = field.name;
    const value = field.value;
    const validator = validators[name];

    if (!validator) return { valid: true };

    const result = validator.validate(value);
    const formGroup = field.closest('.form-group');
    const errorElement = formGroup?.querySelector('.form__error');

    if (!result.valid) {
      field.setAttribute('aria-invalid', 'true');
      field.classList.add('input--error');
      formGroup?.classList.add('form-group--error');
      if (errorElement) {
        errorElement.textContent = result.message;
        errorElement.classList.add('form__error--visible');
        field.setAttribute('aria-describedby', `${name}-error`);
      }
    } else {
      field.removeAttribute('aria-invalid');
      field.classList.remove('input--error');
      formGroup?.classList.remove('form-group--error');
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('form__error--visible');
        field.removeAttribute('aria-describedby');
      }
    }

    return result;
  }

  /**
   * Validate all fields
   * @returns {boolean}
   */
  function validateForm() {
    if (!form) return false;

    const fields = form.querySelectorAll('input[name], textarea[name]');
    let isValid = true;

    fields.forEach(field => {
      const result = validateField(field);
      if (!result.valid) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Set loading state
   * @param {boolean} loading
   */
  function setLoadingState(loading) {
    if (!submitBtn) return;

    if (loading) {
      submitBtn.classList.add('btn--loading');
      submitBtn.setAttribute('disabled', 'true');
      if (submitBtnText) {
        submitBtn.dataset.originalText = submitBtnText.textContent;
        submitBtnText.textContent = 'Sending...';
      }
    } else {
      submitBtn.classList.remove('btn--loading');
      submitBtn.removeAttribute('disabled');
      if (submitBtnText && submitBtn.dataset.originalText) {
        submitBtnText.textContent = submitBtn.dataset.originalText;
      }
    }
  }

  /**
   * Show form status message
   * @param {string} message
   * @param {string} type - 'success' | 'error' | ''
   */
  function showStatus(message, type = '') {
    if (!formStatus) return;

    formStatus.className = 'form__status';
    if (type) {
      formStatus.classList.add(`form__status--${type}`);
    }
    formStatus.textContent = message;

    if (message) {
      formStatus.classList.add('form__status--visible');
    }
  }

  /**
   * Get form data as object
   * @returns {object}
   */
  function getFormData() {
    const data = {};
    const formData = new FormData(form);
    for (const [key, value] of formData.entries()) {
      data[key] = value.trim();
    }
    return data;
  }

  /**
   * Submit form via fetch API
   * @returns {Promise<object>}
   */
  async function submitForm() {
    const formData = getFormData();

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Server error: ${response.status}`);
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return { success: true, message: 'Thank you! Your message has been sent.' };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // Network error - likely backend not available
        throw new Error('NETWORK_ERROR');
      }
      throw error;
    }
  }

  /**
   * Fallback to mailto: submission
   */
  function fallbackToMailto() {
    const formData = getFormData();
    const subject = encodeURIComponent(`Contact from ${formData.name}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\n` +
      `Email: ${formData.email}\n\n` +
      `Message:\n${formData.message}`
    );
    const mailtoLink = `mailto:hello@lumen.app?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;

    showToast(
      'Opening email client. Please send your message or copy the pre-filled email.',
      'info',
      8000
    );
  }

  /**
   * Reset form to initial state
   */
  function resetForm() {
    if (form) {
      form.reset();
      const fields = form.querySelectorAll('input, textarea');
      fields.forEach(field => {
        field.removeAttribute('aria-invalid');
        field.classList.remove('input--error');
        const formGroup = field.closest('.form-group');
        formGroup?.classList.remove('form-group--error');
        const errorElement = formGroup?.querySelector('.form__error');
        if (errorElement) {
          errorElement.textContent = '';
          errorElement.classList.remove('form__error--visible');
        }
      });
    }
    showStatus('');
  }

  /**
   * Handle form submission
   * @param {Event} event
   */
  async function handleSubmit(event) {
    event.preventDefault();

    // Validate form
    if (!validateForm()) {
      // Focus first invalid field
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) {
        firstInvalid.focus();
      }
      return;
    }

    setLoadingState(true);
    showStatus('');

    try {
      const result = await submitForm();
      resetForm();
      showToast(result.message || 'Thank you! Your message has been sent successfully.', 'success');
    } catch (error) {
      if (error.message === 'NETWORK_ERROR') {
        // Backend unavailable - offer mailto fallback
        showToast(
          'Our server is temporarily unavailable. Opening email client as a fallback.',
          'info',
          6000
        );
        setTimeout(() => fallbackToMailto(), 1500);
      } else {
        showStatus(error.message || 'Failed to send message. Please try again.', 'error');
        showToast('Failed to send message. Please try again.', 'error');
      }
    } finally {
      setLoadingState(false);
    }
  }

  /**
   * Handle field blur validation
   * @param {Event} event
   */
  function handleBlur(event) {
    const field = event.target;
    if (field.name && validators[field.name]) {
      validateField(field);
    }
  }

  /**
   * Handle input change (clear error on type)
   * @param {Event} event
   */
  function handleInput(event) {
    const field = event.target;
    if (field.classList.contains('input--error') && field.name) {
      const formGroup = field.closest('.form-group');
      const errorElement = formGroup?.querySelector('.form__error');
      if (errorElement && errorElement.textContent) {
        // Re-validate on input if there was an error
        validateField(field);
      }
    }
  }

  /**
   * Initialize form handlers
   */
  function init() {
    if (!form) {
      console.warn('Contact form not found');
      return;
    }

    // Submit handler
    form.addEventListener('submit', handleSubmit);

    // Blur validation (validate on leave field)
    const fields = form.querySelectorAll('input, textarea');
    fields.forEach(field => {
      field.addEventListener('blur', handleBlur, true);
      field.addEventListener('input', handleInput);
    });

    // Prevent double submission
    form.addEventListener('submit', function(event) {
      if (submitBtn?.classList.contains('btn--loading')) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();