document.addEventListener('DOMContentLoaded', function() {
    // Password validation logic
    const newPasswordInput = document.getElementById('new_password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    const submitBtn = document.getElementById('passwordSubmitBtn');
    
    if (newPasswordInput && confirmPasswordInput && submitBtn) {
        const reqLength = document.getElementById('req-length');
        const reqUpper = document.getElementById('req-upper');
        const reqLower = document.getElementById('req-lower');
        const reqNum = document.getElementById('req-num');
        const reqSpec = document.getElementById('req-spec');
        
        function validatePassword() {
            const val = newPasswordInput.value;
            const confirmVal = confirmPasswordInput.value;
            let isValid = true;
            
            // Length
            if (val.length >= 8) { reqLength.className = 'valid'; }
            else { reqLength.className = 'invalid'; isValid = false; }
            
            // Uppercase
            if (/[A-Z]/.test(val)) { reqUpper.className = 'valid'; }
            else { reqUpper.className = 'invalid'; isValid = false; }
            
            // Lowercase
            if (/[a-z]/.test(val)) { reqLower.className = 'valid'; }
            else { reqLower.className = 'invalid'; isValid = false; }
            
            // Number
            if (/\d/.test(val)) { reqNum.className = 'valid'; }
            else { reqNum.className = 'invalid'; isValid = false; }
            
            // Special
            if (/[!@#$%^&*(),.?":{}|<>]/.test(val)) { reqSpec.className = 'valid'; }
            else { reqSpec.className = 'invalid'; isValid = false; }
            
            // Match
            if (val !== confirmVal || confirmVal === '') {
                isValid = false;
            }
            
            submitBtn.disabled = !isValid;
        }
        
        newPasswordInput.addEventListener('input', validatePassword);
        confirmPasswordInput.addEventListener('input', validatePassword);
    }
});
