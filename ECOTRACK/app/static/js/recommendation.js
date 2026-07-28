document.addEventListener('DOMContentLoaded', function() {
    const generateForms = [document.getElementById('generateForm'), document.getElementById('emptyGenerateForm')];
    const loadingState = document.getElementById('loadingState');
    const contentArea = document.getElementById('contentArea');

    generateForms.forEach(form => {
        if (form) {
            form.addEventListener('submit', function(e) {
                // Show loading state, hide content
                if (contentArea) contentArea.classList.add('d-none');
                loadingState.classList.remove('d-none');
                
                // Disable the button to prevent multiple submissions
                const btn = this.querySelector('button[type="submit"]');
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Generating...';
                }
            });
        }
    });
});
