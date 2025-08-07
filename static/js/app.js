// EmailWise JavaScript Application

class EmailWise {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.loadHistory();
    }

    initializeElements() {
        // Form elements
        this.emailForm = document.getElementById('emailForm');
        this.emailContent = document.getElementById('emailContent');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.clearBtn = document.getElementById('clearBtn');

        // UI elements
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.errorAlert = document.getElementById('errorAlert');
        this.errorMessage = document.getElementById('errorMessage');
        this.resultsSection = document.getElementById('resultsSection');

        // Content elements
        this.summaryContent = document.getElementById('summaryContent');
        this.actionItemsContent = document.getElementById('actionItemsContent');
        this.deadlinesContent = document.getElementById('deadlinesContent');
        this.historyContent = document.getElementById('historyContent');

        // History button
        this.refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
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

        // Copy buttons (using event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-btn') || e.target.closest('.copy-btn')) {
                const button = e.target.closest('.copy-btn') || e.target;
                this.copyToClipboard(button);
            }
        });

        // Refresh history button
        this.refreshHistoryBtn.addEventListener('click', () => {
            this.loadHistory();
        });

        // Auto-resize textarea
        this.emailContent.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
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
        // Display summary
        this.displaySection(this.summaryContent, data.summary, 'No key points found in this email.');

        // Display action items
        this.displaySection(this.actionItemsContent, data.action_items, 'No action items identified in this email.');

        // Display deadlines
        this.displaySection(this.deadlinesContent, data.deadlines, 'No dates or deadlines found in this email.');

        // Show method indicator
        const methodBadge = method === 'openai' ? 
            '<span class="badge bg-success ms-2">AI Powered</span>' : 
            '<span class="badge bg-secondary ms-2">Local Analysis</span>';
        
        // Add method indicator to summary header
        const summaryHeader = document.querySelector('.card-header h4');
        if (summaryHeader && !summaryHeader.querySelector('.badge')) {
            summaryHeader.innerHTML += methodBadge;
        }

        // Show results section with animation
        this.resultsSection.classList.remove('d-none');
        this.resultsSection.classList.add('fade-in');

        // Scroll to results
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    displaySection(container, items, emptyMessage) {
        if (!items || items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-info-circle"></i>
                    <p class="mb-0">${emptyMessage}</p>
                </div>
            `;
            return;
        }

        const listItems = items
            .filter(item => item && item.trim().length > 0)
            .map(item => `
                <div class="result-item">
                    <i class="fas fa-check-circle"></i>
                    ${this.escapeHtml(item.trim())}
                </div>
            `)
            .join('');

        container.innerHTML = listItems || `
            <div class="empty-state">
                <i class="fas fa-info-circle"></i>
                <p class="mb-0">${emptyMessage}</p>
            </div>
        `;
    }

    async loadHistory() {
        try {
            const response = await fetch('/api/history');
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                this.displayHistory(result.data);
            } else {
                this.historyContent.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clock"></i>
                        <p class="mb-0">No analysis history yet. Analyze an email to see it here.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading history:', error);
            this.historyContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p class="mb-0">Error loading history. Please try again.</p>
                </div>
            `;
        }
    }

    displayHistory(historyItems) {
        const historyHtml = historyItems.map(item => `
            <div class="history-item">
                <div class="history-meta mb-2">
                    <i class="fas fa-clock me-1"></i>
                    ${item.created_at}
                </div>
                <div class="fw-bold mb-2">${this.escapeHtml(item.email_content)}</div>
                <div class="row">
                    <div class="col-md-4">
                        <small class="text-muted">Summary:</small>
                        <div class="small">${item.summary.length > 0 ? item.summary.slice(0, 2).map(s => this.escapeHtml(s)).join('<br>') : 'None'}</div>
                    </div>
                    <div class="col-md-4">
                        <small class="text-muted">Action Items:</small>
                        <div class="small">${item.action_items.length > 0 ? item.action_items.slice(0, 2).map(a => this.escapeHtml(a)).join('<br>') : 'None'}</div>
                    </div>
                    <div class="col-md-4">
                        <small class="text-muted">Deadlines:</small>
                        <div class="small">${item.deadlines.length > 0 ? item.deadlines.slice(0, 2).map(d => this.escapeHtml(d)).join('<br>') : 'None'}</div>
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

        // Get text content from the target element
        const textContent = this.getPlainTextFromElement(targetElement);
        
        if (!textContent.trim()) {
            this.showError('Nothing to copy.');
            return;
        }

        try {
            await navigator.clipboard.writeText(textContent);
            
            // Visual feedback
            const originalHtml = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check me-1"></i>Copied!';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.innerHTML = originalHtml;
                button.classList.remove('copied');
            }, 2000);
            
        } catch (error) {
            console.error('Copy failed:', error);
            this.showError('Failed to copy to clipboard.');
        }
    }

    getPlainTextFromElement(element) {
        // Convert result items to plain text with bullet points
        const resultItems = element.querySelectorAll('.result-item');
        if (resultItems.length > 0) {
            return Array.from(resultItems)
                .map(item => `• ${item.textContent.trim()}`)
                .join('\n');
        }
        
        // Fallback to element text content
        return element.textContent.trim();
    }

    clearForm() {
        this.emailContent.value = '';
        this.hideResults();
        this.hideError();
        this.emailContent.focus();
    }

    showLoading(show) {
        if (show) {
            this.loadingIndicator.classList.remove('d-none');
            this.analyzeBtn.disabled = true;
            this.analyzeBtn.classList.add('btn-loading');
            this.analyzeBtn.innerHTML = '<span class="visually-hidden">Analyzing...</span>';
        } else {
            this.loadingIndicator.classList.add('d-none');
            this.analyzeBtn.disabled = false;
            this.analyzeBtn.classList.remove('btn-loading');
            this.analyzeBtn.innerHTML = '<i class="fas fa-brain me-2"></i>Analyze Email';
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorAlert.classList.remove('d-none');
        this.errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    hideError() {
        this.errorAlert.classList.add('d-none');
    }

    hideResults() {
        this.resultsSection.classList.add('d-none');
        this.resultsSection.classList.remove('fade-in');
        
        // Remove method badges
        const badges = document.querySelectorAll('.badge');
        badges.forEach(badge => badge.remove());
    }

    autoResizeTextarea() {
        const textarea = this.emailContent;
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(200, textarea.scrollHeight) + 'px';
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
