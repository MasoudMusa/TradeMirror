"use client"

// Custome implementation of useToast to mimic Shadcn/Radix without dependency issues
// Implements a simple subscriber pattern

import * as React from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000

type ToastProps = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

type State = {
  toasts: ToastProps[]
}

function dispatch(action: any) {
  switch (action.type) {
    case "ADD_TOAST":
      memoryState = {
        ...memoryState,
        toasts: [action.toast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
      }
      break
    case "DISMISS_TOAST":
      const { toastId } = action
      if (toastId) {
        memoryState = {
          ...memoryState,
          toasts: memoryState.toasts.filter((t) => t.id !== toastId),
        }
      } else {
        memoryState = { ...memoryState, toasts: [] }
      }
      break
  }

  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast: ({ ...props }: Omit<ToastProps, "id">) => {
      const id = genId()
      const update = { ...props, id }
      dispatch({ type: "ADD_TOAST", toast: update })
      
      return {
        id: id,
        dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
      }
    },
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}
