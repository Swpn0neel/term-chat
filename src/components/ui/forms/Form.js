import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, createContext, useContext } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';
const FormContext = createContext({
    values: {},
    errors: {},
    isDirty: false,
    setFieldValue: () => { },
    setFieldError: () => { },
});
export function useFormContext() {
    return useContext(FormContext);
}
export function Form({ onSubmit, initialValues = {}, fields = [], children }) {
    const theme = useTheme();
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [isDirty, setIsDirty] = useState(false);
    const setFieldValue = useCallback((name, value) => {
        setValues((v) => ({ ...v, [name]: value }));
        setIsDirty(true);
    }, []);
    const setFieldError = useCallback((name, error) => {
        setErrors((e) => ({ ...e, [name]: error }));
    }, []);
    useInput((input, key) => {
        if (key.ctrl && input === 's') {
            // Validate all fields
            const newErrors = {};
            for (const field of fields) {
                const err = field.validate ? field.validate(values[field.name]) : null;
                if (err)
                    newErrors[field.name] = err;
            }
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }
            onSubmit(values);
        }
    });
    return (_jsx(FormContext.Provider, { value: { values, errors, isDirty, setFieldValue, setFieldError }, children: _jsxs(Box, { flexDirection: "column", gap: 1, children: [children, _jsx(Text, { color: theme.colors.mutedForeground, dimColor: true, children: "Press Ctrl+S to submit" })] }) }));
}
