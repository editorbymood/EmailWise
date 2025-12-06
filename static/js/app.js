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

        // Chat Button
        const chatBtn = document.getElementById('chatSendBtn');
        if (chatBtn) {
            chatBtn.addEventListener('click', () => this.handleChatQuery());
        }

        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.handleChatQuery();
            });
        }

        // Quick Action Buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action, e.currentTarget);
            });
        });
    }

    async handleChatQuery() {
        const input = document.getElementById('chatInput');
        const history = document.getElementById('chatHistory');
        const query = input.value.trim();

        if (!query) return;

        // Add User Message
        const userDiv = document.createElement('div');
        userDiv.className = 'd-flex justify-content-end mb-3';
        userDiv.innerHTML = `<div class="bg-primary text-white p-2 px-3 rounded-pill small">${this.escapeHtml(query)}</div>`;
        history.appendChild(userDiv);

        input.value = '';
        history.scrollTop = history.scrollHeight;

        input.value = '';
        history.scrollTop = history.scrollHeight;

        // Show loading placeholder
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'chatLoading';
        loadingDiv.className = 'd-flex justify-content-start mb-3';
        loadingDiv.innerHTML = `<div class="glass-card p-2 px-3 rounded-3 small text-white border-0"><i class="fas fa-circle-notch fa-spin me-2"></i>Thinking...</div>`;
        history.appendChild(loadingDiv);
        history.scrollTop = history.scrollHeight;

        try {
            const emailText = document.getElementById('emailContent').value;
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email_content: emailText,
                    query: query
                })
            });

            const result = await response.json();

            // Remove loading
            loadingDiv.remove();

            // Show Answer
            const answer = result.success ? result.answer : "Sorry, I couldn't get an answer right now.";

            const aiDiv = document.createElement('div');
            aiDiv.className = 'd-flex justify-content-start mb-3';
            aiDiv.innerHTML = `<div class="glass-card p-2 px-3 rounded-3 small text-white border-0">${this.escapeHtml(answer)}</div>`;
            history.appendChild(aiDiv);
            history.scrollTop = history.scrollHeight;

        } catch (error) {
            if (document.getElementById('chatLoading')) document.getElementById('chatLoading').remove();
            console.error('Chat error:', error);
        }
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

    handleFileUpload() {
        const fileInput = document.getElementById('attachmentInput');
        const fileList = document.getElementById('fileList');

        if (!fileInput || !fileList) return;

        fileList.innerHTML = '';
        const files = Array.from(fileInput.files);

        if (files.length === 0) return;

        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'd-flex align-items-center gap-2 mb-1';
            fileItem.innerHTML = `
                <i class="fas fa-file-alt text-primary"></i>
                <span>${this.escapeHtml(file.name)}</span>
                <span class="text-muted ms-2">(${(file.size / 1024).toFixed(1)} KB)</span>
            `;
            fileList.appendChild(fileItem);
        });
    }

    attachEventListeners() {
        // Form submission
        this.emailForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.analyzeEmail();
        });

        // File Upload Trigger
        const uploadTrigger = document.getElementById('uploadTrigger');
        const fileInput = document.getElementById('attachmentInput');

        if (uploadTrigger && fileInput) {
            uploadTrigger.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', () => {
                this.handleFileUpload();
            });
        }

        // Clear button
        this.clearBtn.addEventListener('click', () => {
            this.clearForm();
        });
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
            const analysisOptions = {
                summary_style: document.getElementById('summaryStyle').value,
                output_language: document.getElementById('outputLanguage').value,
                reply_tone: document.getElementById('replyTone').value
            };

            // Use FormData to support attachments
            const formData = new FormData();
            formData.append('email_content', emailText);
            formData.append('analysis_options', JSON.stringify(analysisOptions));

            // Append files
            const fileInput = document.getElementById('attachmentInput');
            if (fileInput && fileInput.files.length > 0) {
                Array.from(fileInput.files).forEach(file => {
                    formData.append('attachments', file);
                });
            }

            const response = await fetch('/api/analyze', {
                method: 'POST',
                // Do NOT set Content-Type header when sending FormData
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.currentSummaryId = result.id; // Store ID for actions
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

    async handleQuickAction(action, button) {
        if (!this.currentSummaryId) {
            alert('No active email analysis found.');
            return;
        }

        const originalHtml = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        button.disabled = true;

        try {
            const response = await fetch('/api/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: this.currentSummaryId,
                    action: action
                })
            });

            const result = await response.json();

            if (result.success) {
                // Success feedback
                button.innerHTML = '<i class="fas fa-check"></i> Done';
                button.classList.remove('btn-outline-light-soft');
                button.classList.add('btn-success');

                // Revert after 2s
                setTimeout(() => {
                    button.innerHTML = originalHtml;
                    button.classList.remove('btn-success');
                    button.classList.add('btn-outline-light-soft');
                    button.disabled = false;
                }, 2000);
            } else {
                alert(result.error || 'Action failed');
                button.innerHTML = originalHtml;
                button.disabled = false;
            }
        } catch (error) {
            console.error('Action error:', error);
            button.innerHTML = originalHtml;
            button.disabled = false;
        }
    }

    displayResults(data, method) {
        // Display results
        this.displaySection(this.summaryContent, data.summary, 'No key points found.', 'fas fa-angle-right');
        this.displaySection(this.actionItemsContent, data.action_items, 'No action items identified.', 'far fa-square');
        this.displaySection(this.deadlinesContent, data.deadlines, 'No dates found.', 'far fa-clock');

        // Intelligence Pipeline
        this.updateIntelligence(data);

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

    updateIntelligence(data) {
        // 1. HUD Updates
        this.updateText('intentBadge', data.intent || 'General');
        this.updateUrgency(data.urgency_score);
        this.updateSentiment(data.sentiment);
        this.updateText('confidenceBadge', `${Math.round((data.confidence_score || 0) * 100)}%`);

        // 2. Spam Alert
        const spamInfo = data.spam_analysis || {};
        const spamAlert = document.getElementById('spamAlert');
        if (spamInfo.is_spam) {
            document.getElementById('spamReason').textContent = spamInfo.reason || 'Suspicious content detected.';
            spamAlert.classList.remove('d-none');
        } else {
            spamAlert.classList.add('d-none');
        }

        // 3. Decision Card
        const riskData = data.risk_assessment || {};
        const decisionCard = document.getElementById('decisionCard');
        const hasDecisionData = (riskData.pros?.length > 0 || riskData.cons?.length > 0 || riskData.risks?.length > 0);

        if (hasDecisionData) {
            decisionCard.classList.remove('d-none');
            this.renderList('prosList', riskData.pros);
            this.renderList('consList', riskData.cons);
            this.renderList('risksList', riskData.risks);
        } else {
            decisionCard.classList.add('d-none');
        }

        // 4. Reply
        const replyData = data.suggested_replies ? data : data.suggested_reply;
        this.updateReply(replyData);
    }

    updateUrgency(score) {
        const badge = document.getElementById('urgencyBadge');
        if (!badge) return;

        score = parseInt(score) || 0;
        let colorClass = 'text-success';

        if (score >= 8) colorClass = 'text-danger';
        else if (score >= 5) colorClass = 'text-warning';

        badge.className = `fw-bold fs-3 ${colorClass}`;
        badge.textContent = `${score}/10`;
    }

    updateSentiment(sentiment) {
        const badge = document.getElementById('sentimentBadge');
        if (!badge) return;

        const sentimentLower = (sentiment || '').toLowerCase();
        let emoji = '😐'; // Neutral
        if (sentimentLower.includes('happy') || sentimentLower.includes('friendly') || sentimentLower.includes('positive') || sentimentLower.includes('enthusiastic')) emoji = '😊';
        else if (sentimentLower.includes('angry') || sentimentLower.includes('frustrated') || sentimentLower.includes('annoyed')) emoji = '😠';
        else if (sentimentLower.includes('urgent') || sentimentLower.includes('anxious') || sentimentLower.includes('concerned')) emoji = '😟';
        else if (sentimentLower.includes('professional') || sentimentLower.includes('formal')) emoji = '👔';
        else if (sentimentLower.includes('passive')) emoji = '🙄';

        badge.innerHTML = `<span class="fs-4 me-2">${emoji}</span><span class="fw-medium">${sentiment || 'Neutral'}</span>`;
    }

    updateText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    renderList(id, items) {
        const list = document.getElementById(id);
        if (!list) return;

        if (!items || items.length === 0) {
            list.innerHTML = '<li class="text-muted fst-italic opacity-50">None identified</li>';
            return;
        }

        list.innerHTML = items.map(item => `<li>${this.escapeHtml(item)}</li>`).join('');
    }

    updateReply(data) {
        // Handle explicit multiple replies structure
        if (data && data.suggested_replies) {
            const reply1 = document.getElementById('replyContent1');
            const reply2 = document.getElementById('replyContent2');
            const label1 = document.getElementById('reply-1-tab');
            const label2 = document.getElementById('reply-2-tab');

            if (reply1) reply1.innerText = data.suggested_replies.option_1 || 'No draft generated.';
            if (reply2) reply2.innerText = data.suggested_replies.option_2 || 'No draft generated.';

            if (label1) label1.innerText = data.suggested_replies.option_1_label || 'Option 1';
            if (label2) label2.innerText = data.suggested_replies.option_2_label || 'Option 2';

            return;
        }

        // Fallback for single reply (legacy or local)
        const singleReply = typeof data === 'string' ? data : (data?.suggested_reply || '');
        const reply1 = document.getElementById('replyContent1');
        if (reply1) reply1.innerText = singleReply || 'No suggested reply generated.';

        // Hide second tab if only single reply exists
        const tab2 = document.getElementById('reply-2-tab');
        if (tab2 && !data?.suggested_replies) {
            tab2.style.display = 'none';
        }
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

        const isDeadlines = container.id === 'deadlinesContent';

        const listItems = items
            .filter(item => item && item.trim().length > 0)
            .map(item => {
                let extraContent = '';
                if (isDeadlines) {
                    const encodedTitle = encodeURIComponent('Task Deadline: ' + item);
                    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}`;
                    extraContent = `<a href="${calUrl}" target="_blank" class="ms-auto btn btn-xs btn-outline-light-soft" title="Add to Google Calendar"><i class="fas fa-calendar-plus"></i></a>`;
                }

                return `
                <div class="result-item d-flex gap-2 align-items-start mb-2">
                    <div class="mt-1 text-primary opacity-75 flex-shrink-0">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="flex-grow-1">${this.escapeHtml(item.trim())}</div>
                    ${extraContent}
                </div>
            `})
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
