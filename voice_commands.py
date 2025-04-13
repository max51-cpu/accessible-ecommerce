import re
import logging

# This module processes voice commands for the e-commerce website

def process_command(command_text):
    """
    Process voice commands and return appropriate actions
    
    Commands supported:
    - Search for [product]
    - Show me [category]
    - Add [product] to cart
    - Go to [page name]
    - Increase/decrease text size
    - Enable/disable high contrast
    """
    command = command_text.lower().strip()
    logging.debug(f"Processing voice command: {command}")
    
    # Search commands
    search_match = re.search(r'search (?:for )?(.*)', command)
    if search_match:
        search_term = search_match.group(1).strip()
        return {
            'success': True,
            'action': 'search',
            'data': {'search_term': search_term},
            'message': f'Searching for {search_term}'
        }
    
    # Category navigation
    category_match = re.search(r'show (?:me )?(.*?)(?:\s+products|category)', command)
    if category_match:
        category = category_match.group(1).strip()
        return {
            'success': True,
            'action': 'navigate',
            'data': {'location': 'category', 'category': category},
            'message': f'Showing {category} products'
        }
    
    # Add to cart
    cart_match = re.search(r'add (.*?) to (?:my )?cart', command)
    if cart_match:
        product = cart_match.group(1).strip()
        return {
            'success': True,
            'action': 'cart',
            'data': {'operation': 'add', 'product': product},
            'message': f'Adding {product} to your cart'
        }
    
    # Navigation commands
    nav_matches = {
        r'go to (?:my )?(cart|checkout|home|products)': lambda m: (
            'navigate', {'location': m.group(1)}, f'Going to {m.group(1)}'
        ),
        r'go (back|forward)': lambda m: (
            'navigate', {'direction': m.group(1)}, f'Going {m.group(1)}'
        )
    }
    
    for pattern, handler in nav_matches.items():
        match = re.search(pattern, command)
        if match:
            action, data, message = handler(match)
            return {'success': True, 'action': action, 'data': data, 'message': message}
    
    # Accessibility commands
    accessibility_matches = {
        r'(increase|decrease) text size': lambda m: (
            'accessibility', {'setting': 'text_size', 'value': m.group(1)}, 
            f'{m.group(1).capitalize()}ing text size'
        ),
        r'(enable|disable) high contrast': lambda m: (
            'accessibility', 
            {'setting': 'high_contrast', 'value': m.group(1) == 'enable'}, 
            f'{"Enabling" if m.group(1) == "enable" else "Disabling"} high contrast mode'
        ),
        r'(enable|disable) voice commands': lambda m: (
            'accessibility', 
            {'setting': 'voice_commands', 'value': m.group(1) == 'enable'}, 
            f'{"Enabling" if m.group(1) == "enable" else "Disabling"} voice commands'
        ),
        r'(read|describe) (this|page)': lambda m: (
            'accessibility', {'setting': 'read_page', 'value': True},
            'Reading page content'
        )
    }
    
    for pattern, handler in accessibility_matches.items():
        match = re.search(pattern, command)
        if match:
            action, data, message = handler(match)
            return {'success': True, 'action': action, 'data': data, 'message': message}
    
    # If no command matched
    return {
        'success': False,
        'message': "I didn't understand that command. Please try again."
    }
