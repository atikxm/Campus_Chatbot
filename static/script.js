// ADTU Smart Campus Chatbot - Complete Professional Version
let currentTheme = 'dark';
let isAdminLoggedIn = false;
let conversationHistory = [];

// Initialize chatbot
function initChatbot() {
    initTheme();
    loadConversationHistory();
    checkAdminAuth();
    updateAnalytics();
    
    // Set initial timestamp
    document.getElementById('initialTime').textContent = 
        new Date().toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
    
    // Dynamic placeholder rotation
    const placeholders = [
        "Ask about B.Tech admissions 2024...",
        "What are the computer science eligibility criteria?",
        "Tell me about hostel facilities and fees...",
        "How to apply for scholarships?",
        "What companies visit for placements?",
        "Where are the exam halls located?",
        "What courses do you offer in Engineering?",
        "Contact number and campus address..."
    ];
    
    let placeholderIndex = 0;
    setInterval(() => {
        const input = document.getElementById('userInput');
        input.placeholder = placeholders[placeholderIndex];
        placeholderIndex = (placeholderIndex + 1) % placeholders.length;
    }, 3000);
}

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('chatbot-theme') || 'dark';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', currentTheme);
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('chatbot-theme', currentTheme);
    
    showNotification(`Switched to ${currentTheme} theme`, 'success');
}

// Enhanced Message Display
function displayMessage(message, isUser = false) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const timestamp = new Date().toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    
    const avatarIcon = isUser ? 'fas fa-user' : 'fas fa-robot';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="${avatarIcon}"></i>
        </div>
        <div class="message-content">
            <p>${formatMessage(message)}</p>
            <span class="timestamp">${timestamp}</span>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    
    // Add animation with delay
    setTimeout(() => {
        messageDiv.style.animation = 'messagePop 0.5s ease';
    }, 50);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Save to conversation history
    if (isUser) {
        conversationHistory.push({
            type: 'user',
            message: message,
            timestamp: new Date().toISOString()
        });
    } else {
        conversationHistory.push({
            type: 'bot',
            message: message,
            timestamp: new Date().toISOString()
        });
    }
    
    saveConversationHistory();
    updateAnalytics();
}

// Format message with proper line breaks and lists
function formatMessage(text) {
    // Convert line breaks to <br>
    text = text.replace(/\n/g, '<br>');
    
    // Convert numbered lists
    text = text.replace(/(\d+\)) /g, '<br>$1 ');
    
    // Convert bullet points
    text = text.replace(/• /g, '<br>• ');
    
    return text;
}

// Enhanced Loading with Random Messages
function showEnhancedLoading() {
    const loading = document.getElementById('loadingOverlay');
    const loadingMessage = document.getElementById('loadingMessage');
    
    const messages = [
        "Analyzing your question with ADTU AI...",
        "Searching through university database...",
        "Processing your request intelligently...",
        "Consulting ADTU knowledge base...",
        "Generating personalized response...",
        "Accessing campus information...",
        "Checking latest admission updates...",
        "Verifying course details..."
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    loadingMessage.textContent = randomMessage;
    
    loading.style.display = 'flex';
}

function hideEnhancedLoading() {
    const loading = document.getElementById('loadingOverlay');
    loading.style.display = 'none';
}

// Fast Message Sending with Quick Response
async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();
    
    if (message === '') return;
    
    // Display user message immediately
    displayMessage(message, true);
    userInput.value = '';
    
    // Show enhanced loading
    showEnhancedLoading();
    
    try {
        // Fast response simulation (shorter delay)
        const thinkingTime = 300 + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, thinkingTime));
        
        // Send to backend
        const response = await fetch('/get_response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        const data = await response.json();
        
        // Hide loading and display response quickly
        hideEnhancedLoading();
        displayMessage(data.response);
        
    } catch (error) {
        console.error('Error:', error);
        hideEnhancedLoading();
        displayMessage('I apologize, but I encountered an error. Please try again or visit www.adtu.in for detailed information.');
    }
}

// Quick question with animation
function quickQuestion(question) {
    const input = document.getElementById('userInput');
    
    // Add visual feedback
    input.value = question;
    input.style.transform = 'scale(1.05)';
    
    setTimeout(() => {
        input.style.transform = 'scale(1)';
        sendMessage();
    }, 200);
}

// Clear chat with confirmation
function clearChat() {
    if (conversationHistory.length > 1) {
        if (confirm('Are you sure you want to clear the chat history?')) {
            const chatMessages = document.getElementById('chatMessages');
            const initialMessage = chatMessages.children[0];
            
            chatMessages.innerHTML = '';
            chatMessages.appendChild(initialMessage);
            
            conversationHistory = [conversationHistory[0]];
            saveConversationHistory();
            
            showNotification('Chat history cleared successfully!', 'success');
        }
    } else {
        showNotification('No chat history to clear!', 'info');
    }
}

// Download chat history
function downloadChat() {
    if (conversationHistory.length <= 1) {
        showNotification('No conversation to download!', 'info');
        return;
    }
    
    let chatText = 'ADTU Smart Campus Chatbot - Conversation History\n';
    chatText += 'Assam Down Town University\n';
    chatText += 'Generated on: ' + new Date().toLocaleString() + '\n';
    chatText += 'Website: www.adtu.in\n';
    chatText += 'Contact: +91-361-22334455\n\n';
    
    conversationHistory.forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        const sender = msg.type === 'user' ? 'You' : 'ADTU Assistant';
        chatText += `[${time}] ${sender}: ${msg.message}\n`;
    });
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adtu-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Chat history downloaded successfully!', 'success');
}

// Admin Panel Functions
function openAdminPanel() {
    document.getElementById('adminModal').style.display = 'flex';
    showLoginForm();
    checkAdminAuth();
}

function closeAdminPanel() {
    document.getElementById('adminModal').style.display = 'none';
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
    // Clear form fields
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
}

function showAdminDashboard() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    loadAdminStats();
    switchAdminTab('manage');
}

function switchAdminTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show the specific tab content
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Add active class to the current button
    event.currentTarget.classList.add('active');
    
    if (tabName === 'analytics') {
        updateAdminAnalytics();
    }
}

// Admin Authentication
async function checkAdminAuth() {
    try {
        const response = await fetch('/admin/check_auth');
        const data = await response.json();
        
        if (data.authenticated) {
            showAdminDashboard();
        } else {
            showLoginForm();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showLoginForm();
    }
}

async function adminLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    if (!username || !password) {
        showNotification('Please enter both username and password!', 'error');
        return;
    }
    
    try {
        const response = await fetch('/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showNotification('Admin login successful!', 'success');
            showAdminDashboard();
        } else {
            showNotification('Invalid admin credentials!', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    }
}

async function adminLogout() {
    try {
        const response = await fetch('/admin/logout', {
            method: 'POST'
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            showNotification('Logged out successfully!', 'success');
            showLoginForm();
        }
    } catch (error) {
        console.error('Logout error:', error);
        showLoginForm();
    }
}

// Admin Stats and Management
async function loadAdminStats() {
    try {
        const response = await fetch('/admin/stats');
        const data = await response.json();
        
        document.getElementById('totalQuestions').textContent = data.total_questions;
        document.getElementById('totalCategories').textContent = data.total_categories;
        document.getElementById('analyticsKnowledgeBase').textContent = data.total_questions;
    } catch (error) {
        console.error('Error loading admin stats:', error);
    }
}

async function addNewQuestion() {
    const category = document.getElementById('questionCategory').value;
    const patterns = document.getElementById('questionPatterns').value.split(',').map(p => p.trim());
    const answer = document.getElementById('questionAnswer').value;
    
    if (!patterns.length || !answer) {
        showNotification('Please fill all fields!', 'error');
        return;
    }
    
    try {
        const response = await fetch('/admin/add_question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                category: category,
                patterns: patterns,
                answer: answer
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showNotification('Question added successfully!', 'success');
            document.getElementById('questionPatterns').value = '';
            document.getElementById('questionAnswer').value = '';
            loadAdminStats(); // Refresh stats
        } else {
            showNotification('Error adding question: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error adding question!', 'error');
    }
}

async function updateAdminAnalytics() {
    try {
        const response = await fetch('/api/analytics');
        const data = await response.json();
        
        document.getElementById('analyticsTotalQuestions').textContent = data.total_questions;
        document.getElementById('analyticsSuccessRate').textContent = data.success_rate + '%';
        document.getElementById('analyticsResponseTime').textContent = data.avg_response_time + 's';
    } catch (error) {
        console.error('Error updating admin analytics:', error);
    }
}

// Utility Functions
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'info': 'fa-info-circle',
        'warning': 'fa-exclamation-triangle'
    };
    
    notification.innerHTML = `
        <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success-green)' : 
                     type === 'error' ? 'var(--accent-pink)' : 
                     type === 'warning' ? 'var(--warning-orange)' : 'var(--secondary-blue)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: var(--shadow-deep);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.8rem;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Local storage functions
function saveConversationHistory() {
    localStorage.setItem('adtu-chat-history', JSON.stringify(conversationHistory));
}

function loadConversationHistory() {
    const saved = localStorage.getItem('adtu-chat-history');
    if (saved) {
        conversationHistory = JSON.parse(saved);
        // Re-render conversation history (skip for now to keep clean)
    }
}

// Analytics
async function updateAnalytics() {
    try {
        const response = await fetch('/api/analytics');
        const data = await response.json();
        
        // Update main analytics if needed
    } catch (error) {
        console.error('Error updating analytics:', error);
    }
}

// Easter eggs and special features
const specialResponses = {
    'website': '🌐 Visit our official website: <strong>www.adtu.in</strong> for detailed information about admissions, courses, faculty, campus life, and more!',
    'adtu.in': '🔗 Our website <strong>www.adtu.in</strong> has all the information you need - admission forms, fee structure, academic calendar, and contact details!',
    'online': '💻 For online applications and detailed information, visit <strong>www.adtu.in</strong>. You can apply online, check status, and download brochures!',
    'internet': '📱 All information is available online at <strong>www.adtu.in</strong>. You can also follow us on social media for updates!'
};

// Enhanced message sending with website references
const originalSendMessage = sendMessage;
sendMessage = async function() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim().toLowerCase();
    
    // Check for website-related queries
    for (const [key, response] of Object.entries(specialResponses)) {
        if (message.includes(key)) {
            userInput.value = '';
            displayMessage(message, true);
            
            showEnhancedLoading();
            await new Promise(resolve => setTimeout(resolve, 600));
            hideEnhancedLoading();
            
            setTimeout(() => {
                displayMessage(response);
            }, 200);
            return;
        }
    }
    
    // Original functionality
    originalSendMessage();
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initChatbot);

// Handle Enter key in admin forms
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        if (e.target.id === 'userInput') {
            sendMessage();
        } else if (e.target.id === 'adminUsername' || e.target.id === 'adminPassword') {
            adminLogin();
        }
    }
});