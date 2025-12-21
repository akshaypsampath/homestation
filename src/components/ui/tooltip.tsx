import { Tooltip as ChakraTooltip } from "@chakra-ui/react"
import * as React from "react"

export interface TooltipProps {
  showArrow?: boolean
  portalled?: boolean
  portalRef?: React.RefObject<HTMLElement | null>
  content: React.ReactNode
  contentProps?: React.HTMLAttributes<HTMLDivElement>
  disabled?: boolean
  children: React.ReactNode
  placement?: "top" | "bottom" | "left" | "right"
  isOpen?: boolean
  defaultIsOpen?: boolean
  closeOnClick?: boolean
  closeOnEsc?: boolean
  closeDelay?: number
  openDelay?: number
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  function Tooltip(props, _ref) {
    const {
      showArrow,
      children,
      disabled,
      portalled: _portalled = true,
      content,
      contentProps: _contentProps,
      portalRef: _portalRef,
      ...rest
    } = props

    if (disabled) return <>{children}</>

    // Chakra UI v2 Tooltip uses 'label' prop instead of compound components
    // Convert ReactNode to string for label prop
    const label = typeof content === "string" ? content : String(content)
    
    return (
      <ChakraTooltip
        label={label}
        hasArrow={showArrow}
        {...rest}
      >
        {children}
      </ChakraTooltip>
    )
  },
)
