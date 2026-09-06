/* helix: scripts/contact.js @helix:story USER-173000 */
/* Contact form: client-side validation + POST to /api/contact with feedback UI. */

(function () {
    "use strict";

    var DEFAULT_ENDPOINT = "/api/contact";
    var SUBMIT_TIMEOUT_MS = 15000;
    var STORAGE_KEY = "lumen.contact.lastSubmissionAt";
    var MIN_SUBMIT_INTERVAL_MS = 8000; // simple client-side throttling

    // Resolve endpoint from <form action> when available.
    function getEndpoint(form) {
        var attr = form.getAttribute("action");
        if (attr && attr.trim() !== "" && attr !== "#") {
            return attr;
        }
        return DEFAULT_ENDPOINT;
    }

    function $(scope, selector) {
        return scope.querySelector(selector);
    }

    function $$(scope, selector) {
        return Array.prototype.slice.call(scope.querySelectorAll(selector));
    }

    function setError(form, fieldName, message) {
        var errorEl = form.querySelector('[data-error-for="' + fieldName + '"]');
        var fieldEl = form.querySelector('[name="' + fieldName + '"]');
        if (errorEl) {
            if (message) {
                errorEl.textContent = message;
                errorEl.hidden = false;
            } else {
                errorEl.textContent = "";
                errorEl.hidden = true;
            }
        }
        if (fieldEl) {
            if (message) {
                fieldEl.setAttribute("aria-invalid", "true");
            } else {
                fieldEl.removeAttribute("aria-invalid");
            }
        }
    }

    function clearAllErrors(form) {
        $$form_errors(form).forEach(function (el) {
            el.textContent = "";
            el.hidden = true;
        });
        $$form_inputs(form).forEach(function (el) {
            el.removeAttribute("aria-invalid");
        });
    }

    function $$form_errors(form) {
        return $$(form, ".contact-form__error");
    }

    function $$form_inputs(form) {
        return $$(form, ".contact-form__input, .contact-form__consent input[type='checkbox']");
    }

    // RFC 5322-lite — practical client-side email check.
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function validate(form) {
        var data = {
            name: (form.elements["name"].value || "").trim(),
            email: (form.elements["email"].value || "").trim(),
            message: (form.elements["message"].value || "").trim(),
            consent: !!form.elements["consent"] && form.elements["consent"].checked,
        };

        var ok = true;

        if (data.name.length < 2) {
            setError(form, "name", "Please enter your name (at least 2 characters).");
            ok = false;
        } else if (data.name.length > 120) {
            setError(form, "name", "Name must be 120 characters or fewer.");
            ok = false;
        } else {
            setError(form, "name", "");
        }

        if (data.email.length === 0) {
            setError(form, "email", "Please enter your work email.");
            ok = false;
        } else if (data.email.length > 254 || !EMAIL_RE.test(data.email)) {
            setError(form, "email", "Please enter a valid email address.");
            ok = false;
        } else {
            setError(form, "email", "");
        }

        if (data.message.length < 10) {
            setError(form, "message", "Message should be at least 10 characters so we can help.");
            ok = false;
        } else if (data.message.length > 4000) {
            setError(form, "message", "Message must be 4000 characters or fewer.");
            ok = false;
        } else {
            setError(form, "message", "");
        }

        if (!data.consent) {
            setError(form, "consent", "Please confirm you agree to be contacted.");
            ok = false;
        } else {
            setError(form, "consent", "");
        }

        return ok ? data : null;
    }

    function setStatus(form, kind, message) {
        var statusEl = $(form, "#contact-form-status");
        if (!statusEl) return;
        statusEl.classList.remove("contact-form__status--success", "contact-form__status--error");
        if (!kind) {
            statusEl.hidden = true;
            statusEl.textContent = "";
            return;
        }
        statusEl.classList.add("contact-form__status--" + kind);
        statusEl.textContent = message;
        statusEl.hidden = false;
    }

    function setBusy(form, busy) {
        var submit = $(form, "#contact-submit");
        if (!submit) return;
        if (busy) {
            submit.setAttribute("aria-busy", "true");
            submit.disabled = true;
        } else {
            submit.removeAttribute("aria-busy");
            submit.disabled = false;
        }
    }

    function isThrottled() {
        try {
            var last = parseInt(window.localStorage.getItem(STORAGE_KEY) || "0", 10);
            if (!last) return false;
            return Date.now() - last < MIN_SUBMIT_INTERVAL_MS;
        } catch (_err) {
            return false;
        }
    }

    function markSubmitted() {
        try {
            window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
        } catch (_err) {
            /* storage may be unavailable — ignore */
        }
    }

    function submitData(endpoint, payload) {
        // Prefer AbortController + fetch for a clean timeout.
        if (typeof window.fetch === "function" && typeof window.AbortController === "function") {
            var controller = new AbortController();
            var timer = window.setTimeout(function () {
                controller.abort();
            }, SUBMIT_TIMEOUT_MS);

            return window
                .fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                })
                .then(function (response) {
                    window.clearTimeout(timer);
                    return response;
                })
                .catch(function (err) {
                    window.clearTimeout(timer);
                    throw err;
                });
        }

        // Fallback: XMLHttpRequest (no timeout, but widely supported).
        return new Promise(function (resolve, reject) {
            try {
                var xhr = new XMLHttpRequest();
                xhr.open("POST", endpoint, true);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("Accept", "application/json");
                xhr.onload = function () {
                    // Build a minimal response-like object.
                    resolve({
                        ok: xhr.status >= 200 && xhr.status < 300,
                        status: xhr.status,
                        json: function () {
                            try {
                                return Promise.resolve(JSON.parse(xhr.responseText));
                            } catch (_e) {
                                return Promise.resolve({});
                            }
                        },
                    });
                };
                xhr.onerror = function () {
                    reject(new Error("Network error"));
                };
                xhr.send(JSON.stringify(payload));
            } catch (err) {
                reject(err);
            }
        });
    }

    function attachLiveClear(form) {
        // Clear a field's error as the user fixes it.
        $$form_inputs(form).forEach(function (el) {
            var eventName = el.type === "checkbox" || el.type === "radio" ? "change" : "input";
            el.addEventListener(eventName, function () {
                var name = el.getAttribute("name");
                if (!name) return;
                var errorEl = form.querySelector('[data-error-for="' + name + '"]');
                if (errorEl && !errorEl.hidden) {
                    setError(form, name, "");
                }
            });
        });
    }

    function init() {
        var form = document.getElementById("contact-form");
        if (!form) return;

        // Mark novalidate=handled: we'll do our own validation.
        form.setAttribute("novalidate", "novalidate");

        attachLiveClear(form);

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            clearAllErrors(form);
            setStatus(form, null);

            var data = validate(form);
            if (!data) {
                // Focus the first invalid field for accessibility.
                var firstInvalid = form.querySelector("[aria-invalid='true']");
                if (firstInvalid && typeof firstInvalid.focus === "function") {
                    firstInvalid.focus();
                }
                return;
            }

            if (isThrottled()) {
                setStatus(
                    form,
                    "error",
                    "You just sent a message — please wait a few seconds before trying again."
                );
                return;
            }

            var endpoint = getEndpoint(form);
            var submitter = form.elements["name"];

            setBusy(form, true);

            submitData(endpoint, data)
                .then(function (response) {
                    if (response && typeof response.ok === "boolean" && response.ok) {
                        markSubmitted();
                        form.reset();
                        setStatus(
                            form,
                            "success",
                            "Thanks — your message is on its way. We'll be in touch within one business day."
                        );
                        if (submitter && typeof submitter.focus === "function") {
                            submitter.focus();
                        }
                        return;
                    }

                    // Try to surface server-provided error message.
                    var fallback = "We couldn't send your message right now. Please try again in a moment.";
                    if (response && typeof response.json === "function") {
                        return response.json().then(function (body) {
                            var msg = (body && (body.message || body.error)) || fallback;
                            throw new Error(msg);
                        });
                    }
                    throw new Error(fallback);
                })
                .catch(function (err) {
                    var msg =
                        err && err.name === "AbortError"
                            ? "The request timed out. Please check your connection and try again."
                            : (err && err.message) ||
                              "We couldn't send your message right now. Please try again in a moment.";
                    setStatus(form, "error", msg);
                })
                .then(function () {
                    setBusy(form, false);
                });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();