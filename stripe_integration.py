import os
import stripe
import logging

# Initialize Stripe with the secret key
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

def create_checkout_session(items, success_url, cancel_url):
    """
    Create a Stripe checkout session for payment processing.
    
    Args:
        items: List of dictionaries containing product details with keys:
            - name: Product name
            - description: Product description
            - amount: Price in cents (integer)
            - quantity: Number of items
        success_url: URL to redirect after successful payment
        cancel_url: URL to redirect if payment is cancelled
        
    Returns:
        Checkout session ID or None if an error occurs
    """
    try:
        # Create line items from the cart items
        line_items = []
        for item in items:
            line_items.append({
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': item['name'],
                        'description': item['description'],
                    },
                    'unit_amount': int(item['amount'] * 100),  # Convert to cents
                },
                'quantity': item['quantity'],
            })
        
        # Create the checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            automatic_tax={'enabled': True}
        )
        
        return checkout_session
    
    except Exception as e:
        logging.error(f"Error creating Stripe checkout session: {str(e)}")
        return None

def retrieve_session(session_id):
    """
    Retrieve a checkout session by ID.
    
    Args:
        session_id: The Stripe checkout session ID
        
    Returns:
        Session object or None if an error occurs
    """
    try:
        return stripe.checkout.Session.retrieve(session_id)
    except Exception as e:
        logging.error(f"Error retrieving Stripe session: {str(e)}")
        return None

def create_payment_intent(amount, currency='usd', metadata=None):
    """
    Create a payment intent directly.
    
    Args:
        amount: Amount in dollars (will be converted to cents)
        currency: 3-letter currency code
        metadata: Additional data to attach to the payment
        
    Returns:
        Payment intent object or None if an error occurs
    """
    try:
        return stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Convert to cents
            currency=currency,
            metadata=metadata or {}
        )
    except Exception as e:
        logging.error(f"Error creating payment intent: {str(e)}")
        return None

def format_stripe_error(error):
    """
    Format Stripe errors for display to the user
    
    Args:
        error: Stripe error object
        
    Returns:
        Human-readable error message
    """
    if hasattr(error, 'user_message'):
        return error.user_message
    
    return "An error occurred while processing your payment. Please try again."