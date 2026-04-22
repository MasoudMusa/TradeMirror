import Link from "next/link"
import { 
  BarChart2, 
  ArrowRight, 
  PlayCircle, 
  TrendingUp, 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  ShieldCheck, 
  CheckCircle, 
  Star,
  Twitter,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="bg-[#02040a] text-slate-300 font-sans selection:bg-emerald-500/20 selection:text-emerald-200 overflow-x-hidden">
      {/* Custom Styles moved to globals.css */}

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-[64px] flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
                <div className="flex items-center justify-center w-8 h-8 rounded bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 group-hover:border-emerald-500/30 transition-colors">
                    <BarChart2 className="text-emerald-500 w-4 h-4" />
                </div>
                <div className="flex flex-col">
                    <span className="font-medium text-white tracking-tight text-sm">TradeMirror</span>
                    <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Terminal</span>
                </div>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-400">
                <Link href="#features" className="hover:text-white transition-colors">Features</Link>
                <Link href="#methodology" className="hover:text-white transition-colors">Methodology</Link>
                <Link href="#reviews" className="hover:text-white transition-colors">Reviews</Link>
                <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <Link href="/auth/login" className="shimmer flex items-center gap-2 bg-[#1f2937] hover:bg-[#374151] border border-slate-700 text-white text-xs font-medium px-4 py-2 rounded-full transition-all">
                    <span>Get Started</span>
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-grid pointer-events-none"></div>
        {/* Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 text-center z-10">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm text-[11px] font-medium text-emerald-400 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                TradeMirror v2.0 is now live for funded traders
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 text-white">
                Turn Data Into <br className="hidden md:block" />
                <span className="text-gradient-emerald">Alpha</span> & <span className="text-gradient-primary">Consistency</span>
            </h1>

            {/* Subheadline */}
            <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 font-light">
                Institutional-grade journaling that seamlessly connects your execution, edge analytics, and mentorship in one secure ecosystem.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                <Link href="/dashboard" className="shimmer group h-10 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]">
                    Start Journaling
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="#demo" className="h-10 px-6 bg-transparent hover:bg-white/5 border border-white/10 text-slate-300 hover:text-white rounded-full font-medium text-sm transition-all flex items-center justify-center gap-2">
                    <PlayCircle className="w-5 h-5" />
                    Watch Demo
                </Link>
            </div>

            {/* UI Mockup */}
            <div className="relative max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                {/* Glow behind mockup */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl blur opacity-20"></div>
                
                <div className="relative rounded-xl bg-[#0B1120] border border-white/10 shadow-2xl overflow-hidden">
                    {/* Fake Browser Header */}
                    <div className="h-9 border-b border-white/5 bg-[#02040a] flex items-center px-4 gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
                        </div>
                    </div>
                    
                    {/* App Interface */}
                    <div className="grid grid-cols-12 h-[450px] bg-[#0B1120] text-left">
                        {/* Sidebar */}
                        <div className="hidden sm:block col-span-2 border-r border-white/5 bg-[#02040a]/50 p-4">
                            <div className="space-y-4">
                                <div className="h-6 w-20 bg-slate-800/50 rounded-md"></div>
                                <div className="space-y-1 mt-6">
                                    <div className="h-8 w-full bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center px-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2"></div>
                                        <div className="h-2 w-16 bg-emerald-500/20 rounded"></div>
                                    </div>
                                    <div className="h-8 w-full hover:bg-white/5 rounded-md transition-colors"></div>
                                    <div className="h-8 w-full hover:bg-white/5 rounded-md transition-colors"></div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Dashboard */}
                        <div className="col-span-12 sm:col-span-10 p-6 sm:p-8 flex flex-col">
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">Total Equity</div>
                                    <div className="text-3xl font-medium text-white tracking-tight">$104,230.50</div>
                                </div>
                                <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                                    <TrendingUp className="text-emerald-500 w-3 h-3" />
                                    <span className="text-emerald-400 text-xs font-medium">+12.4%</span>
                                </div>
                            </div>
                            
                            {/* Graph Area */}
                            <div className="relative flex-1 w-full border border-white/5 rounded-lg bg-[#02040a]/30 p-4 overflow-hidden group">
                                {/* Grid Lines */}
                                <div className="absolute inset-0 grid grid-rows-4 pointer-events-none">
                                    <div className="border-b border-white/5 w-full h-full"></div>
                                    <div className="border-b border-white/5 w-full h-full"></div>
                                    <div className="border-b border-white/5 w-full h-full"></div>
                                </div>
                                
                                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="gradientChart" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"></stop>
                                            <stop offset="100%" stopColor="#10b981" stopOpacity="0"></stop>
                                        </linearGradient>
                                    </defs>
                                    <path d="M0,200 C40,190 80,160 120,170 C160,180 200,140 240,110 C280,80 320,100 360,70 C400,40 440,60 480,20 L480,250 L0,250 Z" fill="url(#gradientChart)"></path>
                                    <path d="M0,200 C40,190 80,160 120,170 C160,180 200,140 240,110 C280,80 320,100 360,70 C400,40 440,60 480,20" fill="none" stroke="#10b981" strokeWidth="2" className="animate-draw"></path>
                                    
                                    {/* Interactive Point */}
                                    <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ transform: "translate(360px, 70px)" }}>
                                        <circle cx="0" cy="0" r="4" fill="#02040a" stroke="#10b981" strokeWidth="2"></circle>
                                        <foreignObject x="-60" y="-55" width="120" height="50">
                                            <div className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-center shadow-lg">
                                                <div className="text-[10px] text-slate-400">Trade #84</div>
                                                <div className="text-xs font-bold text-emerald-400">+$1,240</div>
                                            </div>
                                        </foreignObject>
                                    </g>
                                </svg>
                            </div>
                            
                            {/* Bottom metrics */}
                            <div className="grid grid-cols-3 gap-4 mt-6">
                                <div className="bg-white/5 rounded p-3">
                                    <div className="text-[10px] text-slate-500 uppercase">Win Rate</div>
                                    <div className="text-sm text-white font-medium mt-1">64.2%</div>
                                </div>
                                <div className="bg-white/5 rounded p-3">
                                    <div className="text-[10px] text-slate-500 uppercase">Profit Factor</div>
                                    <div className="text-sm text-white font-medium mt-1">2.41</div>
                                </div>
                                <div className="bg-white/5 rounded p-3">
                                    <div className="text-[10px] text-slate-500 uppercase">Avg R:R</div>
                                    <div className="text-sm text-white font-medium mt-1">1:2.8</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Brands/Trust */}
            <div className="mt-16 pt-8 border-t border-white/5">
                <p className="text-xs text-slate-600 font-medium uppercase tracking-widest mb-6">Trusted by traders from</p>
                <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-40 grayscale">
                    <span className="text-lg font-semibold tracking-tighter">FTMO</span>
                    <span className="text-lg font-semibold tracking-tighter">Apex</span>
                    <span className="text-lg font-semibold tracking-tighter">TopStep</span>
                    <span className="text-lg font-semibold tracking-tighter">FundingPips</span>
                    <span className="text-lg font-semibold tracking-tighter">MyFundedFX</span>
                </div>
            </div>
        </div>
      </main>

      {/* Bento Grid Features */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16 md:text-center max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-white mb-4">Everything needed to <span className="text-emerald-400">find your edge</span></h2>
                <p className="text-slate-400 font-light">Stop logging raw numbers. Start capturing context, psychology, and execution quality in a system built for scale.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Large Card */}
                <div className="md:col-span-2 bg-[#0B1120] border border-white/5 rounded-2xl p-8 relative overflow-hidden card-glow group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                    <div className="relative z-10">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20">
                            <LayoutDashboard className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">Advanced Analytics Engine</h3>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-md">Visualize your Cumulative R, expectancy, and drawdown in real-time. Our engine normalizes your data to show you the truth behind your P&L.</p>
                        
                        {/* Mini Chart Viz */}
                        <div className="mt-8 h-32 w-full flex items-end gap-1 opacity-60">
                            <div className="w-full bg-slate-800 rounded-t-sm h-[40%]"></div>
                            <div className="w-full bg-slate-800 rounded-t-sm h-[60%]"></div>
                            <div className="w-full bg-emerald-900 rounded-t-sm h-[80%]"></div>
                            <div className="w-full bg-slate-800 rounded-t-sm h-[50%]"></div>
                            <div className="w-full bg-emerald-500 rounded-t-sm h-[90%] shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                            <div className="w-full bg-slate-800 rounded-t-sm h-[70%]"></div>
                        </div>
                    </div>
                </div>

                {/* Tall Card */}
                <div className="bg-[#0B1120] border border-white/5 rounded-2xl p-8 relative overflow-hidden card-glow md:row-span-2 flex flex-col">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
                        <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">Community Sync</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-8">Access premium features automatically based on your Discord roles. Share setups with one click.</p>
                    
                    <div className="mt-auto space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded bg-white/5 border border-white/5">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs text-slate-300">Role: Funded Trader</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded bg-white/5 border border-white/5 opacity-50">
                            <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                            <span className="text-xs text-slate-300">Role: Analyst</span>
                        </div>
                    </div>
                </div>

                {/* Small Card 1 */}
                <div className="bg-[#0B1120] border border-white/5 rounded-2xl p-8 relative overflow-hidden card-glow">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 mb-6 border border-orange-500/20">
                        <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Session Tagging</h3>
                    <p className="text-sm text-slate-400">Log entries, SL, TP, and outcomes with zero friction. Optimized for speed.</p>
                </div>

                {/* Small Card 2 */}
                <div className="bg-[#0B1120] border border-white/5 rounded-2xl p-8 relative overflow-hidden card-glow">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 border border-blue-500/20">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Secure RLS</h3>
                    <p className="text-sm text-slate-400">Powered by Supabase Row-Level Security. Your edge remains 100% private.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#02040a] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                <div className="col-span-2 md:col-span-1">
                    <Link href="#" className="flex items-center gap-2 mb-4">
                        <div className="flex items-center justify-center w-6 h-6 rounded bg-slate-800 border border-slate-700">
                            <BarChart2 className="text-emerald-500 w-3 h-3" />
                        </div>
                        <span className="font-medium text-white tracking-tight text-sm">TradeMirror</span>
                    </Link>
                    <p className="text-sm text-slate-500 max-w-xs">Data-driven tools for the modern funded trader. Built for precision and consistency.</p>
                </div>
                <div>
                    <h4 className="text-white font-medium mb-4 text-sm">Product</h4>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li><Link href="#" className="hover:text-emerald-400 transition-colors">Changelog</Link></li>
                        <li><Link href="#" className="hover:text-emerald-400 transition-colors">Pricing</Link></li>
                        <li><Link href="#" className="hover:text-emerald-400 transition-colors">Documentation</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-medium mb-4 text-sm">Legal</h4>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li><Link href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                        <li><Link href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-medium mb-4 text-sm">Social</h4>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li><Link href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><Twitter className="w-3 h-3" /> Twitter</Link></li>
                        <li><Link href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><MessageSquare className="w-3 h-3" /> Discord</Link></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs text-slate-600">© 2024 TradeMirror. All rights reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  )
}
