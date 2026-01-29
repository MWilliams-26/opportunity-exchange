const { ValidationError } = require('./errorHandler');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;

const validators = {
  required(value, field) {
    if (value === undefined || value === null || value === '') {
      throw new ValidationError(`${field} is required`, field);
    }
    return value;
  },

  string(value, field, { minLength = 0, maxLength = Infinity } = {}) {
    if (typeof value !== 'string') {
      throw new ValidationError(`${field} must be a string`, field);
    }
    if (value.length < minLength) {
      throw new ValidationError(`${field} must be at least ${minLength} characters`, field);
    }
    if (value.length > maxLength) {
      throw new ValidationError(`${field} must be at most ${maxLength} characters`, field);
    }
    return value;
  },

  email(value, field = 'email') {
    if (!EMAIL_REGEX.test(value)) {
      throw new ValidationError('Invalid email format', field);
    }
    return value.toLowerCase().trim();
  },

  password(value, field = 'password') {
    if (typeof value !== 'string' || value.length < 8) {
      throw new ValidationError('Password must be at least 8 characters', field);
    }
    if (value.length > 128) {
      throw new ValidationError('Password must be at most 128 characters', field);
    }
    return value;
  },

  positiveInteger(value, field) {
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) {
      throw new ValidationError(`${field} must be a positive integer`, field);
    }
    return num;
  },

  id(value, field = 'id') {
    return validators.positiveInteger(value, field);
  },

  money(value, field) {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      throw new ValidationError(`${field} must be a non-negative number`, field);
    }
    return Math.round(num * 100);
  },

  moneyFromCents(cents) {
    return cents / 100;
  },

  enum(value, field, allowedValues) {
    if (!allowedValues.includes(value)) {
      throw new ValidationError(`${field} must be one of: ${allowedValues.join(', ')}`, field);
    }
    return value;
  },

  domain(value, field = 'domain') {
    if (!DOMAIN_REGEX.test(value)) {
      throw new ValidationError('Invalid domain format', field);
    }
    if (value.length > 253) {
      throw new ValidationError('Domain name too long', field);
    }
    return value.toLowerCase();
  },

  optional(value, validator, ...args) {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    return validator(value, ...args);
  },

  isoDate(value, field) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new ValidationError(`${field} must be a valid date`, field);
    }
    return date.toISOString();
  },

  futureDate(value, field) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new ValidationError(`${field} must be a valid date`, field);
    }
    if (date <= new Date()) {
      throw new ValidationError(`${field} must be in the future`, field);
    }
    return date.toISOString();
  },
};

module.exports = validators;
