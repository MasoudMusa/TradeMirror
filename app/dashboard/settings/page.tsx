"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Bell, Shield, Wallet, Smartphone, Globe, Eye, Save } from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  
  const handleSave = async () => {
    setLoading(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Settings</h2>
          <p className="text-slate-400">Manage your account preferences and application settings.</p>
        </div>
        <Button onClick={handleSave} disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          {loading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Account Settings */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-400" />
              <CardTitle className="text-white">Account & Security</CardTitle>
            </div>
            <CardDescription>Manage your profile and security preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-slate-200">Email Address</Label>
                <Input id="email" value="james@example.com" disabled className="bg-slate-950 border-slate-800 text-slate-400" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-200">Two-Factor Authentication</Label>
                  <p className="text-sm text-slate-400">Add an extra layer of security to your account.</p>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-white">Display & Appearance</CardTitle>
            </div>
            <CardDescription>Customize how the dashboard looks and feels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-slate-200">Compact Mode</Label>
                <p className="text-sm text-slate-400">Reduce spacing and font size for high density.</p>
              </div>
              <Switch />
            </div>
            <Separator className="bg-slate-800" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-slate-200">Show P&L in Pips</Label>
                <p className="text-sm text-slate-400">Display profit/loss in pips instead of currency.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-slate-800" />
            <div className="grid gap-2">
              <Label className="text-slate-200">Timezone</Label>
              <Select defaultValue="utc">
                <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="utc">UTC (Coordinated Universal Time)</SelectItem>
                  <SelectItem value="est">EST (Eastern Standard Time)</SelectItem>
                  <SelectItem value="pst">PST (Pacific Standard Time)</SelectItem>
                  <SelectItem value="lon">London (GMT/BST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-400" />
              <CardTitle className="text-white">Notifications</CardTitle>
            </div>
            <CardDescription>Configure how you receive alerts and updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-slate-200">Trade Execution Alerts</Label>
                <p className="text-sm text-slate-400">Receive notifications when trades open or close.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-slate-800" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-slate-200">Daily Digest</Label>
                <p className="text-sm text-slate-400">Receive a daily summary of your account performance.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Trading Settings */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-white">Trading Preferences</CardTitle>
            </div>
            <CardDescription>Default settings for trade calculations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label className="text-slate-200">Default Risk %</Label>
              <Input type="number" defaultValue="1.0" className="bg-slate-950 border-slate-800 text-white" />
              <p className="text-xs text-slate-500">Default risk percentage per trade.</p>
            </div>
            <Separator className="bg-slate-800" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-slate-200">Auto-Calculate Lot Size</Label>
                <p className="text-sm text-slate-400">Automatically calculate lot size based on risk.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
