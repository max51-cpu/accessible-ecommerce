/**
 * Accessibility features for visually impaired users
 * This script handles text size adjustments, high contrast mode,
 * keyboard shortcuts, and other accessibility features
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize accessibility features
    initAccessibilitySettings();
    setupKeyboardShortcuts();
    enhanceScreenReaderSupport();
    setupFormAccessibility();
    
    // Announce current page to screen readers
    announceCurrentPage();
});

/**
 * Initialize accessibility settings from session or defaults
 */
function initAccessibilitySettings() {
    // Apply text size
    applyTextSize(getAccessibilitySetting('text_size', 'medium'));
    
    // Apply high contrast if enabled
    if (getAccessibilitySetting('high_contrast', false)) {
        document.body.classList.add('high-contrast');
    }
    
    // Setup the accessibility control panel toggle
    const accessibilityToggle = document.getElementById('accessibility-toggle');
    if (accessibilityToggle) {
        accessibilityToggle.addEventListener('click', function(e) {
            e.preventDefault();
            const panel = document.getElementById('accessibility-panel');
            panel.classList.toggle('show');
            
            // Announce panel state to screen readers
            if (panel.classList.contains('show')) {
                announceToScreenReader('Accessibility panel opened');
            } else {
                announceToScreenReader('Accessibility panel closed');
            }
        });
    }
    
    // Text size controls
    const textSizeControls = document.querySelectorAll('.text-size-control');
    textSizeControls.forEach(control => {
        control.addEventListener('click', function(e) {
            e.preventDefault();
            const size = this.dataset.size;
            applyTextSize(size);
            saveAccessibilitySetting('text_size', size);
            announceToScreenReader(`Text size changed to ${size}`);
        });
    });
    
    // High contrast toggle
    const contrastToggle = document.getElementById('contrast-toggle');
    if (contrastToggle) {
        contrastToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('high-contrast');
                saveAccessibilitySetting('high_contrast', true);
                announceToScreenReader('High contrast mode enabled');
            } else {
                document.body.classList.remove('high-contrast');
                saveAccessibilitySetting('high_contrast', false);
                announceToScreenReader('High contrast mode disabled');
            }
        });
        
        // Set initial state
        contrastToggle.checked = getAccessibilitySetting('high_contrast', false);
    }
}

/**
 * Get accessibility setting from session or use default
 */
function getAccessibilitySetting(setting, defaultValue) {
    // Check if we have accessibility settings in the page data
    if (window.accessibilitySettings && setting in window.accessibilitySettings) {
        return window.accessibilitySettings[setting];
    }
    
    // Try to get from localStorage as fallback
    const stored = localStorage.getItem(`accessibility_${setting}`);
    return stored !== null ? JSON.parse(stored) : defaultValue;
}

/**
 * Save accessibility setting to server and localStorage
 */
function saveAccessibilitySetting(setting, value) {
    // Save to localStorage as fallback
    localStorage.setItem(`accessibility_${setting}`, JSON.stringify(value));
    
    // Save to server session
    const formData = new FormData();
    formData.append(setting, value);
    
    fetch('/set_accessibility', {
        method: 'POST',
        body: formData
    }).catch(error => {
        console.error('Error saving accessibility setting:', error);
    });
}

/**
 * Apply text size to the page
 */
function applyTextSize(size) {
    document.body.classList.remove('text-small', 'text-medium', 'text-large', 'text-x-large');
    document.body.classList.add(`text-${size}`);
}

/**
 * Set up keyboard shortcuts for accessibility
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Only process if no input element is focused
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA' || 
            document.activeElement.tagName === 'SELECT') {
            return;
        }
        
        // Alt+1: Go to home page
        if (e.altKey && e.key === '1') {
            e.preventDefault();
            window.location.href = '/';
            announceToScreenReader('Navigating to home page');
        }
        
        // Alt+2: Go to products page
        if (e.altKey && e.key === '2') {
            e.preventDefault();
            window.location.href = '/products';
            announceToScreenReader('Navigating to products page');
        }
        
        // Alt+3: Go to cart
        if (e.altKey && e.key === '3') {
            e.preventDefault();
            window.location.href = '/cart';
            announceToScreenReader('Navigating to shopping cart');
        }
        
        // Alt+4: Go to checkout
        if (e.altKey && e.key === '4') {
            e.preventDefault();
            window.location.href = '/checkout';
            announceToScreenReader('Navigating to checkout page');
        }
        
        // Alt+S: Proceed with Stripe payment
        if (e.altKey && e.key === 's' && e.shiftKey) {
            e.preventDefault();
            const stripeButton = document.querySelector('form[action*="create-checkout-session"] button');
            if (stripeButton) {
                announceToScreenReader('Proceeding to Stripe payment');
                stripeButton.click();
            } else {
                announceToScreenReader('Stripe payment button not found on this page');
            }
        }
        
        // Alt+A: Toggle accessibility panel
        if (e.altKey && e.key === 'a') {
            e.preventDefault();
            const panel = document.getElementById('accessibility-panel');
            panel.classList.toggle('show');
            if (panel.classList.contains('show')) {
                announceToScreenReader('Accessibility panel opened');
            } else {
                announceToScreenReader('Accessibility panel closed');
            }
        }
        
        // Alt+H: Toggle high contrast
        if (e.altKey && e.key === 'h') {
            e.preventDefault();
            const contrastToggle = document.getElementById('contrast-toggle');
            if (contrastToggle) {
                contrastToggle.checked = !contrastToggle.checked;
                const event = new Event('change');
                contrastToggle.dispatchEvent(event);
            }
        }
        
        // Alt+T: Cycle through text sizes
        if (e.altKey && e.key === 't') {
            e.preventDefault();
            const sizes = ['small', 'medium', 'large', 'x-large'];
            const currentSize = getAccessibilitySetting('text_size', 'medium');
            const currentIndex = sizes.indexOf(currentSize);
            const nextIndex = (currentIndex + 1) % sizes.length;
            const newSize = sizes[nextIndex];
            
            applyTextSize(newSize);
            saveAccessibilitySetting('text_size', newSize);
            announceToScreenReader(`Text size changed to ${newSize}`);
        }
        
        // Alt+V: Activate voice commands
        if (e.altKey && e.key === 'v') {
            e.preventDefault();
            if (window.startVoiceRecognition) {
                window.startVoiceRecognition();
                announceToScreenReader('Voice command mode activated');
            }
        }
        
        // Alt+S: Focus search box
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            const searchBox = document.querySelector('input[type="search"]');
            if (searchBox) {
                searchBox.focus();
                announceToScreenReader('Search box focused');
            }
        }
        
        // Alt+P: Toggle current page indicator
        if (e.altKey && e.key === 'p') {
            e.preventDefault();
            togglePageIndicator();
        }
        
        // Alt+K: Announce all keyboard shortcuts
        if (e.altKey && e.key === 'k') {
            e.preventDefault();
            // Find and click the keyboard shortcuts button
            const shortcutButton = document.getElementById('keyboard-shortcuts-button');
            if (shortcutButton) {
                shortcutButton.click();
            } else {
                // If button doesn't exist yet, call the function directly
                announceKeyboardShortcuts();
            }
        }
    });
}

/**
 * Announce message to screen readers using ARIA live region
 */
function announceToScreenReader(message) {
    const announcer = document.getElementById('screen-reader-announcer');
    if (!announcer) {
        // Create announcer if it doesn't exist
        const div = document.createElement('div');
        div.id = 'screen-reader-announcer';
        div.setAttribute('aria-live', 'polite');
        div.setAttribute('aria-atomic', 'true');
        div.classList.add('sr-only');
        document.body.appendChild(div);
        
        // Use the new element
        announceToScreenReader(message);
        return;
    }
    
    // Add message to announcer
    announcer.textContent = message;
    
    // Optionally provide audio feedback
    if (getAccessibilitySetting('audio_feedback', true)) {
        speakMessage(message);
    }
}

/**
 * Use browser's speech synthesis to speak a message
 */
function speakMessage(message) {
    if ('speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance(message);
        window.speechSynthesis.speak(speech);
    }
}

/**
 * Enhance screen reader support by adding additional context
 * and improving the accessibility of dynamic content
 */
function enhanceScreenReaderSupport() {
    // Add context to product links
    document.querySelectorAll('.product-card a').forEach(link => {
        if (!link.getAttribute('aria-label')) {
            const productName = link.querySelector('.product-name')?.textContent || 
                              link.textContent;
            if (productName) {
                link.setAttribute('aria-label', `View product: ${productName}`);
            }
        }
    });
    
    // Make sure all buttons have appropriate labels
    document.querySelectorAll('button').forEach(button => {
        if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
            const icon = button.querySelector('i, .icon');
            if (icon && icon.className) {
                // Try to extract purpose from icon class
                let purpose = '';
                if (icon.className.includes('cart')) purpose = 'Add to cart';
                else if (icon.className.includes('search')) purpose = 'Search';
                else if (icon.className.includes('close')) purpose = 'Close';
                
                if (purpose) {
                    button.setAttribute('aria-label', purpose);
                }
            }
        }
    });
    
    // Make custom components accessible
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        if (!dropdown.getAttribute('role')) {
            dropdown.setAttribute('role', 'listbox');
            const trigger = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            if (trigger && menu) {
                trigger.setAttribute('aria-haspopup', 'true');
                trigger.setAttribute('aria-expanded', 'false');
                
                trigger.addEventListener('click', function() {
                    const expanded = trigger.getAttribute('aria-expanded') === 'true';
                    trigger.setAttribute('aria-expanded', !expanded);
                });
                
                menu.querySelectorAll('a, button').forEach(item => {
                    item.setAttribute('role', 'option');
                });
            }
        }
    });
}

/**
 * Enhance accessibility of forms
 */
function setupFormAccessibility() {
    // Ensure all form inputs have associated labels
    document.querySelectorAll('input, select, textarea').forEach(input => {
        // Skip inputs that already have labels or are hidden
        if (input.type === 'hidden' || input.hasAttribute('aria-label') || 
            document.querySelector(`label[for="${input.id}"]`)) {
            return;
        }
        
        // Try to find a label in parent elements
        const parentLabel = input.closest('label');
        if (parentLabel) {
            // Already wrapped in a label, no action needed
            return;
        }
        
        // If no label is found and no aria-label, add a descriptive aria-label based on name or placeholder
        if (!input.hasAttribute('aria-label')) {
            let label = input.placeholder || input.name;
            if (label) {
                // Convert from camelCase or snake_case and capitalize
                label = label.replace(/([A-Z])/g, ' $1')
                             .replace(/_/g, ' ')
                             .trim();
                label = label.charAt(0).toUpperCase() + label.slice(1);
                
                input.setAttribute('aria-label', label);
            }
        }
    });
    
    // Add error message handling for better screen reader support
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            // Clear any previous error messages
            this.querySelectorAll('.is-invalid').forEach(field => {
                field.classList.remove('is-invalid');
            });
            
            // Check for required fields
            let hasError = false;
            this.querySelectorAll('[required]').forEach(field => {
                if (!field.value.trim()) {
                    field.classList.add('is-invalid');
                    
                    // Create or update error message
                    let errorId = `${field.id}-error`;
                    let errorElement = document.getElementById(errorId);
                    
                    if (!errorElement) {
                        errorElement = document.createElement('div');
                        errorElement.id = errorId;
                        errorElement.className = 'invalid-feedback';
                        field.parentNode.appendChild(errorElement);
                        
                        // Connect the error message to the input for screen readers
                        field.setAttribute('aria-describedby', errorId);
                    }
                    
                    const fieldName = field.getAttribute('aria-label') || 
                                    document.querySelector(`label[for="${field.id}"]`)?.textContent ||
                                    field.placeholder ||
                                    'This field';
                    
                    errorElement.textContent = `${fieldName} is required`;
                    
                    // Focus the first invalid field
                    if (!hasError) {
                        field.focus();
                        announceToScreenReader(`Error: ${errorElement.textContent}`);
                    }
                    
                    hasError = true;
                }
            });
            
            if (hasError) {
                e.preventDefault();
            }
        });
    });
}

/**
 * Announce the current page name to screen readers
 */
function announceCurrentPage() {
    // Get the current page heading or title
    const heading = document.querySelector('h1');
    const pageTitle = heading ? heading.textContent.trim() : document.title;
    
    // Create page location announcement
    let announcement = `You are now on: ${pageTitle}`;
    
    // Add breadcrumb information if available
    const breadcrumbs = document.querySelector('.breadcrumb');
    if (breadcrumbs) {
        const breadcrumbItems = breadcrumbs.querySelectorAll('.breadcrumb-item');
        if (breadcrumbItems.length > 0) {
            announcement += ". Breadcrumb path: ";
            breadcrumbItems.forEach((item, index) => {
                if (index > 0) {
                    announcement += " > ";
                }
                announcement += item.textContent.trim();
            });
        }
    }
    
    // Delay the announcement slightly to ensure it happens after page load
    setTimeout(() => {
        announceToScreenReader(announcement);
        
        // Also add a visual indicator of current page
        updateCurrentPageIndicator();
        
        // Announce keyboard shortcuts after a short delay
        setTimeout(() => {
            announceKeyboardShortcuts();
        }, 2000);
    }, 800);
}

/**
 * Announce available keyboard shortcuts for the current page
 */
function announceKeyboardShortcuts() {
    // Get current page path
    const path = window.location.pathname;
    
    // Common shortcuts for all pages
    let shortcuts = [
        "Press Alt+1 for Home page",
        "Press Alt+2 for Products page",
        "Press Alt+3 for Cart page",
        "Press Alt+4 for Checkout page",
        "Press Alt+A to open Accessibility panel",
        "Press Alt+H to toggle High contrast mode",
        "Press Alt+T to change Text size",
        "Press Alt+V to activate Voice commands",
        "Press Alt+S to focus Search box",
        "Press Alt+P to toggle Page indicator"
    ];
    
    // Add page-specific shortcuts
    if (path.includes('/product/')) {
        shortcuts.push("Press Alt+C to Add to cart");
    } else if (path.includes('/cart')) {
        shortcuts.push("Press Alt+U to Update cart");
        shortcuts.push("Press Alt+4 to Proceed to checkout");
    } else if (path.includes('/checkout')) {
        shortcuts.push("Press Alt+Shift+S to Checkout with Stripe");
        shortcuts.push("Press Tab to move between form fields");
        shortcuts.push("Press Shift+Tab to move backwards");
        shortcuts.push("Press Enter to submit forms");
    } else if (path.includes('/login') || path.includes('/signup')) {
        shortcuts.push("Press Tab to move between form fields");
        shortcuts.push("Press Enter to submit the form");
    }
    
    // Create a keyboard shortcut help button if it doesn't exist
    let shortcutButton = document.getElementById('keyboard-shortcuts-button');
    if (!shortcutButton) {
        shortcutButton = document.createElement('button');
        shortcutButton.id = 'keyboard-shortcuts-button';
        shortcutButton.className = 'btn btn-info keyboard-shortcuts-button';
        shortcutButton.setAttribute('aria-label', 'Show keyboard shortcuts');
        shortcutButton.innerHTML = '<i class="fas fa-keyboard"></i> <span class="d-none d-md-inline">Keyboard Shortcuts</span>';
        
        shortcutButton.addEventListener('click', function() {
            const shortcutsList = shortcuts.join(". ");
            announceToScreenReader("Available keyboard shortcuts: " + shortcutsList);
            
            // Also show visual modal for sighted users
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'keyboardShortcutsModal';
            modal.setAttribute('tabindex', '-1');
            modal.setAttribute('aria-labelledby', 'keyboardShortcutsModalLabel');
            modal.setAttribute('aria-hidden', 'true');
            
            const modalContent = `
                <div class="modal-dialog">
                    <div class="modal-content bg-dark">
                        <div class="modal-header">
                            <h5 class="modal-title" id="keyboardShortcutsModalLabel">Keyboard Shortcuts</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <ul class="list-group list-group-flush bg-dark">
                                ${shortcuts.map(shortcut => `<li class="list-group-item bg-dark">${shortcut}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            `;
            
            modal.innerHTML = modalContent;
            document.body.appendChild(modal);
            
            // Show modal
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            
            // Remove modal from DOM when hidden
            modal.addEventListener('hidden.bs.modal', function() {
                document.body.removeChild(modal);
            });
        });
        
        // Add to page
        const mainContent = document.querySelector('main') || document.body;
        mainContent.appendChild(shortcutButton);
    }
    
    // Announce first few shortcuts
    const shortcutsToAnnounce = shortcuts.slice(0, 3);
    shortcutsToAnnounce.push(`Press Alt+K to hear all ${shortcuts.length} keyboard shortcuts.`);
    
    announceToScreenReader("Available keyboard shortcuts: " + shortcutsToAnnounce.join(". "));
}

/**
 * Update visual indicator of current page
 */
function updateCurrentPageIndicator() {
    // Get the existing page indicator from the template
    let pageIndicator = document.getElementById('current-page-indicator');
    
    // If it doesn't exist (should always exist due to server-side rendering), create it
    if (!pageIndicator) {
        // Create the indicator if it doesn't exist
        pageIndicator = document.createElement('div');
        pageIndicator.id = 'current-page-indicator';
        pageIndicator.className = 'current-page-indicator alert alert-info alert-dismissible fade show';
        pageIndicator.setAttribute('role', 'status');
        
        // Add close button 
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn-close';
        closeButton.setAttribute('data-bs-dismiss', 'alert');
        closeButton.setAttribute('aria-label', 'Close');
        pageIndicator.appendChild(closeButton);
        
        // Insert at the top of the main content
        const mainContent = document.getElementById('main-content');
        if (mainContent && mainContent.firstChild) {
            mainContent.insertBefore(pageIndicator, mainContent.firstChild);
        } else {
            document.body.appendChild(pageIndicator);
        }
        
        // Get current page info
        const heading = document.querySelector('h1');
        const pageTitle = heading ? heading.textContent.trim() : document.title;
        
        // Update the content
        const pageName = document.createElement('strong');
        pageName.textContent = pageTitle;
        
        pageIndicator.innerHTML = '';
        pageIndicator.appendChild(document.createTextNode('Current Page: '));
        pageIndicator.appendChild(pageName);
        
        // Add close button again (since we cleared the innerHTML)
        const closeButton2 = document.createElement('button');
        closeButton2.type = 'button';
        closeButton2.className = 'btn-close';
        closeButton2.setAttribute('data-bs-dismiss', 'alert');
        closeButton2.setAttribute('aria-label', 'Close');
        pageIndicator.appendChild(closeButton2);
    }
    
    // Add event listener to update screen reader when page indicator is closed
    pageIndicator.querySelector('.btn-close').addEventListener('click', function() {
        announceToScreenReader('Page indicator closed. You can reopen it using the Alt+P keyboard shortcut.');
    });
}

/**
 * Toggle the page indicator visibility
 */
function togglePageIndicator() {
    const pageIndicator = document.getElementById('current-page-indicator');
    if (!pageIndicator) {
        // If it doesn't exist, create it
        updateCurrentPageIndicator();
        announceToScreenReader('Page indicator shown. Current page: ' + document.title);
        return;
    }
    
    // Check if it's already hidden by Bootstrap's alert dismissal
    if (pageIndicator.classList.contains('show')) {
        // It's visible, so hide it
        pageIndicator.classList.remove('show');
        setTimeout(() => {
            pageIndicator.style.display = 'none';
        }, 150);
        announceToScreenReader('Page indicator hidden');
    } else {
        // It's hidden, so show it
        pageIndicator.style.display = 'flex';
        setTimeout(() => {
            pageIndicator.classList.add('show');
        }, 10);
        
        // Update content before showing
        const heading = document.querySelector('h1');
        const pageTitle = heading ? heading.textContent.trim() : document.title;
        announceToScreenReader('Page indicator shown. Current page: ' + pageTitle);
    }
}
