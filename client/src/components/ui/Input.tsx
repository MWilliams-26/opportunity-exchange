import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${error ? 'input-error' : 'input'} ${className}`}
          {...props}
        />
        {helpText && !error && <p className="input-help">{helpText}</p>}
        {error && <p className="input-error-text">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
