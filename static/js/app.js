// EmailWise JavaScript Application

class EmailWise {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.loadHistory();
        this.initializeEnhancements();
    }

    initializeElements() {
        // Form elements
        this.emailForm = document.getElementById('emailForm');
        this.emailContent = document.getElementById('emailContent');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.pasteBtn = document.getElementById('pasteBtn');

        // UI elements
        this.errorAlert = document.getElementById('errorAlert');
        this.errorMessage = document.getElementById('errorMessage');
        this.resultsSection = document.getElementById('resultsSection');

        // Content elements
        this.summaryContent = document.getElementById('summaryContent');
        this.actionItemsContent = document.getElementById('actionItemsContent');
        this.deadlinesContent = document.getElementById('deadlinesContent');
        this.historyContent = document.getElementById('historyContent');

        // Stats
        this.charCount = document.getElementById('charCount');
        this.closeError = document.getElementById('closeError');

        // History button
        this.refreshHistoryBtn = document.getElementById('refreshHistoryBtn');

        // Loading states
        this.btnText = this.analyzeBtn.querySelector('.btn-text');
        this.btnLoadingSpinner = document.getElementById('btnLoadingSpinner');
    }

    initializeEnhancements() {
        // Initialize character counter
        this.updateCharacterCount();

        // Add smooth scrolling
        document.documentElement.style.scrollBehavior = 'smooth';
    }

    attachEventListeners() {
        // Form submission
        this.emailForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.analyzeEmail();
        });

        // Clear button
        this.clearBtn.addEventListener('click', () => {
            this.clearForm();
        });

        // Paste button
        if (this.pasteBtn) {
            this.pasteBtn.addEventListener('click', async () => {
                try {
                    const text = await navigator.clipboard.readText();
                    this.emailContent.value = text;
                    this.updateCharacterCount();
                    this.hideError();
                } catch (err) {
                    console.error('Failed to read clipboard contents: ', err);
                }
            });
        }

        // Copy buttons (using event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-target]')) {
                const button = e.target.closest('[data-target]');
                this.copyToClipboard(button);
            }
        });

        // Refresh history button
        this.refreshHistoryBtn.addEventListener('click', () => {
            this.loadHistory();
        });

        // Clear history button
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (this.clearHistoryBtn) {
            this.clearHistoryBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete all history? This action cannot be undone.')) {
                    this.clearHistory();
                }
            });
        }

        // Textarea events
        this.emailContent.addEventListener('input', () => {
            this.updateCharacterCount();
        });

        // Close error alert
        if (this.closeError) {
            this.closeError.addEventListener('click', () => {
                this.hideError();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to analyze
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                if (document.activeElement === this.emailContent && this.emailContent.value.trim()) {
                    e.preventDefault(); // Prevent default newline
                    this.analyzeEmail();
                }
            }

            // Escape to close error
            if (e.key === 'Escape') {
                this.hideError();
            }
        });
    }

    async clearHistory() {
        try {
            const response = await fetch('/api/history/clear', {
                method: 'POST'
            });
            const result = await response.json();

            if (result.success) {
                this.loadHistory(); // Reload to show empty state
            } else {
                console.error('Failed to clear history:', result.error);
                alert('Failed to clear history. Please try again.');
            }
        } catch (error) {
            console.error('Error clearing history:', error);
            alert('An error occurred while clearing history.');
        }
    }

    updateCharacterCount() {
        if (this.charCount) {
            const count = this.emailContent.value.length;
            this.charCount.textContent = `${count.toLocaleString()} characters`;
        }
    }

    async analyzeEmail() {
        const emailText = this.emailContent.value.trim();

        if (!emailText) {
            this.showError('Please enter email content to analyze.');
            return;
        }

        this.showLoading(true);
        this.hideError();
        this.hideResults();

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email_content: emailText
                })
            });

            const result = await response.json();

            if (result.success) {
                this.displayResults(result.data, result.method);
                this.loadHistory(); // Refresh history after successful analysis
            } else {
                this.showError(result.error || 'Failed to analyze email. Please try again.');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.showLoading(false);
        }
    }

    displayResults(data, method) {
        // Display results
        this.displaySection(this.summaryContent, data.summary, 'No key points found.', 'fas fa-angle-right');
        this.displaySection(this.actionItemsContent, data.action_items, 'No action items identified.', 'far fa-square');
        this.displaySection(this.deadlinesContent, data.deadlines, 'No dates found.', 'far fa-clock');

        // Show results section
        this.resultsSection.classList.remove('d-none');
        this.resultsSection.classList.add('fade-in-up');

        // Smooth scroll to results
        setTimeout(() => {
            const rect = this.resultsSection.getBoundingClientRect();
            const offset = 80;
            window.scrollTo({
                top: window.pageYOffset + rect.top - offset,
                behavior: 'smooth'
            });
        }, 100);
    }

    displaySection(container, items, emptyMessage, iconClass) {
        if (!items || items.length === 0) {
            container.innerHTML = `
                <div class="text-muted opacity-75 small fst-italic py-2">
                    ${emptyMessage}
                </div>
            `;
            return;
        }

        const listItems = items
            .filter(item => item && item.trim().length > 0)
            .map(item => `
                <div class="result-item d-flex gap-2">
                    <div class="mt-1 text-primary opacity-75">
                        <i class="${iconClass}"></i>
                    </div>
                    <div>${this.escapeHtml(item.trim())}</div>
                </div>
            `)
            .join('');

        container.innerHTML = listItems;
    }

    async loadHistory() {
        try {
            const response = await fetch('/api/history');
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                this.displayHistory(result.data);
            } else {
                this.historyContent.innerHTML = `
                    <div class="text-center py-5 text-muted opacity-50">
                        <i class="far fa-clock fa-2x mb-3"></i>
                        <p>No recent analysis history</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    displayHistory(historyItems) {
        const historyHtml = historyItems.map(item => `
            <div class="history-item">
                <div class="history-meta">
                    <i class="far fa-clock"></i>
                    <span>${item.created_at}</span>
                    <span class="ms-auto badge bg-white bg-opacity-10 text-white fw-normal">ID: ${item.id}</span>
                </div>
                <div class="history-email-preview">
                    "${this.escapeHtml(item.email_content)}"
                </div>
                <div class="history-results">
                    <div class="history-result-section">
                        <div class="history-result-title">Summary</div>
                        <div class="history-result-content">
                            ${item.summary.length} items
                        </div>
                    </div>
                    <div class="history-result-section">
                        <div class="history-result-title">Actions</div>
                        <div class="history-result-content">
                            ${item.action_items.length} items
                        </div>
                    </div>
                    <div class="history-result-section">
                        <div class="history-result-title">Deadlines</div>
                        <div class="history-result-content">
                            ${item.deadlines.length} items
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        this.historyContent.innerHTML = historyHtml;
    }

    async copyToClipboard(button) {
        const targetId = button.getAttribute('data-target');
        const targetElement = document.getElementById(targetId);

        if (!targetElement) return;

        const textContent = this.getPlainTextFromElement(targetElement);

        if (!textContent.trim()) return;

        try {
            await navigator.clipboard.writeText(textContent);

            // Visual feedback
            const icon = button.querySelector('i');
            const originalClass = icon.className;

            icon.className = 'fas fa-check text-success';

            setTimeout(() => {
                icon.className = originalClass;
            }, 2000);

        } catch (error) {
            console.error('Copy failed:', error);
        }
    }

    getPlainTextFromElement(element) {
        // Convert result items to plain text with bullet points
        const resultItems = element.querySelectorAll('.result-item');
        if (resultItems.length > 0) {
            return Array.from(resultItems)
                .map(item => {
                    // Get text from the second div (the content div), skipping the icon div
                    const contentDiv = item.children[1];
                    return `• ${contentDiv.textContent.trim()}`;
                })
                .join('\n');
        }

        return element.textContent.trim();
    }

    clearForm() {
        this.emailContent.value = '';
        this.updateCharacterCount();
        this.hideResults();
        this.hideError();
        this.emailContent.focus();
    }

    showLoading(show) {
        if (show) {
            this.analyzeBtn.disabled = true;
            if (this.btnText) this.btnText.classList.add('d-none');
            if (this.btnLoadingSpinner) this.btnLoadingSpinner.classList.remove('d-none');
        } else {
            this.analyzeBtn.disabled = false;
            if (this.btnText) this.btnText.classList.remove('d-none');
            if (this.btnLoadingSpinner) this.btnLoadingSpinner.classList.add('d-none');
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorAlert.classList.remove('d-none');
        // Small delay to allow display to update before adding opacity for fade-in
        setTimeout(() => this.errorAlert.classList.add('show'), 10);
    }

    hideError() {
        this.errorAlert.classList.add('d-none');
        this.errorAlert.classList.remove('show');
    }

    hideResults() {
        this.resultsSection.classList.add('d-none');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EmailWise();
});
