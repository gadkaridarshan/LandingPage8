// helix: scripts/contact.js
// Contact form: client-side validation + JSON POST to a configurable endpoint.

(function () {
    "use strict";

    var DEFAULT_ENDPOINT = "/api/contact";

    function getEndpoint() {
        if (typeof window !== "undefined" && typeof window.LUMEN_CONTACT_ENDPOINT === "string") {
            return window.LUMEN_CONTACT_ENDPOINT;
        }
        return DEFAULT_ENDPOINT;
    }

    function setStatus(el, message, state) {
        if (!el) return;
        el.textContent = message || "";
        if (state) {
            el.setAttribute("data-state", state);
        } else {
            el.removeAttribute("data-state");
        }
    }

    function validateField(field) {
        var value = (field.value || "").trim();
        var valid = field.checkValidity() && value.length > 0;

        if (field.type === "email") {
            valid = valid && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }

        if (field.tagName === "TEXTAREA") {
            valid = valid && value.length >= 10;
        }

        field.setAttribute("aria-invalid", valid ? "false" : "true");
        return valid;
    }

    function bindForm() {
        var form = document.querySelector(".contact-form");
        if (!form) return;
        var status = document.getElementById("contact-status");
        var submitBtn = form.querySelector('button[type="submit"]');

        var fields = Array.prototype.slice.call(form.querySelectorAll("input, textarea"));

        fields.forEach(function (field) {
            field.addEventListener("blur", function () { validateField(field); });
            field.addEventListener("input", function () {
                if (field.getAttribute("aria-invalid") === "true") {
                    validateField(field);
                }
            });
        });

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            var allValid = fields.every(validateField);
            if (!allValid) {
                setStatus(status, "Please fix the highlighted fields and try again.", "error");
                var firstInvalid = fields.find(function (f) { return f.getAttribute("aria-invalid") === "true"; });
                if (firstInvalid && typeof firstInvalid.focus === "function") firstInvalid.focus();
                return;
            }

            var payload = {
                name: fields.find(function (f) { return f.name === "name"; }).value.trim(),
                email: fields.find(function (f) { return f.name === "email"; }).value.trim(),
                company: (function () {
                    var c = fields.find(function (f) { return f.name === "company"; });
                    return c ? c.value.trim() : "";
                })(),
                message: fields.find(function (f) { return f.name === "message"; }).value.trim(),
                submittedAt: new Date().toISOString()
            };

            setStatus(status, "Sending your message…", "");
            if (submitBtn) submitBtn.disabled = true;

            fetch(getEndpoint(), {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(payload)
            })
                .then(function (res) {
                    if (!res.ok) {
                        throw new Error("HTTP " + res.status);
                    }
                    return res.json().catch(function () { return {}; });
                })
                .then(function () {
                    setStatus(status, "Thanks — we'll be in touch within one business day.", "success");
                    form.reset();
                    fields.forEach(function (f) { f.setAttribute("aria-invalid", "false"); });
                })
                .catch(function () {
                    setStatus(status, "Something went wrong sending your message. Please try again.", "error");
                })
                .then(function () {
                    if (submitBtn) submitBtn.disabled = false;
                });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bindForm);
    } else {
        bindForm();
    }
})();