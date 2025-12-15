/**
 * Enron Email Mailbox Application
 * Loads and displays emails from JSON index with search and filtering
 */

class MailboxApp {
    constructor() {
        this.mailboxData = null;
        this.currentFolder = null;  // Will be set after loading data
        this.currentPage = 1;
        this.emailsPerPage = 50;
        this.searchTerm = '';
        this.filteredEmails = [];
        this.mailboxName = this.getCurrentMailbox();
        this.folderCache = new Map(); // Cache filtered emails per folder
        this.loadingProgress = { current: 0, total: 0 }; // Track loading progress
        
        // LocalStorage state management
        this.readEmails = this.loadReadEmails();
        this.starredEmails = this.loadStarredEmails();
        
        // Search debouncing
        this.searchDebounceTimer = null;
        this.SEARCH_DEBOUNCE_MS = 300;
        
        // Sorting
        this.currentSort = { field: 'date', direction: 'desc' }; // date, from, subject
        this.folderSearchTerm = '';
        this.showAllFolders = false;
    }
    
    loadReadEmails() {
        try {
            const stored = localStorage.getItem(`enron_read_${this.mailboxName}`);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch (e) {
            return new Set();
        }
    }
    
    saveReadEmails() {
        try {
            localStorage.setItem(`enron_read_${this.mailboxName}`, JSON.stringify([...this.readEmails]));
        } catch (e) {
            console.warn('Failed to save read emails:', e);
        }
    }
    
    loadStarredEmails() {
        try {
            const stored = localStorage.getItem(`enron_starred_${this.mailboxName}`);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch (e) {
            return new Set();
        }
    }
    
    saveStarredEmails() {
        try {
            localStorage.setItem(`enron_starred_${this.mailboxName}`, JSON.stringify([...this.starredEmails]));
        } catch (e) {
            console.warn('Failed to save starred emails:', e);
        }
    }
    
    markAsRead(emailId) {
        this.readEmails.add(emailId);
        this.saveReadEmails();
    }
    
    toggleStar(emailId) {
        if (this.starredEmails.has(emailId)) {
            this.starredEmails.delete(emailId);
        } else {
            this.starredEmails.add(emailId);
        }
        this.saveStarredEmails();
        return this.starredEmails.has(emailId);
    }
    
    getCurrentMailbox() {
        // Check for logout flag first
        if (sessionStorage.getItem('logging_out') === 'true') {
            sessionStorage.removeItem('logging_out');
            localStorage.removeItem('enron_current_mailbox');
            return null;
        }
        
        // First check URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const mailboxFromUrl = urlParams.get('mailbox');
        if (mailboxFromUrl) {
            // Store in localStorage for consistency
            localStorage.setItem('enron_current_mailbox', mailboxFromUrl);
            return mailboxFromUrl;
        }
        // Fall back to localStorage
        return localStorage.getItem('enron_current_mailbox');
    }
    
    getUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            mailbox: urlParams.get('mailbox'),
            folder: urlParams.get('folder'),
            email: urlParams.get('email')
        };
    }
    
    updateUrl(params = {}) {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Always include mailbox
        if (this.mailboxName) {
            urlParams.set('mailbox', this.mailboxName);
        }
        
        // Update or remove folder parameter
        if (params.folder !== undefined) {
            if (params.folder) {
                urlParams.set('folder', params.folder);
            } else {
                urlParams.delete('folder');
            }
        }
        
        // Update or remove email parameter
        if (params.email !== undefined) {
            if (params.email) {
                urlParams.set('email', params.email);
            } else {
                urlParams.delete('email');
            }
        }
        
        // Update URL without page reload
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.pushState({ mailbox: this.mailboxName, folder: params.folder, email: params.email }, '', newUrl);
    }
    
    logout() {
        // Set logout flag before redirecting
        sessionStorage.setItem('logging_out', 'true');
        localStorage.removeItem('enron_current_mailbox');
        // Use location.replace to prevent back button from returning to mailbox
        window.location.replace('/index.html');
    }
    
    async init() {
        // Check authentication
        if (!this.mailboxName) {
            window.location.href = '/index.html';
            return;
        }
        
        try {
            // Show loading indicator
            this.showLoading('Loading mailbox data...');
            
            // Load the mailbox data - handle split index files
            this.mailboxData = await this.loadMailboxData();
            
            // Update title
            const titleElement = document.getElementById('mailbox-title');
            if (titleElement) {
                const displayName = this.formatMailboxName(this.mailboxData.mailbox || this.mailboxName);
                titleElement.textContent = `WebMail: ${displayName}`;
            }
            
            // Render folders
            this.renderFolders();
            
            // Setup keyboard navigation
            this.setupKeyboardNavigation();
            
            // Setup folder search if element exists
            const folderSearchInput = document.getElementById('folder-search');
            if (folderSearchInput) {
                folderSearchInput.addEventListener('input', (e) => {
                    this.folderSearchTerm = e.target.value.toLowerCase();
                    this.renderFolders();
                });
            }
            
            // Check for URL parameters to load specific folder/email
            const urlParams = this.getUrlParams();
            
            // Find the first Inbox folder (or first available folder)
            const foldersData = this.mailboxData.folders || {};
            const folders = Array.isArray(foldersData) 
                ? foldersData 
                : Object.keys(foldersData).map(name => ({ name }));
            const inboxFolder = folders.find(f => f.name.includes('Inbox'));
            let defaultFolder = inboxFolder ? inboxFolder.name : (folders[0] ? folders[0].name : null);
            
            // Use folder from URL if specified AND it exists in the folder list
            let targetFolder = defaultFolder;
            if (urlParams.folder) {
                const folderExists = folders.some(f => f.name === urlParams.folder);
                if (folderExists) {
                    targetFolder = urlParams.folder;
                }
            }
            
            // Load folder
            if (targetFolder) {
                this.loadFolder(targetFolder);
            }
            
            // Hide loading indicator
            this.hideLoading();
            
            // If email ID is in URL, open that email
            if (urlParams.email) {
                // Small delay to ensure email list is rendered first
                setTimeout(() => {
                    this.openEmail(urlParams.email);
                }, 100);
            }
            
        } catch (error) {
            console.error('Error loading mailbox:', error);
            console.error('Error stack:', error.stack);
            console.error('Mailbox name:', this.mailboxName);
            console.error('Mailbox data:', this.mailboxData);
            this.hideLoading();
            this.showError(`Failed to load mailbox data: ${error.message}`);
        }
    }
    
    async loadMailboxData() {
        // Try to load index.json first
        const indexResponse = await fetch(`/mail/${this.mailboxName}/index.json`);
        if (!indexResponse.ok) {
            throw new Error(`Failed to load mailbox data (HTTP ${indexResponse.status}). Please check that the mailbox exists.`);
        }
        
        const indexData = await indexResponse.json();
        
        // Check if there are additional parts (index-part-2.json, etc.)
        const totalParts = indexData.total_parts || 1;
        
        if (totalParts === 1) {
            // No split files, return as is
            return indexData;
        }
        
        // Load all parts in parallel for much faster loading
        console.log(`Loading ${totalParts} index file parts in parallel...`);
        this.loadingProgress = { current: 1, total: totalParts };
        this.updateLoadingProgress();
        
        let allEmails = indexData.emails || [];
        
        // Create array of promises for parallel loading
        const loadPromises = [];
        for (let i = 2; i <= totalParts; i++) {
            loadPromises.push(
                fetch(`/mail/${this.mailboxName}/index-part-${i}.json`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(partData => {
                        this.loadingProgress.current++;
                        this.updateLoadingProgress();
                        return partData.emails || [];
                    })
                    .catch(error => {
                        console.warn(`Error loading index-part-${i}.json:`, error.message);
                        this.loadingProgress.current++;
                        this.updateLoadingProgress();
                        return []; // Return empty array on error
                    })
            );
        }
        
        // Wait for all parts to load in parallel
        const partResults = await Promise.all(loadPromises);
        
        // Merge all email arrays
        for (const partEmails of partResults) {
            allEmails = allEmails.concat(partEmails);
        }
        
        console.log(`Total emails loaded: ${allEmails.length}`);
        
        // Merge all emails back into the data structure
        return {
            ...indexData,
            emails: allEmails
        };
    }
    
    updateLoadingProgress() {
        const { current, total } = this.loadingProgress;
        if (total > 1) {
            this.showLoading(`Loading mailbox data... (${current}/${total} files)`);
        }
    }
    
    formatMailboxName(name) {
        // Convert 'bailey-s' to 'Susan Bailey' format
        // This is a simple formatter - customize as needed
        return name.split('-').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ');
    }
    
    renderFolders() {
        const folderList = document.getElementById('folder-list');
        const specialFoldersList = document.getElementById('special-folders-list');
        if (!folderList) return;
        
        // Convert folders object to array format
        const foldersData = this.mailboxData.folders || {};
        const folders = Array.isArray(foldersData) 
            ? foldersData 
            : Object.entries(foldersData).map(([name, emailIds]) => ({
                name,
                count: Array.isArray(emailIds) ? emailIds.length : 0
            }));
        
        // Identify special folders (Inbox, Sent Items, All Documents/All Mail)
        const specialFolderPatterns = ['inbox', 'sent items', 'sent', 'all documents', 'all mail', 'all items'];
        const specialFolders = [];
        const regularFolders = [];
        const seenSpecialTypes = new Set();
        
        folders.forEach(f => {
            const lowerName = f.name.toLowerCase();
            const matchedPattern = specialFolderPatterns.find(pattern => 
                lowerName === pattern || lowerName.endsWith('/' + pattern)
            );
            
            if (matchedPattern) {
                // Only add first occurrence of each special folder type
                if (!seenSpecialTypes.has(matchedPattern)) {
                    seenSpecialTypes.add(matchedPattern);
                    specialFolders.push(f);
                } else {
                    regularFolders.push(f);
                }
            } else {
                regularFolders.push(f);
            }
        });
        
        // Render special folders (always visible, not filtered)
        if (specialFoldersList) {
            let specialHtml = '';
            
            // Sort special folders: Inbox, Sent Items, All Mail
            specialFolders.sort((a, b) => {
                if (a.name.includes('Inbox')) return -1;
                if (b.name.includes('Inbox')) return 1;
                if (a.name.includes('Sent')) return -1;
                if (b.name.includes('Sent')) return 1;
                return 0;
            });
            
            for (const folder of specialFolders) {
                const active = folder.name === this.currentFolder ? 'active' : '';
                const displayName = this.formatFolderName(folder.name);
                
                specialHtml += `
                    <div class="folder-item ${active}" data-folder="${this.escapeHtml(folder.name)}">
                        <span class="folder-name">${displayName}</span>
                        <span class="folder-count">(${folder.count})</span>
                    </div>
                `;
            }
            
            specialFoldersList.innerHTML = specialHtml;
            
            // Add click handlers to special folder items
            document.querySelectorAll('#special-folders-list .folder-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const folderName = e.currentTarget.getAttribute('data-folder');
                    this.loadFolder(folderName);
                    return false;
                });
            });
        }
        
        // Filter regular folders by search term
        let filteredFolders = regularFolders;
        if (this.folderSearchTerm) {
            filteredFolders = regularFolders.filter(f => 
                f.name.toLowerCase().includes(this.folderSearchTerm) ||
                this.formatFolderName(f.name).toLowerCase().includes(this.folderSearchTerm)
            );
        }
        
        let html = '';
        
        // Sort regular folders alphabetically
        const sortedFolders = filteredFolders.slice().sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        
        // Determine if we should show all folders or limit to 10
        const showAllFolders = this.showAllFolders || this.folderSearchTerm || sortedFolders.length <= 10;
        const foldersToShow = showAllFolders ? sortedFolders : sortedFolders.slice(0, 10);
        
        for (const folder of foldersToShow) {
            const count = folder.count;
            const active = folder.name === this.currentFolder ? 'active' : '';
            const displayName = this.formatFolderName(folder.name);
            
            html += `
                <div class="folder-item ${active}" data-folder="${this.escapeHtml(folder.name)}">
                    <span class="folder-name">${displayName}</span>
                    <span class="folder-count">(${count})</span>
                </div>
            `;
        }
        
        // Add show more/less button if there are more than 10 folders and not filtering
        if (sortedFolders.length > 10 && !this.folderSearchTerm) {
            html += `
                <div class="folder-toggle-btn" style="padding: 8px; text-align: center; cursor: pointer; color: #ff9900; font-size: 10px; border-top: 1px solid #ff9900; margin-top: 5px;">
                    ${showAllFolders ? '- Show Less' : '+ Show More (' + (sortedFolders.length - 10) + ' more)'}
                </div>
            `;
        }
        
        folderList.innerHTML = html;
        
        // Add click handlers to folder items
        document.querySelectorAll('.folder-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const folderName = e.currentTarget.getAttribute('data-folder');
                this.loadFolder(folderName);
                return false;
            });
        });
        
        // Add click handler for show more/less button
        const toggleBtn = document.querySelector('.folder-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showAllFolders = !this.showAllFolders;
                this.renderFolders();
                return false;
            });
        }
    }
    
    formatFolderName(name) {
        // Format folder names nicely
        if (!name) return 'Inbox';
        
        // Remove leading slashes and clean up
        name = name.replace(/^\/+/, '');
        
        // Split by / and take the last part
        const parts = name.split('/');
        const lastPart = parts[parts.length - 1];
        
        return lastPart || 'Inbox';
    }
    
    loadFolder(folderName) {
        this.currentFolder = folderName;
        this.currentPage = 1;
        this.searchTerm = '';
        document.getElementById('search-box').value = '';
        
        // Update URL with folder parameter
        this.updateUrl({ folder: folderName, email: null });
        
        // Hide email detail if showing
        this.closeEmailDetail();
        
        // Update active folder in UI
        this.renderFolders();
        
        // Filter emails for this folder
        this.filterEmails();
        
        // Render email list
        this.renderEmailList();
    }
    
    loadInbox() {
        // Find the first Inbox folder
        const foldersData = this.mailboxData.folders || {};
        const folders = Array.isArray(foldersData) 
            ? foldersData 
            : Object.keys(foldersData).map(name => ({ name }));
        const inboxFolder = folders.find(f => f.name.includes('Inbox'));
        const folderToLoad = inboxFolder ? inboxFolder.name : (folders[0] ? folders[0].name : null);
        if (folderToLoad) {
            this.loadFolder(folderToLoad);
        }
    }
    
    filterEmails() {
        // Check cache first if no search term
        if (!this.searchTerm && this.folderCache.has(this.currentFolder)) {
            this.filteredEmails = this.folderCache.get(this.currentFolder);
            return;
        }
        
        // Filter emails by folder property
        let emails = this.mailboxData.emails.filter(email => 
            email.folder === this.currentFolder
        );
        
        // Cache the folder results if no search term
        if (!this.searchTerm) {
            this.folderCache.set(this.currentFolder, emails);
        }
        
        // Apply search filter if present
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            emails = emails.filter(email => {
                return (
                    email.subject.toLowerCase().includes(term) ||
                    email.from.name.toLowerCase().includes(term) ||
                    email.from.email.toLowerCase().includes(term) ||
                    email.to.some(to => 
                        to.name.toLowerCase().includes(term) || 
                        to.email.toLowerCase().includes(term)
                    )
                );
            });
        }
        
        this.filteredEmails = emails;
        
        // Apply sorting
        this.sortEmails();
    }
    
    sortEmails() {
        const { field, direction } = this.currentSort;
        const multiplier = direction === 'asc' ? 1 : -1;
        
        this.filteredEmails.sort((a, b) => {
            let aVal, bVal;
            
            switch(field) {
                case 'date':
                    aVal = new Date(a.date || 0).getTime();
                    bVal = new Date(b.date || 0).getTime();
                    break;
                case 'from':
                    aVal = (a.from?.name || a.from?.email || '').toLowerCase();
                    bVal = (b.from?.name || b.from?.email || '').toLowerCase();
                    break;
                case 'subject':
                    aVal = (a.subject || '').toLowerCase();
                    bVal = (b.subject || '').toLowerCase();
                    break;
                default:
                    return 0;
            }
            
            if (aVal < bVal) return -1 * multiplier;
            if (aVal > bVal) return 1 * multiplier;
            return 0;
        });
    }
    
    renderEmailList() {
        const container = document.getElementById('email-list-container');
        
        // Show search result count if searching
        let searchResultHtml = '';
        if (this.searchTerm) {
            searchResultHtml = `<div class="search-results-info">${this.filteredEmails.length} result${this.filteredEmails.length !== 1 ? 's' : ''} found for "${this.escapeHtml(this.searchTerm)}"</div>`;
        }
        
        if (this.filteredEmails.length === 0) {
            const message = this.searchTerm ? 'No emails found matching your search' : 'No emails found';
            container.innerHTML = searchResultHtml + `<div class="no-results">${message}</div>`;
            document.getElementById('pagination').style.display = 'none';
            return;
        }
        
        // Calculate pagination
        const totalPages = Math.ceil(this.filteredEmails.length / this.emailsPerPage);
        const startIdx = (this.currentPage - 1) * this.emailsPerPage;
        const endIdx = Math.min(startIdx + this.emailsPerPage, this.filteredEmails.length);
        const pageEmails = this.filteredEmails.slice(startIdx, endIdx);
        
        // Build email table
        let html = searchResultHtml + `
            <table class="email-list">
                <thead>
                    <tr>
                        <th class="email-star">★</th>
                        <th class="email-read" style="width: 30px; text-align: center;" title="Toggle read/unread">
                            <span style="cursor: pointer; font-size: 10px;">●</span>
                        </th>
                        <th class="email-attachment"></th>
                        <th class="email-from">From</th>
                        <th class="email-subject">Subject</th>
                        <th class="email-date">Date</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        for (const email of pageEmails) {
            const fromName = (email.from && (email.from.name || email.from.email)) || 'Unknown';
            const date = this.formatDate(email.date);
            const attachIcon = email.has_attachments ? '<span class="attachment-icon">@</span>' : '';
            const isRead = this.readEmails.has(email.id);
            const isStarred = this.starredEmails.has(email.id);
            const starIcon = isStarred ? '★' : '☆';
            const readClass = isRead ? '' : 'unread';
            
            html += `
                <tr class="email-row ${readClass}" data-email-id="${email.id}" onclick="app.openEmail('${email.id}')">
                    <td class="email-star" onclick="event.stopPropagation(); app.toggleStarUI('${email.id}');" title="${isStarred ? 'Unstar' : 'Star'} this email">
                        <span class="star-icon ${isStarred ? 'starred' : ''}">${starIcon}</span>
                    </td>
                    <td class="email-read" onclick="event.stopPropagation(); app.toggleReadUI('${email.id}');" title="${isRead ? 'Mark as unread' : 'Mark as read'}" style="text-align: center; cursor: pointer;">
                        <span style="color: ${isRead ? '#999' : '#0066cc'}; font-weight: bold;">●</span>
                    </td>
                    <td class="email-attachment">${attachIcon}</td>
                    <td class="email-from">${this.escapeHtml(fromName)}</td>
                    <td class="email-subject">${this.escapeHtml(email.subject || '(No Subject)')}</td>
                    <td class="email-date">${date}</td>
                </tr>
            `;
        }
        
        html += '</tbody></table>';
        
        container.innerHTML = html;
        
        // Update pagination
        const paginationDiv = document.getElementById('pagination');
        const pageInfo = document.getElementById('page-info');
        const prevLink = document.getElementById('prev-link');
        const nextLink = document.getElementById('next-link');
        const prevImg = document.getElementById('prev-img');
        const nextImg = document.getElementById('next-img');
        
        if (totalPages > 1) {
            paginationDiv.style.display = 'block';
            if (pageInfo) {
                pageInfo.textContent = `Page ${this.currentPage} of ${totalPages} (${this.filteredEmails.length} emails)`;
            }
            
            // Update page jump input max value
            const pageJumpInput = document.getElementById('page-jump');
            if (pageJumpInput) {
                pageJumpInput.max = totalPages;
                pageJumpInput.value = '';
                pageJumpInput.placeholder = `1-${totalPages}`;
            }
            
            // Update image control states
            const prevDisabled = (this.currentPage === 1);
            const nextDisabled = (this.currentPage === totalPages);
            if (prevLink && prevImg) {
                prevLink.dataset.disabled = prevDisabled ? 'true' : 'false';
                prevLink.style.pointerEvents = prevDisabled ? 'none' : 'auto';
                prevImg.src = prevDisabled ? '/src/previous_off.png' : '/src/previous_on.png';
                prevImg.style.opacity = prevDisabled ? '0.5' : '1';
            }
            if (nextLink && nextImg) {
                nextLink.dataset.disabled = nextDisabled ? 'true' : 'false';
                nextLink.style.pointerEvents = nextDisabled ? 'none' : 'auto';
                nextImg.src = nextDisabled ? '/src/next_off.png' : '/src/next_on.png';
                nextImg.style.opacity = nextDisabled ? '0.5' : '1';
            }
        } else {
            paginationDiv.style.display = 'none';
        }
    }
    
    formatDate(isoDate) {
        if (!isoDate) return 'Unknown date';
        
        try {
            const date = new Date(isoDate);
            const now = new Date();
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            
            // Always show time
            const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            
            if (diffDays === 0) {
                // Today - show just time
                return `Today<br>${timeStr}`;
            } else if (diffDays < 7) {
                // This week - show day name + time
                const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
                return `${dayStr}<br>${timeStr}`;
            } else if (date.getFullYear() === now.getFullYear()) {
                // This year - show month, day + time
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return `${dateStr}<br>${timeStr}`;
            } else {
                // Older - show full date + time
                const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                return `${dateStr}<br>${timeStr}`;
            }
        } catch (e) {
            return 'Unknown date';
        }
    }
    
    async openEmail(emailId) {
        // Find the email in the current mailbox data
        const email = (this.mailboxData && this.mailboxData.emails) ? this.mailboxData.emails.find(e => e.id === emailId) : null;
        if (!email) {
            console.error('Email not found:', emailId);
            return false;
        }
        
        // Mark as read
        this.markAsRead(emailId);

        // Update URL with email parameter
        this.updateUrl({ folder: this.currentFolder, email: emailId });

        // Hide email list and pagination
        const listEl = document.getElementById('email-list-container');
        const pagEl = document.getElementById('pagination');
        if (listEl) listEl.style.display = 'none';
        if (pagEl) pagEl.style.display = 'none';

        // Show email detail
        const detailDiv = document.getElementById('email-detail');
        const contentDiv = document.getElementById('email-detail-content');

        // Compose header values
        const from = email.from && (email.from.name || email.from.email) ? (email.from.name || email.from.email) : 'Unknown';
        const toList = Array.isArray(email.to) ? email.to : [];
        const ccList = Array.isArray(email.cc) ? email.cc : [];
        const attachments = Array.isArray(email.attachments) ? email.attachments : [];

        // Body is now inline in the JSON - sanitize for security
        let bodyHtml = email.body || '<em>(No content)</em>';
        bodyHtml = this.sanitizeHtml(bodyHtml);

        // Format date and time on same line
        const dateTimeStr = this.formatDateTimeSameLine(email.date);

        // Build To field with collapsible list if >3 items
        const toHtml = this.buildCollapsibleList(toList, 'to');
        
        // Build Cc field with collapsible list if >3 items
        const ccHtml = ccList.length ? `<tr><td>Cc:</td><td>${this.buildCollapsibleList(ccList, 'cc')}</td></tr>` : '';

        // Build attachments with icons and collapsible list
        const attachHtml = attachments.length
            ? `<tr><td>Attachments:</td><td>${this.buildAttachmentsList(attachments)}</td></tr>`
            : '';

           // Render email detail with toolbar
           contentDiv.innerHTML = `
                            <table class="email-toolbar" style="margin-bottom:10px; width:100%; border-collapse:collapse;">
                                <tr>
                                    <td style="width:25%; text-align:center;">
                                        <img id="goback" class="menuimage" src="/src/back_off.png" alt="Go Back"
                                                 onmouseover="document.getElementById('goback').src='/src/back_hover.png'"
                                                 onmouseout="document.getElementById('goback').src='/src/back_off.png'"
                                                 onclick="app.goBack(); return false;">
                                    </td>
                                    <td style="width:25%; text-align:center;">
                                        <img id="reply" class="menuimage" src="/src/reply_off.png" alt="Reply"
                                                 onmouseover="document.getElementById('reply').src='/src/reply_hover.png'"
                                                 onmouseout="document.getElementById('reply').src='/src/reply_off.png'"
                                                 onclick="return false;">
                                    </td>
                                    <td style="width:25%; text-align:center;">
                                        <img id="forward" class="menuimage" src="/src/forward_off.png" alt="Forward"
                                                 onmouseover="document.getElementById('forward').src='/src/forward_hover.png'"
                                                 onmouseout="document.getElementById('forward').src='/src/forward_off.png'"
                                                 onclick="return false;">
                                    </td>
                                    <td style="width:25%; text-align:center;">
                                        <img id="permalink" class="menuimage" src="/src/permalink_off.png" alt="Permalink"
                                                 onmouseover="(function(el){ if(!el.src.includes('permalink_on.png')) el.src='/src/permalink_hover.png'; })(document.getElementById('permalink'))"
                                                 onmouseout="(function(el){ if(!el.src.includes('permalink_on.png')) el.src='/src/permalink_off.png'; })(document.getElementById('permalink'))"
                                                 onclick="app.copyPermalink('${email.id}'); return false;">
                                    </td>
                                </tr>
                            </table>
            <div class="email-headers">
                <table>
                    <tr><td>From:</td><td><span class="email-from-value">${this.escapeHtml(from)}</span></td></tr>
                    <tr><td>To:</td><td>${toHtml}</td></tr>
                    ${ccHtml}
                    <tr><td>Date:</td><td>${dateTimeStr}</td></tr>
                    <tr><td>Subject:</td><td><span class="email-subject-value">${this.escapeHtml(email.subject || '(No Subject)')}</span></td></tr>
                    ${attachHtml}
                </table>
            </div>
            <div class="email-body-container">${bodyHtml}</div>
        `;

        // Add event listeners for collapsible toggles
        this.attachCollapsibleListeners(contentDiv);

        detailDiv.classList.add('visible');
        if (detailDiv) detailDiv.style.display = 'block';
        window.scrollTo(0, 0);
        return false;
    }

    goBack() {
        // Use browser history to navigate back
        try {
            window.history.back();
        } catch (e) {
            // Fallback: if history is not available, close email detail to list
            this.closeEmailDetail();
        }
    }

    copyPermalink(emailId) {
        try {
            // Build permalink using current mailbox and folder
            const url = new URL(window.location.href);
            url.searchParams.set('mailbox', this.mailboxName);
            if (this.currentFolder) {
                url.searchParams.set('folder', this.currentFolder);
            }
            url.searchParams.set('email', emailId);
            const permalink = url.toString();

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(permalink).then(() => {
                    // Visual feedback: show ON state for a short time, then revert to OFF
                    const pl = document.getElementById('permalink');
                    if (pl) {
                        pl.src = '/src/permalink_on.png';
                        setTimeout(() => { pl.src = '/src/permalink_off.png'; }, 3000);
                    }
                }).catch(() => {
                    // Fallback: prompt and still show feedback
                    window.prompt('Copy this permalink:', permalink);
                    const pl = document.getElementById('permalink');
                    if (pl) {
                        pl.src = '/src/permalink_on.png';
                        setTimeout(() => { pl.src = '/src/permalink_off.png'; }, 3000);
                    }
                });
            } else {
                // Fallback: prompt and show feedback
                window.prompt('Copy this permalink:', permalink);
                const pl = document.getElementById('permalink');
                if (pl) {
                    pl.src = '/src/permalink_on.png';
                    setTimeout(() => { pl.src = '/src/permalink_off.png'; }, 3000);
                }
            }
        } catch (e) {
            console.error('Failed to copy permalink', e);
        }
    }
    
    formatDateTimeSameLine(isoDate) {
        if (!isoDate) return 'Unknown date';
        
        try {
            const date = new Date(isoDate);
            const dateStr = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            const timeStr = date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
            });
            return `${dateStr} | ${timeStr}`;
        } catch (e) {
            return 'Unknown date';
        }
    }
    
    buildCollapsibleList(items, type) {
        if (items.length === 0) return 'Unknown';
        
        const names = items.map(p => p.name || p.email);
        
        if (names.length <= 3) {
            // Show all items if 3 or fewer
            return this.escapeHtml(names.join('; '));
        }
        
        // Show first 3 items with expandable list
        const visible = names.slice(0, 3).map(n => this.escapeHtml(n)).join('; ');
        const hidden = names.slice(3).map(n => this.escapeHtml(n)).join('; ');
        const count = names.length - 3;
        
        return `
            <div>
                ${visible}
                <div class="collapsible-content" id="${type}-more">${hidden}</div>
                <span class="collapsible-toggle" data-target="${type}-more">
                    +${count} more
                </span>
            </div>
        `;
    }
    
    buildAttachmentsList(attachments) {
        if (attachments.length === 0) return '';
        
        const attachHtml = attachments.map((att, idx) => {
            const filename = att.filename || att.name || 'attachment';
            const name = this.escapeHtml(filename);
            
            // Handle paths - attachments may be in batch folders now
            // Path needs to be absolute from root: /mail/{mailbox}/attachments/...
            let path = '#';
            if (att.path) {
                path = `/mail/${this.mailboxName}/${att.path}`;
                // This will be redirected to HuggingFace by Netlify
            }
            
            const icon = this.getAttachmentIcon(filename);
            
            return `
                <div class="attachment-item">
                    <span class="attachment-icon">${icon}</span>
                    <a href="${path}" target="_blank">${name}</a>
                </div>
            `;
        });
        
        if (attachments.length <= 3) {
            // Show all attachments if 3 or fewer
            return `<div>${attachHtml.join('')}</div>`;
        }
        
        // Show first 3 with expandable list
        const visible = attachHtml.slice(0, 3).join('');
        const hidden = attachHtml.slice(3).join('');
        const count = attachments.length - 3;
        
        return `
            <div class="collapsible-list">
                ${visible}
                <div class="collapsible-content" id="attachments-more">${hidden}</div>
                <span class="collapsible-toggle" data-target="attachments-more">
                    +${count} more
                </span>
            </div>
        `;
    }
    
    getAttachmentIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        
        // Image files
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
            return '[IMG]';
        }
        // PDF files
        if (ext === 'pdf') {
            return '[PDF]';
        }
        // Office documents - Word
        if (['doc', 'docx'].includes(ext)) {
            return '[DOC]';
        }
        // Office documents - Excel
        if (['xls', 'xlsx', 'csv'].includes(ext)) {
            return '[XLS]';
        }
        // Office documents - PowerPoint
        if (['ppt', 'pptx'].includes(ext)) {
            return '[PPT]';
        }
        // Archive files
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
            return '[ZIP]';
        }
        // Text files
        if (['txt', 'log', 'md'].includes(ext)) {
            return '[TXT]';
        }
        // Default
        return '[FILE]';
    }
    
    attachCollapsibleListeners(container) {
        const toggles = container.querySelectorAll('.collapsible-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = toggle.getAttribute('data-target');
                const content = document.getElementById(targetId);
                
                if (content) {
                    const isExpanded = content.classList.contains('expanded');
                    if (isExpanded) {
                        content.classList.remove('expanded');
                        const count = toggle.textContent.match(/\d+/)[0];
                        toggle.textContent = `+${count} more`;
                    } else {
                        content.classList.add('expanded');
                        const count = toggle.textContent.match(/\d+/)[0];
                        toggle.textContent = `-${count} less`;
                    }
                }
            });
        });
    }
    
    closeEmailDetail() {
        // Clear any search highlights when closing
        this.clearSearchHighlights();
        
        // Update URL to remove email parameter
        this.updateUrl({ folder: this.currentFolder, email: null });
        
        // Hide email detail
        const detail = document.getElementById('email-detail');
        if (detail) {
            detail.classList.remove('visible');
            detail.style.display = 'none';
        }
        
        // Show email list and pagination
        const list2 = document.getElementById('email-list-container');
        const pag2 = document.getElementById('pagination');
        if (list2) list2.style.display = 'block';
        if (pag2) pag2.style.display = 'block';
        
        // Refresh the email list to show updated read status
        this.renderEmailList();
        
        window.scrollTo(0, 0);
    }
    
    toggleStarUI(emailId) {
        const isStarred = this.toggleStar(emailId);
        
        // Update the star icon in the list
        const row = document.querySelector(`tr[data-email-id="${emailId}"]`);
        if (row) {
            const starCell = row.querySelector('.star-icon');
            if (starCell) {
                starCell.textContent = isStarred ? '\u2605' : '\u2606';
                starCell.classList.toggle('starred', isStarred);
                starCell.parentElement.title = isStarred ? 'Unstar this email' : 'Star this email';
            }
        }
    }
    
    toggleReadUI(emailId) {
        // Toggle read/unread status
        if (this.readEmails.has(emailId)) {
            this.readEmails.delete(emailId);
        } else {
            this.readEmails.add(emailId);
        }
        this.saveReadEmails();
        
        // Update the row styling and bullet color
        const row = document.querySelector(`tr[data-email-id="${emailId}"]`);
        if (row) {
            const isRead = this.readEmails.has(emailId);
            row.classList.toggle('unread', !isRead);
            
            // Update the bullet color
            const readCell = row.querySelector('.email-read span');
            if (readCell) {
                readCell.style.color = isRead ? '#999' : '#0066cc';
            }
        }
    }
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Don't interfere if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            const emailDetail = document.getElementById('email-detail');
            const isViewingEmail = emailDetail && emailDetail.style.display === 'block';
            
            switch(e.key) {
                case 'Escape':
                    if (isViewingEmail) {
                        e.preventDefault();
                        this.closeEmailDetail();
                    }
                    break;
                    
                case 'ArrowLeft':
                case 'PageUp':
                    if (!isViewingEmail && this.currentPage > 1) {
                        e.preventDefault();
                        this.previousPage();
                    }
                    break;
                    
                case 'ArrowRight':
                case 'PageDown':
                    if (!isViewingEmail) {
                        e.preventDefault();
                        this.nextPage();
                    }
                    break;
                    
                case 'j': // Gmail-style navigation
                    if (!isViewingEmail) {
                        e.preventDefault();
                        this.selectNextEmail();
                    }
                    break;
                    
                case 'k': // Gmail-style navigation
                    if (!isViewingEmail) {
                        e.preventDefault();
                        this.selectPreviousEmail();
                    }
                    break;
                    
                case 'Enter':
                    if (!isViewingEmail) {
                        e.preventDefault();
                        this.openSelectedEmail();
                    }
                    break;
                    
                case 's': // Star/unstar
                    if (!isViewingEmail) {
                        e.preventDefault();
                        this.toggleSelectedEmailStar();
                    }
                    break;
            }
        });
    }
    
    selectNextEmail() {
        const rows = document.querySelectorAll('.email-row');
        const selected = document.querySelector('.email-row.selected');
        
        if (!selected && rows.length > 0) {
            rows[0].classList.add('selected');
            rows[0].scrollIntoView({ block: 'nearest' });
        } else if (selected) {
            const index = Array.from(rows).indexOf(selected);
            if (index < rows.length - 1) {
                selected.classList.remove('selected');
                rows[index + 1].classList.add('selected');
                rows[index + 1].scrollIntoView({ block: 'nearest' });
            }
        }
    }
    
    selectPreviousEmail() {
        const rows = document.querySelectorAll('.email-row');
        const selected = document.querySelector('.email-row.selected');
        
        if (!selected && rows.length > 0) {
            rows[0].classList.add('selected');
            rows[0].scrollIntoView({ block: 'nearest' });
        } else if (selected) {
            const index = Array.from(rows).indexOf(selected);
            if (index > 0) {
                selected.classList.remove('selected');
                rows[index - 1].classList.add('selected');
                rows[index - 1].scrollIntoView({ block: 'nearest' });
            }
        }
    }
    
    openSelectedEmail() {
        const selected = document.querySelector('.email-row.selected');
        if (selected) {
            const emailId = selected.getAttribute('data-email-id');
            if (emailId) {
                this.openEmail(emailId);
            }
        }
    }
    
    toggleSelectedEmailStar() {
        const selected = document.querySelector('.email-row.selected');
        if (selected) {
            const emailId = selected.getAttribute('data-email-id');
            if (emailId) {
                this.toggleStarUI(emailId);
            }
        }
    }
    
    handleSearch(searchTerm) {
        // Clear existing debounce timer
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
        
        // Debounce search to avoid filtering on every keystroke
        this.searchDebounceTimer = setTimeout(() => {
            this.performSearch(searchTerm);
        }, this.SEARCH_DEBOUNCE_MS);
    }
    
    performSearch(searchTerm) {
        this.searchTerm = searchTerm;
        
        // Check if we're viewing an email
        const emailDetail = document.getElementById('email-detail');
        const isViewingEmail = emailDetail && emailDetail.style.display === 'block';
        
        if (isViewingEmail && searchTerm.trim()) {
            // Perform in-page search highlighting
            this.highlightSearchInEmail(searchTerm);
        } else if (isViewingEmail) {
            // Clear highlights if search is empty but still viewing email
            this.clearSearchHighlights();
        } else {
            // Normal email list filtering only when not viewing an email
            this.currentPage = 1;
            this.clearSearchHighlights();
            this.filterEmails();
            this.renderEmailList();
        }
    }
    
    highlightSearchInEmail(searchTerm) {
        const contentDiv = document.getElementById('email-detail-content');
        if (!contentDiv) return;
        
        // Clear previous highlights
        this.clearSearchHighlights();
        
        const term = searchTerm.trim().toLowerCase();
        if (!term) return;
        
        // Find and highlight all matches
        const walker = document.createTreeWalker(
            contentDiv,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const nodesToReplace = [];
        let node;
        
        while (node = walker.nextNode()) {
            const text = node.textContent;
            const lowerText = text.toLowerCase();
            
            if (lowerText.includes(term)) {
                nodesToReplace.push(node);
            }
        }
        
        // Replace text nodes with highlighted versions
        nodesToReplace.forEach(node => {
            const text = node.textContent;
            const lowerText = text.toLowerCase();
            const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            
            const span = document.createElement('span');
            let lastIndex = 0;
            let match;
            
            const tempText = text;
            const matches = [];
            
            while ((match = regex.exec(tempText)) !== null) {
                matches.push({ index: match.index, length: match[0].length, text: match[0] });
            }
            
            matches.forEach((match, i) => {
                // Add text before match
                if (match.index > lastIndex) {
                    span.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                }
                
                // Add highlighted match
                const highlight = document.createElement('mark');
                highlight.className = 'search-highlight';
                highlight.textContent = match.text;
                span.appendChild(highlight);
                
                lastIndex = match.index + match.length;
            });
            
            // Add remaining text
            if (lastIndex < text.length) {
                span.appendChild(document.createTextNode(text.substring(lastIndex)));
            }
            
            node.parentNode.replaceChild(span, node);
        });
        
        // Scroll to first match
        const firstHighlight = contentDiv.querySelector('.search-highlight');
        if (firstHighlight) {
            firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    clearSearchHighlights() {
        const contentDiv = document.getElementById('email-detail-content');
        if (!contentDiv) return;
        
        const highlights = contentDiv.querySelectorAll('.search-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            const textNode = document.createTextNode(highlight.textContent);
            parent.replaceChild(textNode, highlight);
            
            // Normalize parent to merge adjacent text nodes
            parent.normalize();
        });
    }
    
    nextPage() {
        const totalPages = Math.ceil(this.filteredEmails.length / this.emailsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderEmailList();
            window.scrollTo(0, 0);
        }
    }
    
    jumpToPage(pageNum) {
        const totalPages = Math.ceil(this.filteredEmails.length / this.emailsPerPage);
        if (pageNum >= 1 && pageNum <= totalPages) {
            this.currentPage = pageNum;
            this.renderEmailList();
            window.scrollTo(0, 0);
        }
    }
    
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderEmailList();
            window.scrollTo(0, 0);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    sanitizeHtml(html) {
        // Create a temporary div to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Remove all script tags
        const scripts = temp.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        
        // Remove dangerous event handlers and attributes
        const allElements = temp.querySelectorAll('*');
        allElements.forEach(el => {
            // Remove event handler attributes
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
            });
            
            // Remove dangerous attributes
            ['javascript:', 'data:', 'vbscript:'].forEach(prefix => {
                if (el.getAttribute('href')?.toLowerCase().startsWith(prefix)) {
                    el.removeAttribute('href');
                }
                if (el.getAttribute('src')?.toLowerCase().startsWith(prefix)) {
                    el.removeAttribute('src');
                }
            });
        });
        
        // Remove iframe, object, embed tags
        ['iframe', 'object', 'embed', 'applet', 'meta', 'link', 'style'].forEach(tag => {
            const elements = temp.querySelectorAll(tag);
            elements.forEach(el => el.remove());
        });
        
        return temp.innerHTML;
    }
    
    showError(message) {
        const emailContainer = document.getElementById('email-list-container');
        if (emailContainer) {
            emailContainer.innerHTML = `
                <div class="no-results" style="color: red;">
                    <strong>Error:</strong> ${message}
                </div>
            `;
        }
        const folderContainer = document.getElementById('folder-list');
        if (folderContainer) {
            folderContainer.innerHTML = `
                <div class="no-results" style="color: red;">
                    Error loading folders
                </div>
            `;
        }
    }
    
    showLoading(message = 'Loading...') {
        const container = document.getElementById('email-list-container');
        if (container) {
            container.innerHTML = `
                <div class="loading-container">
                    <div class="loading-message">${this.escapeHtml(message)}</div>
                    <div class="loading-spinner"></div>
                </div>
            `;
        }
    }
    
    hideLoading() {
        // Loading indicator will be replaced by actual content
        // This method exists for clarity and potential future use
    }
}

// Global app instance
let app;

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    app = new MailboxApp();
    app.init();
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
        if (event.state) {
            const urlParams = app.getUrlParams();
            
            // If we have a folder change
            if (urlParams.folder && urlParams.folder !== app.currentFolder) {
                app.loadFolder(urlParams.folder);
            }
            
            // If we have an email to show
            if (urlParams.email) {
                app.openEmail(urlParams.email);
            } else {
                // No email parameter means we should close detail view
                app.closeEmailDetail();
            }
        }
    });
});

// Handle search input
function handleSearch() {
    const searchBox = document.getElementById('search-box');
    app.handleSearch(searchBox.value);
}
