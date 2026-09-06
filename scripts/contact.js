// helix: scripts/contact.js
(function () {
  'use strict';

  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const successMessage = document.getElementById('form-success');

  if (!form) {
    console.error('Contact form not found');
    return;
  }

  // Validation patterns
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Validation rules for each field
   */
  const validationRules = {
    name: {
      validate: (value) => {
        if (!value.trim()) {
          return 'Please enter your name';
        }
        if (value.trim().length < 2) {
          return 'Name must be at least 2 characters';
        }
        return null;
      },
      errorId: 'name-error',
      inputId: 'name'
    },
    email: {
      validate: (value) => {
        if (!value.trim()) {
          return 'Please enter your email address';
        }
        if (!emailPattern.test(value.trim())) {
          return 'Please enter a valid email address';
        }
        return null;
      },
      errorId: 'email-error',
      inputId: 'email'
    },
    company: {
      validate: (value) => {
        // Company is optional, but if filled, validate length
        if (value.trim().length > 0 && value.trim().length < 2) {
          return 'Company name must be at least 2 characters';
        }
        return null;
      },
      errorId: 'company-error',
      inputId: 'company'
    },
    message: {
      validate: (value) => {
        if (!value.trim()) {
          return 'Please enter your message';
        }
        if (value.trim().length < 10) {
          return 'Message must be at least 10 characters';
        }
        return null;
      },
      errorId: 'message-error',
      inputId: 'message'
    }
  };

  /**
   * Show error for a specific field
   * @param {string} fieldName - The field name to show error for
   * @param {string|null} errorMessage - The error message, or null to clear
   */
  function showFieldError(fieldName, errorMessage) {
    const rule = validationRules[fieldName];
    if (!rule) return;

    const input = document.getElementById(rule.inputId);
    const errorEl = document.getElementById(rule.errorId);

    if (errorEl) {
      errorEl.textContent = errorMessage || '';
      errorEl.classList.toggle('is-visible', !!errorMessage);
    }

    if (input) {
      input.classList.toggle('is-invalid', !!errorMessage);
    }
  }

  /**
   * Validate a single field
   * @param {string} fieldName - The field name to validate
   * @returns {boolean} Whether the field is valid
   */
  function validateField(fieldName) {
    const rule = validationRules[fieldName];
    if (!rule) return true;

    const input = document.getElementById(rule.inputId);
    const value = input ? input.value : '';
    const error = rule.validate(value);

    showFieldError(fieldName, error);
    return !error;
  }

  /**
   * Validate all fields
   * @returns {boolean} Whether all fields are valid
   */
  function validateAllFields() {
    let isValid = true;

    for (const fieldName in validationRules) {
      if (!validateField(fieldName)) {
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * Set loading state for the form
   * @param {boolean} isLoading - Whether the form is in loading state
   */
  function setLoadingState(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle('is-loading', isLoading);

    // Disable all form inputs while loading
    const inputs = form.querySelectorAll('input, textarea, button');
    inputs.forEach((input) => {
      input.disabled = isLoading;
    });
  }

  /**
   * Show success state
   */
  function showSuccess() {
    form.hidden = true;
    successMessage.hidden = false;
    successMessage.focus();
  }

  /**
   * Handle form submission
   * @param {Event} event - The submit event
   */
  async function handleSubmit(event) {
    event.preventDefault();

    // Validate all fields
    if (!validateAllFields()) {
      // Focus first invalid field
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) {
        firstInvalid.focus();
      }
      return;
    }

    // Gather form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Set loading state
    setLoadingState(true);

    try {
      // Simulate API call (replace with actual endpoint)
      await simulateSubmit(data);

      // Show success message
      showSuccess();
    } catch (error) {
      // Show error (in production, you might want to show a toast or inline error)
      console.error('Form submission failed:', error);

      // For demo purposes, still show success
      // In production, you'd handle this differently
      showSuccess();
    } finally {
      setLoadingState(false);
    }
  }

  /**
   * Simulate form submission (replace with actual API call)
   * @param {Object} data - The form data
   * @returns {Promise<void>}
   */
  function simulateSubmit(data) {
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        // Log the data that would be sent
        console.log('Form submitted:', data);

        // In production, you would:
        // 1. Send to your backend/API
        // 2. Handle response
        // 3. Show appropriate message

        // Simulate successful submission
        resolve();
      }, 1500);
    });
  }

  // Add event listeners for real-time validation
  for (const fieldName in validationRules) {
    const input = document.getElementById(validationRules[fieldName].inputId);
    if (input) {
      // Validate on blur (when leaving the field)
      input.addEventListener('blur', () => {
        // Only validate if the field has been touched
        if (input.dataset.touched === 'true') {
          validateField(fieldName);
        }
        input.dataset.touched = 'true';
      });

      // Clear error on input
      input.addEventListener('input', () => {
        if (input.classList.contains('is-invalid')) {
          validateField(fieldName);
        }
      });
    }
  }

  // Handle form submission
  form.addEventListener('submit', handleSubmit);

  // Add keyboard support for error messages
  form.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.classList.contains('form-input')) {
        event.preventDefault();
        handleSubmit(event);
      }
    }
  });
})();