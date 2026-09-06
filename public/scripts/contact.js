/* helix: public/scripts/contact.js */

// Contact Form Handler
// Validates and submits the contact form to the backend API

(function () {
  'use strict';

  // DOM Elements
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.querySelector('.form__status');

  if (!contactForm) {
    console.warn('Contact form not found on this page.');
    return;
  }

  // Form field configuration
  const fields = {
    name: {
      element: document.getElementById('name'),
      validate: (value) => {
        if (!value.trim()) {
          return 'Full name is required';
        }
        if (value.trim().length < 2) {
          return 'Name must be at least 2 characters';
        }
        if (value.trim().length > 100) {
          return 'Name must be less than 100 characters';
        }
        return null;
      }
    },
    email: {
      element: document.getElementById('email'),
      validate: (value) => {
        if (!value.trim()) {
          return 'Email address is required';
        }
        // Basic email regex pattern
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value.trim())) {
          return 'Please enter a valid email address';
        }
        return null;
      }
    },
    company: {
      element: document.getElementById('company'),
      validate: (value) => {
        if (value.trim().length > 0 && value.trim().length < 2) {
          return 'Company name must be at least 2 characters';
        }
        if (value.trim().length > 100) {
          return 'Company name must be less than 100 characters';
        }
        return null;
      }
    },
    message: {
      element: document.getElementById('message'),
      validate: (value) => {
        if (!value.trim()) {
          return 'Message is required';
        }
        if (value.trim().length < 10) {
          return 'Message must be at least 10 characters';
        }
        if (value.trim().length > 2000) {
          return 'Message must be less than 2000 characters';
        }
        return null;
      }
    }
  };

  /**
   * Show error state for a field
   * @param {HTMLElement} field - The field container
   * @param {string} message - Error message
   */
  function showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    const errorEl = formGroup.querySelector('.error-message');
    
    formGroup.classList.add('error');
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  /**
   * Clear error state for a field
   * @param {HTMLElement} field - The field element
   */
  function clearFieldError(field) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.remove('error');
  }

  /**
   * Validate a single field
   * @param {string} fieldName - Name of the field to validate
   * @returns {boolean} - Whether the field is valid
   */
  function validateField(fieldName) {
    const field = fields[fieldName];
    if (!field || !field.element) return true;

    const error = field.validate(field.element.value);
    
    if (error) {
      showFieldError(field.element, error);
      return false;
    } else {
      clearFieldError(field.element);
      return true;
    }
  }

  /**
   * Validate all form fields
   * @returns {boolean} - Whether all fields are valid
   */
  function validateForm() {
    let isValid = true;
    
    Object.keys(fields).forEach((fieldName) => {
      const fieldValid = validateField(fieldName);
      if (!fieldValid) {
        isValid = false;
      }
    });
    
    return isValid;
  }

  /**
   * Set loading state on the submit button
   * @param {boolean} loading - Whether to show loading state
   */
  function setLoadingState(loading) {
    const submitBtn = contactForm.querySelector('.btn--primary');
    
    if (loading) {
      submitBtn.classList.add('btn--loading');
      submitBtn.disabled = true;
    } else {
      submitBtn.classList.remove('btn--loading');
      submitBtn.disabled = false;
    }
  }

  /**
   * Show form status message
   * @param {string} message - Status message
   * @param {string} type - 'success' or 'error'
   */
  function showStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className = 'form__status';
    formStatus.classList.add(`form__status--${type}`);
    formStatus.style.display = 'block';
    
    // Scroll to status message
    formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Hide form status message
   */
  function hideStatus() {
    formStatus.style.display = 'none';
    formStatus.className = 'form__status';
  }

  /**
   * Collect form data
   * @returns {Object} - Form data object
   */
  function collectFormData() {
    return {
      name: fields.name.element.value.trim(),
      email: fields.email.element.value.trim(),
      company: fields.company.element.value.trim(),
      message: fields.message.element.value.trim()
    };
  }

  /**
   * Submit form data to the API
   * @param {Object} data - Form data to submit
   * @returns {Promise<Object>} - Response data
   */
  async function submitForm(data) {
    const response = await fetch(contactForm.action || '/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      let errorMessage = 'Failed to send message. Please try again.';
      
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // Use default error message
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Reset the form to its initial state
   */
  function resetForm() {
    contactForm.reset();
    Object.keys(fields).forEach((fieldName) => {
      if (fields[fieldName].element) {
        clearFieldError(fields[fieldName].element);
      }
    });
    hideStatus();
  }

  /**
   * Handle form submission
   * @param {Event} event - Form submit event
   */
  async function handleSubmit(event) {
    event.preventDefault();
    
    // Clear previous status
    hideStatus();
    
    // Validate form
    if (!validateForm()) {
      // Focus first error field
      const firstError = contactForm.querySelector('.form-group.error input, .form-group.error textarea');
      if (firstError) {
        firstError.focus();
      }
      return;
    }

    // Set loading state
    setLoadingState(true);

    try {
      const formData = collectFormData();
      await submitForm(formData);
      
      // Show success message
      showStatus('Thank you for your message! We\'ll get back to you within 24 hours.', 'success');
      
      // Reset form after short delay
      setTimeout(() => {
        resetForm();
      }, 3000);
      
    } catch (error) {
      // Show error message
      showStatus(error.message || 'Something went wrong. Please try again later.', 'error');
    } finally {
      // Clear loading state
      setLoadingState(false);
    }
  }

  // Initialize event listeners
  function init() {
    // Form submission
    contactForm.addEventListener('submit', handleSubmit);

    // Real-time validation on blur
    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      if (field.element) {
        field.element.addEventListener('blur', () => {
          // Only validate if field has been touched
          if (field.element.value.trim()) {
            validateField(fieldName);
          }
        });

        // Clear error on input
        field.element.addEventListener('input', () => {
          clearFieldError(field.element);
        });
      }
    });

    // Handle external clear button if present
    const clearBtn = contactForm.querySelector('.btn--clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resetForm();
      });
    }
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();