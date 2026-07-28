document.addEventListener('DOMContentLoaded', function() {
    const steps = document.querySelectorAll('.step-content');
    const stepIndicators = document.querySelectorAll('.step-item');
    const nextBtns = document.querySelectorAll('.next-btn');
    const prevBtns = document.querySelectorAll('.prev-btn');
    const calcForm = document.getElementById('calculator-form');
    let currentStep = 0;

    // Initialize UI
    updateUI();

    // Event Listeners for Next Buttons
    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                currentStep++;
                if (currentStep >= steps.length) {
                    currentStep = steps.length - 1;
                }
                updateUI();
                updateReviewSection();
            }
        });
    });

    // Event Listeners for Prev Buttons
    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentStep--;
            if (currentStep < 0) {
                currentStep = 0;
            }
            updateUI();
        });
    });

    // Handle Transportation Mode conditional fields
    const transportMode = document.getElementById('transport_mode');
    if (transportMode) {
        transportMode.addEventListener('change', function() {
            const val = this.value;
            const distanceGroup = document.getElementById('transport_distance_group');
            if (val === 'bicycle' || val === 'walking') {
                distanceGroup.style.display = 'none';
                document.getElementById('transport_distance').value = 0;
            } else {
                distanceGroup.style.display = 'block';
            }
        });
    }

    function updateUI() {
        // Update content panes
        steps.forEach((step, index) => {
            if (index === currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        // Update indicators
        stepIndicators.forEach((indicator, index) => {
            indicator.classList.remove('active', 'completed');
            if (index === currentStep) {
                indicator.classList.add('active');
            } else if (index < currentStep) {
                indicator.classList.add('completed');
            }
        });
    }

    function validateStep(stepIndex) {
        const currentPane = steps[stepIndex];
        const inputs = currentPane.querySelectorAll('input, select');
        let isValid = true;

        inputs.forEach(input => {
            // Only validate visible inputs
            if (input.offsetParent !== null) {
                if (!input.checkValidity()) {
                    isValid = false;
                    input.classList.add('is-invalid');
                } else {
                    input.classList.remove('is-invalid');
                    input.classList.add('is-valid');
                }
                
                // Custom validation for non-negative numbers
                if (input.type === 'number') {
                    if (parseFloat(input.value) < 0) {
                        isValid = false;
                        input.classList.add('is-invalid');
                        const feedback = input.nextElementSibling;
                        if(feedback && feedback.classList.contains('invalid-feedback')) {
                            feedback.textContent = 'Value cannot be negative.';
                        }
                    }
                }
            }
        });

        if (!isValid) {
            currentPane.classList.add('was-validated');
        }

        return isValid;
    }

    function updateReviewSection() {
        if (currentStep === steps.length - 1) {
            // We are on the review step. Populate the review list.
            document.getElementById('rev_transport').textContent = 
                document.getElementById('transport_mode').options[document.getElementById('transport_mode').selectedIndex].text + 
                ' - ' + document.getElementById('transport_distance').value + ' km, ' + 
                document.getElementById('transport_frequency').value + ' times/month';
                
            document.getElementById('rev_electricity').textContent = document.getElementById('electricity_kwh').value + ' kWh';
            document.getElementById('rev_water').textContent = document.getElementById('water_liters').value + ' L for ' + document.getElementById('water_days').value + ' days';
            document.getElementById('rev_food').textContent = document.getElementById('diet_type').options[document.getElementById('diet_type').selectedIndex].text;
            document.getElementById('rev_waste').textContent = document.getElementById('waste_kg').value + ' kg (' + document.getElementById('recycling_pct').value + '% recycled)';
            document.getElementById('rev_shopping').textContent = 
                document.getElementById('clothing_items').value + ' clothing, ' + 
                document.getElementById('electronics_items').value + ' electronics, ' + 
                document.getElementById('general_items').value + ' general';
            document.getElementById('rev_travel').textContent = 
                document.getElementById('domestic_flights').value + ' domestic, ' + 
                document.getElementById('international_flights').value + ' intl, ' + 
                document.getElementById('train_trips').value + ' train trips';
        }
    }
    
    // Final Form Submission Validation
    if(calcForm) {
        calcForm.addEventListener('submit', function(e) {
            if (!validateStep(currentStep)) {
                e.preventDefault();
                e.stopPropagation();
            } else {
                // Show loading state on submit button
                const submitBtn = document.getElementById('submit-calc-btn');
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Calculating...';
                submitBtn.disabled = true;
            }
        });
    }
});
