document.addEventListener('DOMContentLoaded', function() {
    
    // Description Character Counter
    const descInput = document.getElementById('description');
    const charCount = document.getElementById('charCount');
    if (descInput && charCount) {
        descInput.addEventListener('input', function() {
            charCount.textContent = this.value.length;
        });
        charCount.textContent = descInput.value.length;
    }

    // Star Rating Logic
    const stars = document.querySelectorAll('.rating-star');
    const ratingInput = document.getElementById('ratingInput');
    const ratingLabel = document.getElementById('ratingLabel');
    const ratingTexts = ["Terrible", "Poor", "Average", "Good", "Excellent"];

    if (stars.length > 0) {
        // Initialize if editing
        if (ratingInput.value > 0) {
            updateStars(ratingInput.value);
            ratingLabel.textContent = ratingTexts[ratingInput.value - 1];
        }

        stars.forEach(star => {
            star.addEventListener('mouseover', function() {
                const val = parseInt(this.dataset.value);
                updateStars(val);
                ratingLabel.textContent = ratingTexts[val - 1];
            });

            star.addEventListener('mouseout', function() {
                const currentVal = parseInt(ratingInput.value) || 0;
                updateStars(currentVal);
                ratingLabel.textContent = currentVal > 0 ? ratingTexts[currentVal - 1] : "Click to rate";
            });

            star.addEventListener('click', function() {
                const val = parseInt(this.dataset.value);
                ratingInput.value = val;
                updateStars(val);
                ratingLabel.textContent = ratingTexts[val - 1];
            });
        });

        function updateStars(val) {
            stars.forEach(s => {
                const starVal = parseInt(s.dataset.value);
                if (starVal <= val) {
                    s.classList.remove('bi-star');
                    s.classList.remove('text-muted');
                    s.classList.remove('opacity-25');
                    s.classList.add('bi-star-fill');
                    s.classList.add('text-warning');
                } else {
                    s.classList.remove('bi-star-fill');
                    s.classList.remove('text-warning');
                    s.classList.add('bi-star');
                    s.classList.add('text-muted');
                    s.classList.add('opacity-25');
                }
            });
        }
    }

    // Image Preview Logic
    const screenshotInput = document.getElementById('screenshot');
    const placeholder = document.getElementById('uploadPlaceholder');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImage = document.getElementById('imagePreview');

    if (screenshotInput) {
        screenshotInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                
                // Check size (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('File exceeds maximum size of 5MB.');
                    removeImage();
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImage.src = e.target.result;
                    placeholder.classList.add('d-none');
                    previewContainer.classList.remove('d-none');
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // Make removeImage function global so it can be called from onclick attribute
    window.removeImage = function() {
        if (screenshotInput) {
            screenshotInput.value = ''; // clear input
        }
        if (previewImage) {
            previewImage.src = '';
        }
        if (previewContainer && placeholder) {
            previewContainer.classList.add('d-none');
            placeholder.classList.remove('d-none');
        }
    }
});
