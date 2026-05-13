import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value || new Date().toISOString().slice(0, 16));

  const handleOpen = () => {
    setTempValue(value || new Date().toISOString().slice(0, 16));
    setIsOpen(true);
  };

  const handleConfirm = () => {
    onChange(tempValue);
    setIsOpen(false);
  };

  return (
    <div className="input-group" style={{ position: 'relative' }}>
      <label className="input-label">{label}</label>
      <div 
        onClick={handleOpen}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: value ? 'var(--color-text-main)' : 'var(--color-text-muted)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span>{value ? new Date(value).toLocaleString() : 'Select date and time...'}</span>
        <CalendarIcon size={18} style={{ opacity: 0.5 }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem'
        }}>
          <div className="glass-panel animate-scale-in" style={{ 
            width: '100%', 
            maxWidth: '360px', 
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{label}</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.5rem', textAlign: 'left' }}>Pick Date & Time</p>
              <input 
                type="datetime-local" 
                className="input-field"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                style={{ 
                  width: '100%', 
                  textAlign: 'center',
                  fontSize: '1.1rem',
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.03)'
                }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button"
                className="btn btn-outline" 
                style={{ flex: 1 }} 
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="btn btn-primary" 
                style={{ flex: 1, background: 'var(--primary-color)' }} 
                onClick={handleConfirm}
              >
                <Check size={18} /> OK
              </button>
            </div>
            
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '1.5rem' }}>
              Confirming will save your selection and close this frame.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
