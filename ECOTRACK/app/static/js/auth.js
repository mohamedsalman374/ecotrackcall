/**
 * EcoTrack Supabase Authentication Module JavaScript
 * Handles client-side validation, password match verification,
 * password strength evaluation, and URL hash token extraction for password resets.
 */

document.addEventListener('DOMContentLoaded', function () {
    // -------------------------------------------------------------------------
    // 1. Bootstrap Form Validation Feedback
    // -------------------------------------------------------------------------
    const forms = document.querySelectorAll('.needs-validation');
    Array.prototype.slice.call(forms).forEach(function (form) {
        form.addEventListener('submit', function (event) {
            const passwordInput = form.querySelector('input[type="password"][name="password"]');
            const confirmInput = form.querySelector('input[name="confirmPassword"], input[name="confirm_password"]');

            if (passwordInput && confirmInput) {
                if (passwordInput.value !== confirmInput.value) {
                    confirmInput.setCustomValidity('Passwords do not match');
                } else {
                    confirmInput.setCustomValidity('');
                }
            }

            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });

    // -------------------------------------------------------------------------
    // 2. Real-time Password Confirmation Check
    // -------------------------------------------------------------------------
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirmPassword') || document.getElementById('confirm_password');

    if (passwordField && confirmPasswordField) {
        const checkMatch = function () {
            if (confirmPasswordField.value.length > 0) {
                if (passwordField.value !== confirmPasswordField.value) {
                    confirmPasswordField.setCustomValidity('Passwords do not match');
                } else {
                    confirmPasswordField.setCustomValidity('');
                }
            }
        };

        passwordField.addEventListener('input', checkMatch);
        confirmPasswordField.addEventListener('input', checkMatch);
    }

    // -------------------------------------------------------------------------
    // 3. Password Strength Evaluation
    // -------------------------------------------------------------------------
    const strengthBar = document.getElementById('password-strength-bar');
    const strengthText = document.getElementById('password-strength-text');

    if (passwordField && strengthBar && strengthText) {
        passwordField.addEventListener('input', function () {
            const val = passwordField.value;
            let score = 0;

            if (val.length >= 8) score += 25;
            if (/[A-Z]/.test(val)) score += 25;
            if (/[0-9]/.test(val)) score += 25;
            if (/[^A-Za-z0-9]/.test(val)) score += 25;

            strengthBar.style.width = score + '%';

            if (val.length === 0) {
                strengthBar.style.width = '0%';
                strengthBar.className = 'password-strength-bar';
                strengthText.textContent = '';
            } else if (score <= 25) {
                strengthBar.className = 'password-strength-bar bg-danger';
                strengthText.textContent = 'Weak (add uppercase, numbers, and symbols)';
                strengthText.className = 'password-strength-text text-danger';
            } else if (score <= 50) {
                strengthBar.className = 'password-strength-bar bg-warning';
                strengthText.textContent = 'Fair (add numbers and symbols)';
                strengthText.className = 'password-strength-text text-warning';
            } else if (score <= 75) {
                strengthBar.className = 'password-strength-bar bg-info';
                strengthText.textContent = 'Good password';
                strengthText.className = 'password-strength-text text-info';
            } else {
                strengthBar.className = 'password-strength-bar bg-success';
                strengthText.textContent = 'Strong password!';
                strengthText.className = 'password-strength-text text-success';
            }
        });
    }

    // -------------------------------------------------------------------------
    // 4. Supabase Password Reset URL Hash Fragment Parser
    // -------------------------------------------------------------------------
    // Supabase Auth sends recovery tokens in the URL hash:
    // https://example.com/reset-password#access_token=...&refresh_token=...&type=recovery
    const tokenInput = document.getElementById('access_token');
    const resetSubmitBtn = document.getElementById('submitBtn') || document.getElementById('resetSubmitBtn');
    const tokenErrorAlert = document.getElementById('errorAlert') || document.getElementById('tokenErrorAlert');

    if (tokenInput) {
        let extractedToken = null;

        // Try extracting from hash fragment
        if (window.location.hash && window.location.hash.includes('access_token')) {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            extractedToken = params.get('access_token');
        }

        // Fallback: check query parameters
        if (!extractedToken) {
            const urlParams = new URLSearchParams(window.location.search);
            extractedToken = urlParams.get('access_token') || urlParams.get('token');
        }

        if (extractedToken) {
            tokenInput.value = extractedToken;
            if (resetSubmitBtn) resetSubmitBtn.disabled = false;
            if (tokenErrorAlert) tokenErrorAlert.classList.add('d-none');
        } else {
            if (resetSubmitBtn) resetSubmitBtn.disabled = true;
            if (tokenErrorAlert) tokenErrorAlert.classList.remove('d-none');
        }
    }
});
