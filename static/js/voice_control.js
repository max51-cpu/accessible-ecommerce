/**
 * Voice control functionality for the accessible e-commerce website
 * This script handles speech recognition and processes voice commands
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize voice control if supported and enabled
    if (getAccessibilitySetting('voice_commands', true)) {
        initVoiceControl();
    }
    
    // Voice command toggle
    const voiceToggle = document.getElementById('voice-commands-toggle');
    if (voiceToggle) {
        voiceToggle.addEventListener('change', function() {
            saveAccessibilitySetting('voice_commands', this.checked);
            
            if (this.checked) {
                initVoiceControl();
                announceToScreenReader('Voice commands enabled');
            } else {
                if (window.speechRecognition) {
                    window.speechRecognition.stop();
                }
                announceToScreenReader('Voice commands disabled');
            }
        });
        
        // Set initial state
        voiceToggle.checked = getAccessibilitySetting('voice_commands', true);
    }
});

/**
 * Initialize voice control functionality
 */
function initVoiceControl() {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log('Speech recognition not supported in this browser');
        return;
    }
    
    // Create speech recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Configure recognition
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    // Store in window for access from keyboard shortcuts
    window.speechRecognition = recognition;
    window.startVoiceRecognition = startListening;
    
    // Add voice command button to the UI
    addVoiceCommandButton();
    
    // Handle results
    recognition.onresult = function(event) {
        const command = event.results[0][0].transcript;
        processVoiceCommand(command);
    };
    
    // Handle errors
    recognition.onerror = function(event) {
        if (event.error === 'no-speech') {
            announceToScreenReader('No speech was detected. Please try again.');
        } else {
            console.error('Speech recognition error:', event.error);
            announceToScreenReader('Voice recognition error. Please try again.');
        }
    };
    
    // When recognition ends
    recognition.onend = function() {
        const micButton = document.getElementById('voice-command-button');
        if (micButton) {
            micButton.classList.remove('listening');
            micButton.setAttribute('aria-pressed', 'false');
        }
    };
    
    // Function to start listening
    function startListening() {
        if (!getAccessibilitySetting('voice_commands', true)) {
            announceToScreenReader('Voice commands are disabled. Enable them in accessibility settings.');
            return;
        }
        
        try {
            recognition.start();
            
            const micButton = document.getElementById('voice-command-button');
            if (micButton) {
                micButton.classList.add('listening');
                micButton.setAttribute('aria-pressed', 'true');
            }
            
            announceToScreenReader('Listening for voice command...');
        } catch (error) {
            console.error('Error starting speech recognition:', error);
        }
    }
}

/**
 * Add voice command button to the UI
 */
function addVoiceCommandButton() {
    // Check if button already exists
    if (document.getElementById('voice-command-button')) {
        return;
    }
    
    // Create button
    const button = document.createElement('button');
    button.id = 'voice-command-button';
    button.className = 'btn btn-primary voice-button';
    button.setAttribute('aria-label', 'Activate voice commands');
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('type', 'button');
    
    // Add icon
    const icon = document.createElement('i');
    icon.className = 'fas fa-microphone';
    button.appendChild(icon);
    
    // Add text for screen readers
    const srText = document.createElement('span');
    srText.className = 'sr-only';
    srText.textContent = 'Activate voice commands';
    button.appendChild(srText);
    
    // Add event listener
    button.addEventListener('click', function() {
        if (window.startVoiceRecognition) {
            window.startVoiceRecognition();
        }
    });
    
    // Add to page
    document.body.appendChild(button);
}

/**
 * Process voice command by sending to server
 */
function processVoiceCommand(command) {
    console.log('Processing voice command:', command);
    announceToScreenReader(`Command received: ${command}`);
    
    // Send to server for processing
    const formData = new FormData();
    formData.append('command', command);
    
    fetch('/process_voice_command', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            announceToScreenReader(data.message);
            executeCommandAction(data.action, data.data);
        } else {
            announceToScreenReader(data.message);
        }
    })
    .catch(error => {
        console.error('Error processing voice command:', error);
        announceToScreenReader('Error processing your command. Please try again.');
    });
}

/**
 * Execute action based on voice command result
 */
function executeCommandAction(action, data) {
    switch (action) {
        case 'search':
            // Navigate to products page with search term
            window.location.href = `/products?search=${encodeURIComponent(data.search_term)}`;
            break;
            
        case 'navigate':
            if (data.location) {
                // Navigate to specific page
                const routes = {
                    'home': '/',
                    'products': '/products',
                    'cart': '/cart',
                    'checkout': '/checkout'
                };
                
                if (data.location in routes) {
                    window.location.href = routes[data.location];
                } else if (data.location === 'category') {
                    // Find category ID by name
                    const categoryElement = [...document.querySelectorAll('.category-link')]
                        .find(el => el.textContent.toLowerCase().includes(data.category.toLowerCase()));
                    
                    if (categoryElement && categoryElement.dataset.categoryId) {
                        window.location.href = `/products?category=${categoryElement.dataset.categoryId}`;
                    } else {
                        // Try to search for the category name
                        window.location.href = `/products?search=${encodeURIComponent(data.category)}`;
                    }
                }
            } else if (data.direction) {
                // Navigate browser history
                if (data.direction === 'back') {
                    window.history.back();
                } else if (data.direction === 'forward') {
                    window.history.forward();
                }
            }
            break;
            
        case 'cart':
            if (data.operation === 'add') {
                // Find product by name
                const addButton = [...document.querySelectorAll('.add-to-cart-button')]
                    .find(btn => {
                        const productCard = btn.closest('.product-card');
                        return productCard && productCard.querySelector('.product-name')
                            .textContent.toLowerCase().includes(data.product.toLowerCase());
                    });
                
                if (addButton) {
                    addButton.click();
                } else {
                    announceToScreenReader(`Could not find product: ${data.product}`);
                }
            }
            break;
            
        case 'accessibility':
            // Handle accessibility setting changes
            if (data.setting === 'text_size') {
                const newSize = data.value === 'increase' ? 
                    increaseTextSize() : decreaseTextSize();
                
                saveAccessibilitySetting('text_size', newSize);
            } else if (data.setting === 'high_contrast') {
                const contrastToggle = document.getElementById('contrast-toggle');
                if (contrastToggle) {
                    contrastToggle.checked = data.value;
                    const event = new Event('change');
                    contrastToggle.dispatchEvent(event);
                } else {
                    // Handle without the toggle
                    if (data.value) {
                        document.body.classList.add('high-contrast');
                    } else {
                        document.body.classList.remove('high-contrast');
                    }
                    saveAccessibilitySetting('high_contrast', data.value);
                }
            } else if (data.setting === 'read_page') {
                // Read current page content
                readPageContent();
            }
            break;
    }
}

/**
 * Increase text size and return new size
 */
function increaseTextSize() {
    const sizes = ['small', 'medium', 'large', 'x-large'];
    const currentSize = getAccessibilitySetting('text_size', 'medium');
    const currentIndex = sizes.indexOf(currentSize);
    
    // Don't increase if already at maximum
    if (currentIndex >= sizes.length - 1) {
        announceToScreenReader('Text size already at maximum');
        return currentSize;
    }
    
    const newSize = sizes[currentIndex + 1];
    applyTextSize(newSize);
    return newSize;
}

/**
 * Decrease text size and return new size
 */
function decreaseTextSize() {
    const sizes = ['small', 'medium', 'large', 'x-large'];
    const currentSize = getAccessibilitySetting('text_size', 'medium');
    const currentIndex = sizes.indexOf(currentSize);
    
    // Don't decrease if already at minimum
    if (currentIndex <= 0) {
        announceToScreenReader('Text size already at minimum');
        return currentSize;
    }
    
    const newSize = sizes[currentIndex - 1];
    applyTextSize(newSize);
    return newSize;
}

/**
 * Read current page content using screen reader
 */
function readPageContent() {
    // Get main content
    const mainContent = document.querySelector('main');
    if (!mainContent) {
        announceToScreenReader('Sorry, could not find main content to read');
        return;
    }
    
    // Get page heading
    const heading = document.querySelector('h1');
    const pageTitle = heading ? heading.textContent : document.title;
    
    // Start with page title
    let contentToRead = `Page: ${pageTitle}. `;
    
    // Get all text content from main sections
    const sections = mainContent.querySelectorAll('section, .card, .product-card, .product-details');
    
    if (sections.length > 0) {
        // Read structured content
        sections.forEach(section => {
            // Get section heading if available
            const sectionHeading = section.querySelector('h2, h3, h4, .card-title');
            if (sectionHeading) {
                contentToRead += `${sectionHeading.textContent}. `;
            }
            
            // Get section content
            const paragraphs = section.querySelectorAll('p, .card-text, .product-description');
            paragraphs.forEach(p => {
                contentToRead += `${p.textContent} `;
            });
            
            contentToRead += '. ';
        });
    } else {
        // Fallback to all paragraphs
        const paragraphs = mainContent.querySelectorAll('p');
        paragraphs.forEach(p => {
            contentToRead += `${p.textContent} `;
        });
    }
    
    // Check if we're on a product page
    const productDetails = document.querySelector('.product-details');
    if (productDetails) {
        const price = document.querySelector('.product-price');
        if (price) {
            contentToRead += `Price: ${price.textContent}. `;
        }
    }
    
    // Read content
    if (contentToRead.trim().length > 0) {
        announceToScreenReader(contentToRead);
    } else {
        announceToScreenReader('Sorry, no readable content found on this page');
    }
}
