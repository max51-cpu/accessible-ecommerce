from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField
from wtforms.validators import DataRequired, Email, EqualTo, Length, ValidationError
from models import User

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()], render_kw={"aria-label": "Username", "autocomplete": "username"})
    password = PasswordField('Password', validators=[DataRequired()], render_kw={"aria-label": "Password", "autocomplete": "current-password"})
    remember_me = BooleanField('Remember Me', render_kw={"aria-label": "Remember Me"})
    submit = SubmitField('Log In', render_kw={"aria-label": "Log In"})

class SignupForm(FlaskForm):
    username = StringField('Username', 
                          validators=[DataRequired(), Length(min=3, max=64)],
                          render_kw={"aria-label": "Username", "autocomplete": "username"})
    email = StringField('Email', 
                       validators=[DataRequired(), Email()],
                       render_kw={"aria-label": "Email", "autocomplete": "email"})
    password = PasswordField('Password', 
                            validators=[DataRequired(), Length(min=8)],
                            render_kw={"aria-label": "Password", "autocomplete": "new-password"})
    confirm_password = PasswordField('Confirm Password', 
                                    validators=[DataRequired(), EqualTo('password')],
                                    render_kw={"aria-label": "Confirm Password", "autocomplete": "new-password"})
    submit = SubmitField('Sign Up', render_kw={"aria-label": "Sign Up"})
    
    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('Username already taken. Please choose a different one.')
            
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('Email already registered. Please use a different one or log in.')