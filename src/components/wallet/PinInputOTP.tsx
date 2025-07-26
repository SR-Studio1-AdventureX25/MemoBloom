import { useId } from "react"
import { OTPInput, type SlotProps } from "input-otp"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface PinInputOTPProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  error?: boolean
  label?: string
  placeholder?: string
}

export default function PinInputOTP({
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  label = "PIN码",
  placeholder = "请输入6位PIN码"
}: PinInputOTPProps) {
  const id = useId()

  const handleChange = (newValue: string) => {
    onChange(newValue)
    if (newValue.length === 6 && onComplete) {
      onComplete(newValue)
    }
  }

  return (
    <div className="space-y-3">
      {label && (
        <Label htmlFor={id} className="text-white text-sm font-medium">
          {label}
        </Label>
      )}
      
      <OTPInput
        id={id}
        value={value}
        onChange={handleChange}
        maxLength={6}
        disabled={disabled}
        containerClassName={cn(
          "flex items-center justify-center gap-2 has-disabled:opacity-50",
          error && "opacity-80"
        )}
        render={({ slots }) => (
          <div className="flex gap-2">
            {slots.map((slot, idx) => (
              <Slot key={idx} {...slot} error={error} />
            ))}
          </div>
        )}
      />
      
      {!value && placeholder && (
        <div className="text-center text-white/50 text-sm">
          {placeholder}
        </div>
      )}
      
      {value && !disabled && (
        <div className="flex justify-center">
          <button
            onClick={() => onChange('')}
            className="text-white/60 hover:text-white text-sm transition-colors duration-200"
          >
            清除
          </button>
        </div>
      )}
    </div>
  )
}

function Slot(props: SlotProps & { error?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex size-12 items-center justify-center border-2 rounded-lg font-bold text-xl transition-all duration-200 backdrop-blur-sm",
        {
          "border-white/30 bg-white/10 text-white focus-within:border-purple-400 focus-within:bg-white/20": !props.error,
          "border-red-400 bg-red-50/10 text-red-400": props.error,
          "border-purple-400 bg-white/20 ring-2 ring-purple-400/50": props.isActive && !props.error,
          "border-red-400 bg-red-50/20 ring-2 ring-red-400/50": props.isActive && props.error
        }
      )}
    >
      {props.char !== null && <div>{props.char}</div>}
      {props.hasFakeCaret && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-px h-6 bg-white animate-pulse" />
        </div>
      )}
    </div>
  )
}
