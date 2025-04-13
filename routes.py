from flask import render_template, request, redirect, url_for, flash, session, jsonify
from app import app, db
from models import User, Category, Product, CartItem, Order, OrderItem
from forms import LoginForm, SignupForm
from flask_login import login_user, logout_user, current_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
import voice_commands
import logging

# Sample products and categories for initial database setup
def create_sample_data():
    # Check if we already have categories
    if Category.query.first() is None:
        categories = [
            {"name": "Electronics", "description": "Electronic devices and accessories"},
            {"name": "Clothing", "description": "Apparel and fashion items"},
            {"name": "Books", "description": "Books in various formats including audio books"},
            {"name": "Home Goods", "description": "Items for your home and living spaces"}
        ]
        
        for cat_data in categories:
            category = Category(**cat_data)
            db.session.add(category)
        
        db.session.commit()
        
        # Add sample products
        electronics = Category.query.filter_by(name="Electronics").first()
        clothing = Category.query.filter_by(name="Clothing").first()
        books = Category.query.filter_by(name="Books").first()
        home = Category.query.filter_by(name="Home Goods").first()
        
        products = [
            {
                "name": "Accessible Smartphone",
                "description": "Smartphone with enhanced accessibility features",
                "price": 299.99,
                "category_id": electronics.id,
                "audio_description": "A smartphone specifically designed with accessibility features including screen reader compatibility, voice control, and tactile buttons."
            },
            {
                "name": "Audio Book Reader",
                "description": "Device for playing audio books with tactile controls",
                "price": 89.99,
                "category_id": electronics.id,
                "audio_description": "An audio book reader with large tactile buttons, high quality speaker, and simple interface designed for visually impaired users."
            },
            {
                "name": "Braille T-Shirt",
                "description": "Cotton t-shirt with braille message",
                "price": 24.99,
                "category_id": clothing.id,
                "audio_description": "A soft cotton t-shirt in black color with an inspiring message written in braille on the front."
            },
            {
                "name": "Audio Cookbook",
                "description": "Cookbook in audio format with detailed instructions",
                "price": 19.99,
                "category_id": books.id,
                "audio_description": "A comprehensive cookbook in audio format with clearly narrated recipes and cooking techniques."
            },
            {
                "name": "Tactile Kitchen Timer",
                "description": "Kitchen timer with tactile markers and audio alerts",
                "price": 14.99,
                "category_id": home.id,
                "audio_description": "A kitchen timer with raised tactile markers, distinct audio alerts, and vibration feedback."
            }
        ]
        
        for prod_data in products:
            product = Product(**prod_data)
            db.session.add(product)
        
        db.session.commit()
        logging.debug("Sample data created successfully")

# Home page
@app.route('/')
def index():
    latest_products = Product.query.order_by(Product.id.desc()).limit(4).all()
    categories = Category.query.all()
    return render_template('index.html', latest_products=latest_products, categories=categories)

# Products page
@app.route('/products')
def products():
    category_id = request.args.get('category', type=int)
    search_query = request.args.get('search', '')
    
    # Base query
    product_query = Product.query
    
    # Apply filters
    if category_id:
        product_query = product_query.filter_by(category_id=category_id)
    
    if search_query:
        product_query = product_query.filter(Product.name.ilike(f'%{search_query}%') | 
                                            Product.description.ilike(f'%{search_query}%'))
    
    products = product_query.all()
    categories = Category.query.all()
    
    return render_template('products.html', 
                          products=products, 
                          categories=categories, 
                          current_category=category_id,
                          search_query=search_query)

# Product detail page
@app.route('/product/<int:product_id>')
def product_detail(product_id):
    product = Product.query.get_or_404(product_id)
    return render_template('product_detail.html', product=product)

# Cart management
@app.route('/cart')
def view_cart():
    cart_items = []
    total = 0
    
    # Handle cart differently based on authentication status
    if current_user.is_authenticated:
        # Get cart items from database for authenticated users
        db_cart_items = CartItem.query.filter_by(user_id=current_user.id).all()
        
        for item in db_cart_items:
            subtotal = item.product.price * item.quantity
            cart_items.append({
                'product': item.product,
                'quantity': item.quantity,
                'subtotal': subtotal
            })
            total += subtotal
    else:
        # Use session cart for non-authenticated users
        cart = session.get('cart', [])
        
        for item in cart:
            product = Product.query.get(item['product_id'])
            if product:
                subtotal = product.price * item['quantity']
                cart_items.append({
                    'product': product,
                    'quantity': item['quantity'],
                    'subtotal': subtotal
                })
                total += subtotal
    
    return render_template('cart.html', cart_items=cart_items, total=total)

@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    product_id = request.form.get('product_id', type=int)
    quantity = request.form.get('quantity', 1, type=int)
    
    if not product_id:
        flash('Invalid product selected', 'error')
        return redirect(url_for('products'))
    
    product = Product.query.get_or_404(product_id)
    
    if current_user.is_authenticated:
        # Add to database cart for authenticated users
        cart_item = CartItem.query.filter_by(
            user_id=current_user.id, 
            product_id=product_id
        ).first()
        
        if cart_item:
            # Update existing cart item
            cart_item.quantity += quantity
        else:
            # Create new cart item
            cart_item = CartItem(
                user_id=current_user.id,
                product_id=product_id,
                quantity=quantity
            )
            db.session.add(cart_item)
        
        db.session.commit()
    else:
        # Use session cart for anonymous users
        if 'cart' not in session:
            session['cart'] = []
        
        cart = session['cart']
        
        # Check if product already in cart
        found = False
        for item in cart:
            if item['product_id'] == product_id:
                item['quantity'] += quantity
                found = True
                break
        
        if not found:
            cart.append({'product_id': product_id, 'quantity': quantity})
        
        session['cart'] = cart
    
    flash(f'{product.name} added to your cart!', 'success')
    return redirect(url_for('view_cart'))

@app.route('/update_cart', methods=['POST'])
def update_cart():
    product_id = request.form.get('product_id', type=int)
    quantity = request.form.get('quantity', 1, type=int)
    
    if not product_id:
        flash('Invalid product', 'error')
        return redirect(url_for('view_cart'))
    
    if current_user.is_authenticated:
        # Update database cart for authenticated users
        cart_item = CartItem.query.filter_by(
            user_id=current_user.id, 
            product_id=product_id
        ).first()
        
        if cart_item:
            if quantity > 0:
                cart_item.quantity = quantity
                db.session.commit()
            else:
                db.session.delete(cart_item)
                db.session.commit()
    else:
        # Use session cart for anonymous users
        cart = session.get('cart', [])
        
        for item in cart:
            if item['product_id'] == product_id:
                if quantity > 0:
                    item['quantity'] = quantity
                else:
                    cart.remove(item)
                break
        
        session['cart'] = cart
    
    flash('Cart updated successfully', 'success')
    return redirect(url_for('view_cart'))

@app.route('/remove_from_cart/<int:product_id>')
def remove_from_cart(product_id):
    if current_user.is_authenticated:
        # Remove from database cart for authenticated users
        cart_item = CartItem.query.filter_by(
            user_id=current_user.id, 
            product_id=product_id
        ).first()
        
        if cart_item:
            db.session.delete(cart_item)
            db.session.commit()
    else:
        # Use session cart for anonymous users
        cart = session.get('cart', [])
        
        for item in cart:
            if item['product_id'] == product_id:
                cart.remove(item)
                break
        
        session['cart'] = cart
    
    flash('Item removed from cart', 'success')
    return redirect(url_for('view_cart'))

# Checkout process
@app.route('/checkout')
def checkout():
    cart_items = []
    total = 0
    
    if current_user.is_authenticated:
        # Get cart items from database for authenticated users
        db_cart_items = CartItem.query.filter_by(user_id=current_user.id).all()
        
        if not db_cart_items:
            flash('Your cart is empty', 'info')
            return redirect(url_for('products'))
        
        for item in db_cart_items:
            subtotal = item.product.price * item.quantity
            cart_items.append({
                'product': item.product,
                'quantity': item.quantity,
                'subtotal': subtotal
            })
            total += subtotal
    else:
        # Use session cart for anonymous users
        cart = session.get('cart', [])
        if not cart:
            flash('Your cart is empty', 'info')
            return redirect(url_for('products'))
        
        for item in cart:
            product = Product.query.get(item['product_id'])
            if product:
                subtotal = product.price * item['quantity']
                cart_items.append({
                    'product': product,
                    'quantity': item['quantity'],
                    'subtotal': subtotal
                })
                total += subtotal
    
    return render_template('checkout.html', cart_items=cart_items, total=total)

@app.route('/process_order', methods=['POST'])
def process_order():
    # Processing order - in a real app, this would handle payment processing
    name = request.form.get('name')
    email = request.form.get('email')
    address = request.form.get('address')
    
    cart_items = []
    total = 0
    
    if current_user.is_authenticated:
        # Get cart items from database for authenticated users
        db_cart_items = CartItem.query.filter_by(user_id=current_user.id).all()
        
        if not db_cart_items:
            flash('Your cart is empty', 'info')
            return redirect(url_for('products'))
        
        for item in db_cart_items:
            subtotal = item.product.price * item.quantity
            cart_items.append({
                'product': item.product,
                'quantity': item.quantity
            })
            total += subtotal
        
        user_id = current_user.id
    else:
        # Use session cart for anonymous users
        cart = session.get('cart', [])
        if not cart:
            flash('Your cart is empty', 'info')
            return redirect(url_for('products'))
        
        for item in cart:
            product = Product.query.get(item['product_id'])
            if product:
                cart_items.append({
                    'product': product,
                    'quantity': item['quantity']
                })
                total += product.price * item['quantity']
        
        # For demo purposes, create a user if not exists
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(username=name, email=email)
            user.set_password('temporary')  # Set a temporary password for guest users
            db.session.add(user)
            db.session.flush()
        user_id = user.id
    
    # Create order
    order = Order(user_id=user_id, total_amount=total, shipping_address=address)
    db.session.add(order)
    db.session.flush()
    
    # Add order items
    for item in cart_items:
        product = item['product']
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            quantity=item['quantity'],
            price=product.price
        )
        db.session.add(order_item)
    
    # Clear the cart
    if current_user.is_authenticated:
        CartItem.query.filter_by(user_id=current_user.id).delete()
    else:
        session.pop('cart', None)
    
    db.session.commit()
    flash('Your order has been placed successfully!', 'success')
    return redirect(url_for('confirmation', order_id=order.id))

@app.route('/confirmation/<int:order_id>')
def confirmation(order_id):
    order = Order.query.get_or_404(order_id)
    return render_template('confirmation.html', order=order)

# Voice command endpoints
@app.route('/process_voice_command', methods=['POST'])
def process_voice_command():
    command_text = request.form.get('command', '')
    if not command_text:
        return jsonify({'success': False, 'message': 'No command provided'})
    
    result = voice_commands.process_command(command_text)
    return jsonify(result)

# Authentication routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember_me.data)
            flash('You have been logged in successfully!', 'success')
            next_page = request.args.get('next', '')
            if next_page and next_page.startswith('/'):
                return redirect(next_page)
            return redirect(url_for('index'))
        else:
            flash('Login failed. Please check your username and password.', 'danger')
    
    return render_template('login.html', form=form)

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    form = SignupForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        
        db.session.add(user)
        db.session.commit()
        
        flash('Your account has been created! You can now log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('signup.html', form=form)

@app.route('/logout')
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

# Accessibility settings
@app.route('/set_accessibility', methods=['POST'])
def set_accessibility():
    text_size = request.form.get('text_size', 'medium')
    high_contrast = request.form.get('high_contrast', 'false') == 'true'
    voice_commands = request.form.get('voice_commands', 'true') == 'true'
    audio_feedback = request.form.get('audio_feedback', 'true') == 'true'
    
    session['accessibility'] = {
        'text_size': text_size,
        'high_contrast': high_contrast,
        'voice_commands': voice_commands,
        'audio_feedback': audio_feedback
    }
    
    return jsonify({'success': True})

@app.context_processor
def inject_accessibility_settings():
    default_settings = {
        'text_size': 'medium',
        'high_contrast': False,
        'voice_commands': True,
        'audio_feedback': True
    }
    
    settings = session.get('accessibility', default_settings)
    return {'accessibility': settings}
