import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helpText, className = '', id, ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={textareaId} className="input-label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`${error ? 'input-error' : 'input'} min-h-[100px] ${className}`}
          {...props}
        />
        {helpText && !error && <p className="input-help">{helpText}</p>}
        {error && <p className="input-error-text">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
