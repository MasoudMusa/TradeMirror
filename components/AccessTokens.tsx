"use client"

import { useState, useEffect } from "react"
import { Copy, Key, Plus, Trash2, Info, Loader2, CheckCircle2, Terminal, Unlink, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { unbindAccount, generateToken, getTokens } from "@/lib/api"

export default function AccessTokens() {
  const [tokens, setTokens] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tokenName, setTokenName] = useState("")
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false })
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [revealedTokens, setRevealedTokens] = useState<Set<string>>(new Set())

  const fetchTokens = async () => {
    const data = await getTokens()
    if (data) setTokens(data)
  }

  useEffect(() => {
    fetchTokens()
  }, [])

  const showToast = (message: string) => {
    setToast({ message, show: true })
    setTimeout(() => setToast({ message: "", show: false }), 3000)
  }

  const handleGenerateValues = async () => {
    setLoading(true)
    const token = await generateToken(tokenName || undefined)
    if (token) {
      navigator.clipboard.writeText(token)
      showToast("Token copied to keyboard!")
      setDialogOpen(false)
      setTokenName("")
      fetchTokens()
    }
    setLoading(false)
  }

  const handleUnbind = async (accountId: string) => {
    try {
      setLoading(true)
      await unbindAccount(accountId)
      showToast("Terminal unbinded successfully!")
      fetchTokens()
    } catch (error: any) {
      showToast(error.message || "Failed to unbind terminal")
    } finally {
      setLoading(false)
    }
  }

  const toggleTokenReveal = (tokenId: string) => {
    const newRevealed = new Set(revealedTokens)
    if (newRevealed.has(tokenId)) {
      newRevealed.delete(tokenId)
    } else {
      newRevealed.add(tokenId)
    }
    setRevealedTokens(newRevealed)
  }

  return (
    <>
      {/* Custom Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/50 backdrop-blur-md">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-bold tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}

      <Card className="bg-[#0B1120]/50 backdrop-blur-md border-white/5 shadow-2xl overflow-hidden transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-slate-500 hover:text-white"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <div className="space-y-0.5">
              <CardTitle className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">Terminal Access Tokens</CardTitle>
              <CardDescription className="text-[10px] text-slate-500">Active MT5 Terminal Sessions</CardDescription>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 font-bold">
                <Plus className="mr-2 h-4 w-4" />
                New Token
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0B1120] border-white/10 text-white shadow-2xl">
              <DialogHeader>
                <DialogTitle>Generate Terminal Token</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Give your token a name to identify which terminal it's for.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Token Name</label>
                  <Input
                    placeholder="e.g. My FTMO Account"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-11"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-slate-400 hover:text-white">
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerateValues} 
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Token"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className={`space-y-6 transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
          <div className="space-y-3">
            {tokens.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl opacity-30">
                <Terminal className="h-10 w-10 mb-3" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">No Active Terminal Tokens Found</span>
              </div>
            ) : (
              tokens.map((token, i) => (
                <div key={i} className="flex flex-col gap-3 p-4 bg-slate-800/20 border border-white/5 rounded-xl hover:border-white/10 transition-all group">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300">
                        <Key className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white tracking-tight">{token.name || "Untitled Token"}</div>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] text-slate-500 font-medium font-mono uppercase tracking-tighter">
                              {token.mt5_account_id ? `MT5: ${token.mt5_account_id}` : "WAITING FOR SYNC"}
                           </span>
                           <Separator orientation="vertical" className="h-2 bg-white/10" />
                           <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                              Created {new Date(token.created_at).toLocaleDateString()}
                           </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                    {token.mt5_account_id && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-orange-400 hover:bg-orange-400/10 rounded-lg transition-all"
                              onClick={() => handleUnbind(token.id)}
                              disabled={loading}
                            >
                              <Unlink className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 border-white/10 text-[10px] font-bold">
                            Unbind Terminal
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                      <Badge variant="outline" className={`text-[9px] font-black border-0 px-2 py-0.5 ${
                          token.last_heartbeat_at 
                          ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20" 
                          : "bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/20"
                      }`}>
                          {token.last_heartbeat_at ? "ACTIVE" : "PENDING"}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Token Value Display with masking and copy */}
                  <div className="mt-1 flex items-center justify-between bg-black/40 rounded-lg p-2 border border-white/5 group-hover:border-emerald-500/10 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-6 w-6 text-slate-500 hover:text-white shrink-0"
                         onClick={() => toggleTokenReveal(token.id)}
                       >
                         {revealedTokens.has(token.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                       </Button>
                       <span className={`text-[10px] font-mono tracking-tighter truncate ${revealedTokens.has(token.id) ? 'text-emerald-400' : 'text-slate-600'}`}>
                          {revealedTokens.has(token.id) ? token.token : "tmk_" + "•".repeat(32)}
                       </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-slate-500 hover:text-emerald-400 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(token.token);
                        showToast("Token copied!");
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <Alert className="bg-blue-500/5 border-blue-500/10 text-blue-400">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-[11px] leading-relaxed italic text-slate-400">
              Tokens are required for the EA to sync data. Paste the token in the <span className="text-white font-bold">Access Token</span> input field of the TradeMirror EA settings in MT5.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </>
  )
}
