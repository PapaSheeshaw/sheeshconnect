// Import required modules
const Joi = require('joi');

// Validation schema for the registration form
const registrationSchema = Joi.object({
    fullName: Joi.string().min(3).max(30).required().messages({
        'string.base': 'Full Name should be a string.',
        'string.min': 'Full Name must be at least 3 characters long.',
        'string.max': 'Full Name cannot exceed 30 characters.',
        'any.required': 'Full Name is required.'
    }),
    username: Joi.string().alphanum().min(3).max(30).required().messages({
        'string.base': 'Username should be a string.',
        'string.alphanum': 'Username must contain only letters and numbers.',
        'string.min': 'Username must be at least 3 characters long.',
        'string.max': 'Username cannot exceed 30 characters.',
        'any.required': 'Username is required.'
    }),
    phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
        'string.pattern.base': 'Phone number must be a 10-digit number.',
        'any.required': 'Phone number is required.'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Email must be a valid email address.',
        'any.required': 'Email address is required.'
    }),
    password: Joi.string().min(6).required().messages({
        'string.base': 'Password should be a string.',
        'string.min': 'Password must be at least 6 characters long.',
        'any.required': 'Password is required.'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Passwords must match.',
        'any.required': 'Confirm password is required.'
    })
});

// Validation schema for the login form
const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email must be a valid email address.',
        'any.required': 'Email address is required.'
    }),
    password: Joi.string().min(6).required().messages({
        'string.base': 'Password should be a string.',
        'string.min': 'Password must be at least 6 characters long.',
        'any.required': 'Password is required.'
    })
});

// Example of how to use the schema
// Registration example
function validateRegistration(data) {
    return registrationSchema.validate(data, { abortEarly: false });
}

// Login example
function validateLogin(data) {
    return loginSchema.validate(data, { abortEarly: false });
}

module.exports = { validateRegistration, validateLogin };
