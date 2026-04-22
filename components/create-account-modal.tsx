"use client"

import * as React from "react"
import { Copy, Plus, Loader2, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface CreateAccountModalProps {
  children?: React.ReactNode
  onAccountCreated?: () => void
}

import { useAccount } from "@/context/account-context"

export function CreateAccountModal({ children, onAccountCreated }: CreateAccountModalProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [token, setToken] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const { toast } = useToast()
  const { setAccountId } = useAccount()
  const supabase = createClient()

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!open) {
      setToken(null)
      setCopied(false)
    }
  }, [open])

  const handleGenerate = async () => {
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to create an account",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const res = await fetch("/api/accounts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({}), // No name required
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account")
      }

      setToken(data.account.token)
      setAccountId(data.account.id) // Automatically switch to the new account
      
      toast({
        title: "Account Created",
        description: "Token generated successfully. Active account switched.",
      })
      if (onAccountCreated) onAccountCreated()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Token copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Connect New Account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect New Account</DialogTitle>
          <DialogDescription>
            Generate a new access token to connect your MetaTrader 5 terminal.
          </DialogDescription>
        </DialogHeader>

        {!token ? (
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Click <strong>Generate Token</strong> to create a new connection key. You will need to paste this key into your EA settings.
            </p>
            <DialogFooter className="sm:justify-end">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Token
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mt-4 rounded-md bg-muted p-4">
              <div className="mb-2 text-sm font-medium">Access Token</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-background p-2 font-mono text-xs break-all">
                  {token}
                </code>
                <Button size="icon" variant="ghost" onClick={copyToken}>
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Paste this into the <strong>Access Token</strong> field in your TradeMirror EA settings.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)} className="w-full">
                I've Copied It
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
