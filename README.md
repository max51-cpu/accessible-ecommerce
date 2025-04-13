# Accessible E-commerce Platform

A Python Flask-based e-commerce platform specifically designed for visually impaired users, featuring advanced accessibility technologies and inclusive design principles.

## Setup Instructions for VS Code

1. Extract the ZIP file to a folder
2. Open the folder in VS Code
3. Create a virtual environment:
   ```
   python -m venv venv
   ```
4. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
5. Install dependencies:
   ```
   pip install -r dependencies.txt
   ```
6. Set up environment variables:
   - Create a `.env` file in the root directory with:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/dbname
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```
7. Run the application:
   ```
   python main.py
   ```
   or with gunicorn:
   ```
   gunicorn --bind 0.0.0.0:5000 --reload main:app
   ```

## Accessibility Features

- Voice command integration
- Screen reader optimizations
- Keyboard shortcuts (press Alt+K to hear all shortcuts)
- High contrast mode
- Adjustable text size
- Detailed audio guidance for blind users

## Keyboard Shortcuts

- Alt+K: Announce all keyboard shortcuts
- Alt+1: Home page
- Alt+2: Products page
- Alt+3: Cart page
- Alt+4: Checkout page
- Alt+A: Accessibility panel
- Alt+H: Toggle high contrast mode
- Alt+V: Activate voice commands
- Alt+P: Toggle page indicator

## Database Setup

The application uses PostgreSQL. If you need to set up a new database:

1. Create a PostgreSQL database
2. Update your DATABASE_URL environment variable
3. The application will automatically create tables on first run

## Stripe Integration

1. Sign up for a Stripe account if you don't have one
2. Get your test API keys from the Stripe dashboard
3. Update your STRIPE_SECRET_KEY environment variable