/* helix: scripts/contact.js @helix:story USER-173000 */
(function () {
    'use strict';

    /**
     * Contact form controller for the Lumen landing page.
     *
     * - Validates name, email, and message client-side.
     * - Submits via fetch() to the configured endpoint (window.LUMEN_CONTACT_ENDPOINT).
     * - Falls back to a simulated "queued" response when no endpoint is set so the
     *   page is fully demoable from a static host.
     * - Surfaces success / error feedback through an aria-live status banner.
     *
     * The server contract is documented in server/contact-handler.example.js.
     */
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var DEFAULT_ENDPOINT = (typeof window !== 'undefined' && window.LUMEN_CONTACT_ENDPOINT) || '';
    var NETWORK_TIMEOUT_MS = 8000;

    /**
     * Locate the form and bail out cleanly if the section isn't on the page.
     */
    function init() {
        var form = document.getElementById('contact-form');
        if (!form) {
            return;
        }

        var fields = {
            name: form.querySelector('#contact-name'),
            email: form.querySelector('#contact-email'),
            message: form.querySelector('#contact-message')
        };

        var errors = {
            name: form.querySelector('#contact-name-error'),
            email: form.querySelector('#contact-email-error'),
            message: form.querySelector('#contact-message-error')
        };

        var statusEl = form.querySelector('#contact-form-status');

        // Clear validation state as the user edits.
        Object.keys(fields).forEach(function (key) {
            var input = fields[key];
            if (!input) { return; }
            input.addEventListener('input', function () {
                clearFieldError(input, errors[key]);
            });
        });

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            handleSubmit(form, fields, errors, statusEl);
        });
    }

    /**
     * Run validation, then either POST to the endpoint or simulate success.
     */
    function handleSubmit(form, fields, errors, statusEl) {
        var values = {
            name: (fields.name && fields.name.value || '').trim(),
            email: (fields.email && fields.email.value || '').trim(),
            message: (fields.message && fields.message.value || '').trim()
        };

        var firstInvalid = null;
        var problems = validate(values);
        Object.keys(problems).forEach(function (key) {
            markFieldError(fields[key], errors[key], problems[key]);
            if (!firstInvalid) { firstInvalid = fields[key]; }
        });

        if (firstInvalid) {
            showStatus(statusEl, 'error', 'Please fix the highlighted fields and try again.');
            if (typeof firstInvalid.focus === 'function') {
                firstInvalid.focus();
            }
            return;
        }

        clearStatus(statusEl);
        setSubmitting(form, true);

        var submitPromise = DEFAULT_ENDPOINT
            ? postContact(DEFAULT_ENDPOINT, values)
            : simulateSubmit(values);

        submitPromise
            .then(function (result) {
                setSubmitting(form, false);
                if (result && result.ok) {
                    showStatus(
                        statusEl,
                        'success',
                        (result.message || 'Thanks — your message is on its way. We\u2019ll reply within one business day.')
                    );
                    form.reset();
                    Object.keys(fields).forEach(function (key) { clearFieldError(fields[key], errors[key]); });
                } else {
                    showStatus(
                        statusEl,
                        'error',
                        (result && result.message) || 'Something went wrong sending your message. Please try again in a moment.'
                    );
                }
            })
            .catch(function (err) {
                setSubmitting(form, false);
                // eslint-disable-next-line no-console
                console.error('[lumen] contact submit failed', err);
                showStatus(
                    statusEl,
                    'error',
                    'We couldn\u2019t reach the server. Check your connection and try again.'
                );
            });
    }

    /**
     * Pure validation. Returns a map of fieldName -> human readable message.
     */
    function validate(values) {
        var problems = {};

        if (!values.name || values.name.length < 2) {
            problems.name = 'Please enter your full name (at least 2 characters).';
        } else if (values.name.length > 120) {
            problems.name = 'Name is too long — please shorten it to under 120 characters.';
        }

        if (!values.email) {
            problems.email = 'Please enter the email address we should reply to.';
        } else if (values.email.length > 254 || !EMAIL_RE.test(values.email)) {
            problems.email = 'That email address doesn\u2019t look right. Please double-check it.';
        }

        if (!values.message) {
            problems.message = 'Please write a short message so we know how to help.';
        } else if (values.message.length < 10) {
            problems.message = 'A little more detail helps us reply faster — at least 10 characters.';
        } else if (values.message.length > 4000) {
            problems.message = 'That message is quite long — please trim it to under 4,000 characters.';
        }

        return problems;
    }

    /**
     * POST the contact payload as JSON. Resolves with a normalized result.
     */
    function postContact(endpoint, payload) {
        var controller = (typeof AbortController === 'function') ? new AbortController() : null;
        var timer = controller ? setTimeout(function () { controller.abort(); }, NETWORK_TIMEOUT_MS) : null;

        var fetchOpts = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(serialize(payload))
        };
        if (controller) { fetchOpts.signal = controller.signal; }

        return fetch(endpoint, fetchOpts)
            .then(function (res) {
                if (timer) { clearTimeout(timer); }
                return res.json().catch(function () { return {}; }).then(function (data) {
                    if (res.ok) {
                        return { ok: true, message: data && data.message };
                    }
                    return { ok: false, message: (data && data.message) || ('Request failed (' + res.status + ').') };
                });
            })
            .catch(function (err) {
                if (timer) { clearTimeout(timer); }
                if (err && err.name === 'AbortError') {
                    return { ok: false, message: 'The request timed out. Please try again.' };
                }
                throw err;
            });
    }

    /**
     * No endpoint configured — simulate a successful submission so the UX
     * is still demoable on a static host. Resolves after a short delay.
     */
    function simulateSubmit() {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve({
                    ok: true,
                    message: 'Thanks! Your message has been queued (demo mode — wire window.LUMEN_CONTACT_ENDPOINT to a real handler to send it).'
                });
            }, 650);
        });
    }

    /**
     * Shape the payload the reference server handler expects.
     */
    function serialize(values) {
        return {
            name: values.name,
            email: values.email,
            message: values.message,
            submittedAt: new Date().toISOString(),
            source: 'landing-page'
        };
    }

    function markFieldError(input, errorEl, message) {
        if (input && input.parentNode) {
            input.parentNode.classList.add('is-invalid');
        }
        if (input) {
            input.setAttribute('aria-invalid', 'true');
        }
        if (errorEl) {
            errorEl.textContent = message;
        }
    }

    function clearFieldError(input, errorEl) {
        if (input && input.parentNode) {
            input.parentNode.classList.remove('is-invalid');
        }
        if (input) {
            input.removeAttribute('aria-invalid');
        }
        if (errorEl) {
            errorEl.textContent = '';
        }
    }

    function setSubmitting(form, isSubmitting) {
        if (!form) { return; }
        form.classList.toggle('is-submitting', !!isSubmitting);
        var submit = form.querySelector('.contact-form__submit');
        if (submit) {
            submit.disabled = isSubmitting;
            var label = submit.querySelector('.contact-form__submit-label');
            if (label) {
                label.textContent = isSubmitting ? 'Sending\u2026' : 'Send message';
            }
        }
    }

    function showStatus(el, state, message) {
        if (!el) { return; }
        el.hidden = false;
        el.setAttribute('data-state', state);
        el.textContent = message;
    }

    function clearStatus(el) {
        if (!el) { return; }
        el.hidden = true;
        el.removeAttribute('data-state');
        el.textContent = '';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();