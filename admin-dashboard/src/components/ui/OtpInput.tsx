import React, { useRef, useEffect } from 'react';

interface OtpInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({ value, onChange, disabled }) => {
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    // Split value into array of 6 characters
    const otpArray = value.split('').concat(Array(6).fill('')).slice(0, 6);

    const handleChange = (val: string, index: number) => {
        const numericVal = val.replace(/[^0-9]/g, '');
        if (!numericVal) {
            // If empty, update the state
            const newOtp = [...otpArray];
            newOtp[index] = '';
            onChange(newOtp.join(''));
            return;
        }

        // Take only the last character if typed
        const digit = numericVal.slice(-1);
        const newOtp = [...otpArray];
        newOtp[index] = digit;
        const newOtpStr = newOtp.join('');
        onChange(newOtpStr);

        // Move focus to next input if there is a digit and we are not at the end
        if (digit && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            const newOtp = [...otpArray];
            if (!newOtp[index] && index > 0) {
                // If current input is empty, clear the previous and move focus there
                newOtp[index - 1] = '';
                onChange(newOtp.join(''));
                inputsRef.current[index - 1]?.focus();
            } else {
                newOtp[index] = '';
                onChange(newOtp.join(''));
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputsRef.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        const numericPasted = pastedData.replace(/[^0-9]/g, '').slice(0, 6);
        
        if (numericPasted) {
            onChange(numericPasted);
            // Focus the appropriate input after pasting
            const nextFocusIndex = Math.min(numericPasted.length, 5);
            inputsRef.current[nextFocusIndex]?.focus();
        }
    };

    // Auto focus first field on mount if not disabled
    useEffect(() => {
        if (!disabled) {
            inputsRef.current[0]?.focus();
        }
    }, [disabled]);

    return (
        <div className="flex justify-center gap-2.5 my-4" onPaste={handlePaste}>
            {otpArray.map((digit, idx) => (
                <input
                    key={idx}
                    ref={(el) => { inputsRef.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e.target.value, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    disabled={disabled}
                    className="w-12 h-12 text-center text-xl font-bold rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 disabled:opacity-50"
                />
            ))}
        </div>
    );
};
