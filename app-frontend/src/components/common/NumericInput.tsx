import { useCallback, useEffect, useRef, useState } from "react";
import { TextInput, TextInputProps } from "react-native";
import { InputField } from "./InputField";

/**
 * Number fields that store a `number` in state and render `String(n)` have
 * two bugs every user hits:
 *   - clearing the field turns "" into 0, which re-renders as "0" with the
 *     cursor after it — you can never actually empty the box
 *   - typing "1." parses to 1 and re-renders as "1" — decimals are impossible
 *
 * The fix is to let the field own its TEXT while the user types and only
 * hand parsed numbers outward. The text is re-derived from `value` only when
 * the outside world changes it to something the text doesn't already mean
 * (a reset after save, a rate auto-filled from a picked product).
 */

type NumericCore = {
  value: number | undefined;
  onChangeNumber: (next: number | undefined) => void;
  /** What an empty box means to the caller. Default 0; pass `undefined`
   *  for optional fields so "blank" stays distinguishable from "zero". */
  emptyValue?: number | undefined;
  allowDecimal?: boolean;
};

const formatExternal = (n: number | undefined): string =>
  n === undefined || n === null || Number.isNaN(n) || n === 0 ? "" : String(n);

export const useNumericText = ({
  value,
  onChangeNumber,
  emptyValue = 0,
  allowDecimal = true,
}: NumericCore) => {
  const [text, setText] = useState(() => formatExternal(value));
  const textRef = useRef(text);
  textRef.current = text;

  const parse = useCallback(
    (t: string): number | undefined => {
      if (t.trim() === "" || t === ".") return emptyValue;
      const n = parseFloat(t);
      return Number.isNaN(n) ? emptyValue : n;
    },
    [emptyValue]
  );

  // Only overwrite what the user is typing when the outside value genuinely
  // disagrees with it — never for "" vs 0 or "1." vs 1.
  useEffect(() => {
    const external = value === undefined || value === null ? emptyValue : value;
    if (parse(textRef.current) !== external) {
      setText(formatExternal(external));
    }
  }, [value, emptyValue, parse]);

  const onChangeText = useCallback(
    (raw: string) => {
      let cleaned = raw.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, "");
      if (allowDecimal) {
        // keep only the first decimal point
        const i = cleaned.indexOf(".");
        if (i !== -1) cleaned = cleaned.slice(0, i + 1) + cleaned.slice(i + 1).replace(/\./g, "");
      }
      setText(cleaned);
      onChangeNumber(parse(cleaned));
    },
    [allowDecimal, onChangeNumber, parse]
  );

  return { text, onChangeText };
};

type SharedProps = Omit<TextInputProps, "value" | "onChangeText"> & NumericCore;

/** Drop-in for a bare <TextInput> holding a number. */
export const NumericTextInput = ({
  value,
  onChangeNumber,
  emptyValue,
  allowDecimal = true,
  keyboardType,
  ...rest
}: SharedProps) => {
  const { text, onChangeText } = useNumericText({ value, onChangeNumber, emptyValue, allowDecimal });
  return (
    <TextInput
      {...rest}
      value={text}
      onChangeText={onChangeText}
      keyboardType={keyboardType ?? (allowDecimal ? "decimal-pad" : "number-pad")}
    />
  );
};

type NumericInputFieldProps = SharedProps & {
  label: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;
};

/** Drop-in for an <InputField> holding a number. */
export const NumericInputField = ({
  value,
  onChangeNumber,
  emptyValue,
  allowDecimal = true,
  keyboardType,
  ...rest
}: NumericInputFieldProps) => {
  const { text, onChangeText } = useNumericText({ value, onChangeNumber, emptyValue, allowDecimal });
  return (
    <InputField
      {...rest}
      value={text}
      onChangeText={onChangeText}
      keyboardType={keyboardType ?? (allowDecimal ? "decimal-pad" : "number-pad")}
    />
  );
};
