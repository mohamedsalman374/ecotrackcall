document.addEventListener('DOMContentLoaded', function() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const selectedCountSpan = document.getElementById('selectedCount');
    const deleteUrlElement = document.getElementById('deleteUrl');
    
    // Check if we are on the history page with a table
    if (!selectAllCheckbox) return;
    
    const deleteUrl = deleteUrlElement ? deleteUrlElement.dataset.url : '';

    function updateBulkDeleteButton() {
        const selectedCount = document.querySelectorAll('.row-checkbox:checked').length;
        selectedCountSpan.textContent = selectedCount;
        
        if (selectedCount > 0) {
            bulkDeleteBtn.classList.remove('d-none');
        } else {
            bulkDeleteBtn.classList.add('d-none');
        }
    }

    // Handle "Select All" click
    selectAllCheckbox.addEventListener('change', function() {
        const isChecked = this.checked;
        rowCheckboxes.forEach(cb => {
            cb.checked = isChecked;
            const tr = cb.closest('tr');
            if (isChecked) tr.classList.add('selected');
            else tr.classList.remove('selected');
        });
        updateBulkDeleteButton();
    });

    // Handle individual row checkbox clicks
    rowCheckboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            const tr = this.closest('tr');
            if (this.checked) tr.classList.add('selected');
            else tr.classList.remove('selected');
            
            // Update "Select All" checkbox state
            const allChecked = Array.from(rowCheckboxes).every(c => c.checked);
            const someChecked = Array.from(rowCheckboxes).some(c => c.checked);
            
            selectAllCheckbox.checked = allChecked;
            selectAllCheckbox.indeterminate = someChecked && !allChecked;
            
            updateBulkDeleteButton();
        });
    });

    // Handle bulk delete
    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', function() {
            const selectedIds = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.value);
            
            if (selectedIds.length === 0) return;
            
            if (confirm(`Are you sure you want to delete ${selectedIds.length} selected record(s)? This action cannot be undone.`)) {
                executeDelete(selectedIds);
            }
        });
    }

    // Handle single row delete
    const deleteBtns = document.querySelectorAll('.delete-single-btn');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            if (confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
                executeDelete([id]);
            }
        });
    });

    // Handle delete all
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', function() {
            if (confirm('WARNING: Are you absolutely sure you want to delete ALL history? This action cannot be undone.')) {
                executeDelete([], true);
            }
        });
    }

    function executeDelete(ids, deleteAll = false) {
        fetch(deleteUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: ids, delete_all: deleteAll })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.reload();
            } else {
                alert('Error deleting records: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An unexpected error occurred.');
        });
    }
});
