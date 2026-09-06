/**
 * Contact Form Handler
 * Validates and submits contact form data to the backend API.
 * Falls back to mailto: if the API endpoint is unavailable.
 */

(function () {
  'use strict';

  const form = document.getElementById('contact-form');
  const statusContainer = document.getElementById('form-status');
  const submitButton = form?.querySelector('button[type="submit"]');

  if (!form) {
    console.warn('Contact form not found on this page.');
    return;
  }

  /**
   * Display a status message to the user
   * @param {string} message - The message to display
   * @param {boolean} isError - Whether this is an error message
   */
  function showStatus(message, isError = false) {
    if (!statusContainer) return;

    statusContainer.textContent = message;
    statusContainer.className = 'form-status ' + (isError ? 'form-status--error' : 'form-status--success');
    statusContainer.setAttribute('role', 'alert');

    // Auto-clear after 8 seconds
    setTimeout(() => {
      if (statusContainer.textContent === message) {
        statusContainer.textContent = '';
        statusContainer.className = 'form-status';
      }
    }, 8000);
  }

  /**
   * Validate a single field
   * @param {HTMLInputElement|HTMLTextAreaElement} field - The field to validate
   * @returns {boolean} Whether the field is valid
   */
  function validateField(field) {
    const errorSpan = field.nextElementSibling;
    let isValid = true;
    let message = '';

    // Reset state
    field.classList.remove('input--error');
    if (errorSpan?.classList.contains('form-error')) {
      errorSpan.textContent = '';
    }

    // Required check
    if (field.hasAttribute('required') && !field.value.trim()) {
      isValid = false;
      message = 'This field is required.';
    }

    // Email validation
    if (field.type === 'email' && field.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value.trim())) {
        isValid = false;
        message = 'Please enter a valid email address.';
      }
    }

    // Apply error state
    if (!isValid) {
      field.classList.add('input--error');
      if (errorSpan?.classList.contains('form-error')) {
        errorSpan.textContent = message;
      }
    }

    return isValid;
  }

  /**
   * Validate all form fields
   * @returns {boolean} Whether all fields are valid
   */
  function validateForm() {
    const fields = form.querySelectorAll('input, textarea');
    let isFormValid = true;

    fields.forEach(field => {
      if (!validateField(field)) {
        isFormValid = false;
      }
    });

    return isFormValid;
  }

  /**
   * Collect form data into an object
   * @returns {Object} Form data as key-value pairs
   */
  function collectFormData() {
    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
      data[key] = value.trim();
    }

    return data;
  }

  /**
   * Submit form data to the API endpoint
   * @param {Object} data - The form data to submit
   * @returns {Promise<Object>} The response data
   */
  async function submitToAPI(data) {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Fall back to mailto: if API submission fails
   * @param {Object} data - The form data
   */
  function fallbackToMailto(data) {
    const subject = encodeURIComponent('Lumen Contact Form Submission');
    const body = encodeURIComponent(
      `Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`
    );
    window.location.href = `mailto:hello@lumen.io?subject=${subject}&body=${body}`;
  }

  /**
   * Set loading state on the form
   * @param {boolean} isLoading - Whether the form is loading
   */
  function setLoadingState(isLoading) {
    const inputs = form.querySelectorAll('input, textarea, button');
    inputs.forEach(input => {
      input.disabled = isLoading;
    });

    if (submitButton) {
      submitButton.textContent = isLoading ? 'Sending...' : 'Send Message';
    }
  }

  /**
   * Handle form submission
   * @param {Event} event - The submit event
   */
  async function handleSubmit(event) {
    event.preventDefault();

    // Validate
    if (!validateForm()) {
      showStatus('Please correct the errors above.', true);
      return;
    }

    const data = collectFormData();
    setLoadingState(true);

    try {
      await submitToAPI(data);
      form.reset();
      showStatus('Thanks for reaching out! We\'ll get back to you within 24 hours.');
    } catch (error) {
      console.error('Contact form submission failed:', error);

      // Check if this is a network/connection error
      if (!navigator.onLine || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        // Fall back to mailto for network issues
        showStatus('Network unavailable. Opening email client instead...', false);
        setTimeout(() => fallbackToMailto(data), 500);
      } else {
        showStatus('Something went wrong. Please try again or email us directly.', true);
      }
    } finally {
      setLoadingState(false);
    }
  }

  // Attach event listeners
  form.addEventListener('submit', handleSubmit);

  // Real-time validation on blur
  const fields = form.querySelectorAll('input, textarea');
  fields.forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      // Clear error state on input
      if (field.classList.contains('input--error')) {
        field.classList.remove('input--error');
        const errorSpan = field.nextElementSibling;
        if (errorSpan?.classList.contains('form-error')) {
          errorSpan.textContent = '';
        }
      }
    });
  });

  // Handle browser back/forward navigation
  window.addEventListener('pageshow', () => {
    form.reset();
    if (statusContainer) {
      statusContainer.textContent = '';
      statusContainer.className = 'form-status';
    }
  });

})();