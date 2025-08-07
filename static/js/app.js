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

        // UI elements
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.errorAlert = document.getElementById('errorAlert');
        this.errorMessage = document.getElementById('errorMessage');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsMeta = document.getElementById('resultsMeta');

        // Content elements
        this.summaryContent = document.getElementById('summaryContent');
        this.actionItemsContent = document.getElementById('actionItemsContent');
        this.deadlinesContent = document.getElementById('deadlinesContent');
        this.historyContent = document.getElementById('historyContent');

        // Enhanced UI elements
        this.pasteHint = document.getElementById('pasteHint');
        this.inputStats = document.getElementById('inputStats');
        this.charCount = document.getElementById('charCount');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.closeError = document.getElementById('closeError');

        // History button
        this.refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
        
        // Loading states
        this.btnContent = this.analyzeBtn.querySelector('.btn-content');
        this.btnLoadingSpinner = this.analyzeBtn.querySelector('.btn-loading-spinner');
    }

    initializeEnhancements() {
        // Initialize character counter
        this.updateCharacterCount();
        
        // Add smooth scrolling
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // Initialize paste hint
        this.setupPasteHint();
        
        // Initialize auto-resize
        this.autoResizeTextarea();
        
        // Initialize futuristic effects
        this.initializeParticleSystem();
        this.initializeCyberEffects();
    }

    initializeParticleSystem() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        // Create fewer, more subtle particles
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
            particle.style.opacity = '0.3';
            particlesContainer.appendChild(particle);
        }
    }

    initializeCyberEffects() {
        // Skip typing effect for main title to keep it visible
        // this.initializeTypingEffect();
        
        // Initialize matrix rain effect
        this.initializeMatrixRain();
        
        // Initialize cyber button particles
        this.initializeButtonParticles();
    }

    initializeTypingEffect() {
        const cyberElements = document.querySelectorAll('.cyber-text');
        cyberElements.forEach(element => {
            const text = element.textContent;
            element.textContent = '';
            let i = 0;
            const typeInterval = setInterval(() => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                } else {
                    clearInterval(typeInterval);
                }
            }, 50);
        });
    }

    initializeMatrixRain() {
        // Add subtle matrix-like effect to certain areas
        const matrices = document.querySelectorAll('.data-stream');
        matrices.forEach(matrix => {
            setInterval(() => {
                const char = String.fromCharCode(0x30A0 + Math.random() * 96);
                const span = document.createElement('span');
                span.textContent = char;
                span.style.position = 'absolute';
                span.style.color = 'rgba(0, 255, 255, 0.1)';
                span.style.fontSize = '8px';
                span.style.animation = 'matrix-fall 2s linear forwards';
                matrix.appendChild(span);
                
                setTimeout(() => {
                    if (span.parentNode) span.parentNode.removeChild(span);
                }, 2000);
            }, 200);
        });
    }

    initializeButtonParticles() {
        const cyberButtons = document.querySelectorAll('.cyber-btn');
        cyberButtons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                this.createButtonParticles(button);
            });
        });
    }

    createButtonParticles(button) {
        const rect = button.getBoundingClientRect();
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 2px;
                height: 2px;
                background: #00ffff;
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                left: ${rect.left + Math.random() * rect.width}px;
                top: ${rect.top + Math.random() * rect.height}px;
                animation: explode-particle 0.8s ease-out forwards;
            `;
            document.body.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) particle.parentNode.removeChild(particle);
            }, 800);
        }
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

        // Enhanced textarea events
        this.emailContent.addEventListener('input', (e) => {
            this.autoResizeTextarea();
            this.updateCharacterCount();
            this.togglePasteHint();
        });

        this.emailContent.addEventListener('focus', () => {
            this.showInputStats();
        });

        this.emailContent.addEventListener('blur', () => {
            this.hideInputStats();
        });

        this.emailContent.addEventListener('paste', () => {
            this.hidePasteHint();
            setTimeout(() => {
                this.autoResizeTextarea();
                this.updateCharacterCount();
            }, 100);
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
                e.preventDefault();
                if (this.emailContent.value.trim()) {
                    this.analyzeEmail();
                }
            }
            
            // Escape to close error
            if (e.key === 'Escape') {
                this.hideError();
            }
        });
    }

    setupPasteHint() {
        if (this.pasteHint) {
            // Show paste hint when textarea is empty and focused
            this.emailContent.addEventListener('focus', () => {
                if (!this.emailContent.value.trim()) {
                    this.showPasteHint();
                }
            });

            this.emailContent.addEventListener('blur', () => {
                this.hidePasteHint();
            });
        }
    }

    showPasteHint() {
        if (this.pasteHint) {
            this.pasteHint.classList.add('show');
        }
    }

    hidePasteHint() {
        if (this.pasteHint) {
            this.pasteHint.classList.remove('show');
        }
    }

    togglePasteHint() {
        if (!this.emailContent.value.trim()) {
            this.showPasteHint();
        } else {
            this.hidePasteHint();
        }
    }

    updateCharacterCount() {
        if (this.charCount) {
            const count = this.emailContent.value.length;
            this.charCount.textContent = count.toLocaleString();
        }
    }

    showInputStats() {
        if (this.inputStats) {
            this.inputStats.classList.remove('d-none');
        }
    }

    hideInputStats() {
        if (this.inputStats && !this.emailContent.value.trim()) {
            this.inputStats.classList.add('d-none');
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
        // Display enhanced results
        this.displaySection(this.summaryContent, data.summary, 'No key points found in this email.');
        this.displaySection(this.actionItemsContent, data.action_items, 'No action items identified in this email.');
        this.displaySection(this.deadlinesContent, data.deadlines, 'No dates or deadlines found in this email.');

        // Update results metadata
        this.updateResultsMeta(data, method);

        // Show results section with enhanced animation
        this.resultsSection.classList.remove('d-none');
        this.resultsSection.classList.add('fade-in');

        // Add staggered animation to result cards
        const resultCards = this.resultsSection.querySelectorAll('.result-card');
        resultCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in');
        });

        // Smooth scroll to results with offset
        setTimeout(() => {
            const rect = this.resultsSection.getBoundingClientRect();
            const offset = 80; // Account for fixed headers
            window.scrollTo({
                top: window.pageYOffset + rect.top - offset,
                behavior: 'smooth'
            });
        }, 200);
    }

    updateResultsMeta(data, method) {
        if (this.resultsMeta) {
            const totalItems = (data.summary?.length || 0) + 
                             (data.action_items?.length || 0) + 
                             (data.deadlines?.length || 0);
            
            const methodBadge = method === 'openai' ? 
                '<span class="badge bg-success">✨ AI Analysis</span>' : 
                '<span class="badge bg-secondary">🔧 Local Analysis</span>';
            
            const analysisTime = new Date().toLocaleTimeString();
            
            this.resultsMeta.innerHTML = `
                <div class="d-flex flex-wrap justify-content-center align-items-center gap-3">
                    ${methodBadge}
                    <span class="badge bg-info">${totalItems} items extracted</span>
                    <small class="text-muted">Analyzed at ${analysisTime}</small>
                </div>
            `;
        }
    }

    displaySection(container, items, emptyMessage) {
        if (!items || items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-info-circle"></i>
                    <h5>No items found</h5>
                    <p class="mb-0">${emptyMessage}</p>
                </div>
            `;
            return;
        }

        const listItems = items
            .filter(item => item && item.trim().length > 0)
            .map((item, index) => `
                <div class="result-item" style="animation-delay: ${index * 0.05}s">
                    <i class="fas fa-check-circle"></i>
                    <div class="result-item-text">${this.escapeHtml(item.trim())}</div>
                </div>
            `)
            .join('');

        container.innerHTML = listItems || `
            <div class="empty-state">
                <i class="fas fa-info-circle"></i>
                <h5>No items found</h5>
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
        const historyHtml = historyItems.map((item, index) => `
            <div class="history-item" style="animation-delay: ${index * 0.1}s">
                <div class="history-meta">
                    <i class="fas fa-clock me-1"></i>
                    <span>${item.created_at}</span>
                    <span class="badge bg-dark ms-auto">ID: ${item.id}</span>
                </div>
                <div class="history-email-preview">
                    ${this.escapeHtml(item.email_content)}
                </div>
                <div class="history-results">
                    <div class="history-result-section">
                        <div class="history-result-title">Summary</div>
                        <div class="history-result-content">
                            ${item.summary.length > 0 ? 
                                item.summary.slice(0, 3).map(s => `<div class="result-item"><i class="fas fa-dot-circle"></i> ${this.escapeHtml(s)}</div>`).join('') : 
                                '<div class="history-no-content">None found</div>'}
                        </div>
                    </div>
                    <div class="history-result-section">
                        <div class="history-result-title">Action Items</div>
                        <div class="history-result-content">
                            ${item.action_items.length > 0 ? 
                                item.action_items.slice(0, 3).map(a => `<div class="result-item"><i class="fas fa-dot-circle"></i> ${this.escapeHtml(a)}</div>`).join('') : 
                                '<div class="history-no-content">None found</div>'}
                        </div>
                    </div>
                    <div class="history-result-section">
                        <div class="history-result-title">Deadlines</div>
                        <div class="history-result-content">
                            ${item.deadlines.length > 0 ? 
                                item.deadlines.slice(0, 3).map(d => `<div class="result-item"><i class="fas fa-dot-circle"></i> ${this.escapeHtml(d)}</div>`).join('') : 
                                '<div class="history-no-content">None found</div>'}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        this.historyContent.innerHTML = historyHtml;
        
        // Add fade-in animation to history items
        const historyElements = this.historyContent.querySelectorAll('.history-item');
        historyElements.forEach(item => {
            item.classList.add('fade-in');
        });
    }

    async copyToClipboard(button) {
        const targetId = button.getAttribute('data-target');
        const targetElement = document.getElementById(targetId);
        
        if (!targetElement) return;

        // Get text content from the target element
        const textContent = this.getPlainTextFromElement(targetElement);
        
        if (!textContent.trim()) {
            this.showTemporaryToast('Nothing to copy', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(textContent);
            
            // Enhanced visual feedback
            const originalHtml = button.innerHTML;
            const originalClasses = button.className;
            
            button.innerHTML = '<i class="fas fa-check"></i>';
            button.classList.add('copied');
            
            // Show success toast
            this.showTemporaryToast(`Copied ${textContent.split('\n').length} items`, 'success');
            
            setTimeout(() => {
                button.innerHTML = originalHtml;
                button.className = originalClasses;
            }, 2000);
            
        } catch (error) {
            console.error('Copy failed:', error);
            
            // Fallback for older browsers
            this.fallbackCopyTextToClipboard(textContent, button);
        }
    }

    fallbackCopyTextToClipboard(text, button) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            this.showTemporaryToast('Copied successfully', 'success');
            
            // Visual feedback for button
            const originalHtml = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i>';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.innerHTML = originalHtml;
                button.classList.remove('copied');
            }, 2000);
            
        } catch (err) {
            this.showTemporaryToast('Copy failed - please select text manually', 'error');
        }

        document.body.removeChild(textArea);
    }

    showTemporaryToast(message, type = 'info') {
        // Create toast element if it doesn't exist
        let toast = document.getElementById('toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                font-size: 0.9rem;
                z-index: 9999;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(toast);
        }

        // Set toast style based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };

        toast.style.backgroundColor = colors[type] || colors.info;
        toast.textContent = message;

        // Show toast
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Hide toast
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
        }, 3000);
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
            
            // Enhanced button loading state
            if (this.btnContent && this.btnLoadingSpinner) {
                this.btnContent.classList.add('d-none');
                this.btnLoadingSpinner.classList.remove('d-none');
            }
            
            // Dynamic loading messages
            this.updateLoadingMessage();
            
            // Start loading message rotation
            this.loadingMessageInterval = setInterval(() => {
                this.updateLoadingMessage();
            }, 2000);
            
        } else {
            this.loadingIndicator.classList.add('d-none');
            this.analyzeBtn.disabled = false;
            
            // Reset button state
            if (this.btnContent && this.btnLoadingSpinner) {
                this.btnContent.classList.remove('d-none');
                this.btnLoadingSpinner.classList.add('d-none');
            }
            
            // Clear loading message interval
            if (this.loadingMessageInterval) {
                clearInterval(this.loadingMessageInterval);
            }
        }
    }

    updateLoadingMessage() {
        if (this.loadingMessage) {
            const messages = [
                'Processing email content...',
                'Extracting key information...',
                'Analyzing action items...',
                'Finding deadlines...',
                'Generating summary...',
                'Almost done...'
            ];
            
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            this.loadingMessage.textContent = randomMessage;
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
