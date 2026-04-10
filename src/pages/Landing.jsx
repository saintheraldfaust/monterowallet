import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useSettingsStore from '../stores/settingsStore'
import { HiOutlineArrowRight, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi2'

export default function Landing() {
  const navigate = useNavigate()
  const theme = useSettingsStore(s => s.theme) || 'dark' // Fallback if not initialized
  const toggleTheme = useSettingsStore(s => s.toggleTheme)

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-1000 ${
      theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-white text-slate-900'
    }`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Modern Top Nav for the website */}
      <header className={`absolute top-0 w-full px-6 py-6 flex justify-between items-center z-50`}>
        <div className="flex items-center gap-3">
          <img src="/urban.png" alt="Montero" className="w-8 h-8 rounded-lg object-cover " onError={(e) => e.target.src='/urbanwallet.png'} />
          <span className="font-bold text-xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>Montero</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(useSettingsStore.getState().initialized ? '/home' : '/welcome')}
            className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-tight transition-all active:scale-95 ${
              theme === 'dark' 
                ? 'bg-white text-black hover:bg-slate-200' 
                : 'bg-black text-white hover:bg-slate-800'
            }`}
          >
            Access Wallet
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-32 pb-24 md:pt-48 md:pb-32 flex flex-col items-center justify-center min-h-[90vh]">
        {/* Subtle Background Glows */}
        <div className={`absolute top-1/4 -left-[20%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-20 pointer-events-none ${
          theme === 'dark' ? 'bg-primary' : 'bg-primary'
        }`} />
        <div className={`absolute bottom-0 -right-[10%] w-[50%] h-[50%] rounded-full blur-[100px] opacity-10 pointer-events-none ${
          theme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'
        }`} />

        {/* Content */}
        <div className="z-10 flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-8xl font-black tracking-tighter leading-[1.05]"
          >
            Own your digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">wealth.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={`text-lg md:text-2xl font-medium max-w-2xl leading-relaxed ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            A secure, open-source wallet built for full privacy and ownership. By the Montero Foundation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <button 
              onClick={() => navigate(useSettingsStore.getState().initialized ? '/home' : '/welcome')}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary text-white text-lg font-bold hover:bg-primary-dark transition-all hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] active:scale-95"
            >
              Launch App
              <HiOutlineArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                alert("Extension coming soon to the Chrome Web Store!")
              }}
              className={`flex items-center justify-center px-8 py-4 rounded-full text-lg font-bold transition-all active:scale-95 ${
                theme === 'dark' 
                  ? 'bg-slate-900 border border-slate-800 text-white hover:bg-slate-800' 
                  : 'bg-slate-100 border border-slate-200 text-black hover:bg-slate-200'
              }`}
            >
              Install Extension
            </button>
          </motion.div>
        </div>

        {/* Product Image Reveal */}
        <motion.div 
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[340px] md:max-w-md mx-auto mt-24 z-20 perspective-1000"
        >
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10" style={{ transform: 'rotateX(5deg) scale(1.02)', transformOrigin: 'top center' }}>
            <img 
              src={theme === 'dark' ? '/appscreen_dark.png' : '/appscreen_light.png'} 
              alt="Montero App Interface" 
              className="w-full h-auto object-cover" 
            />
          </div>
        </motion.div>
      </section>
      
      {/* Footer minimal */}
      <footer className={`relative z-10 px-6 py-12 text-center text-sm font-medium ${
        theme === 'dark' ? 'text-slate-600' : 'text-slate-400'
      }`}>
        <p>© {new Date().getFullYear()} Montero Foundation. All rights reserved.</p>
        <p className="mt-2">Code is law. Not your keys, not your coins.</p>
      </footer>

      {/* Floating Theme Toggle */}
      <button 
        onClick={toggleTheme}
        className={`fixed bottom-6 right-6 p-3.5 rounded-full shadow-2xl transition-all active:scale-95 z-50 ${
          theme === 'dark' 
            ? 'bg-slate-800 text-white hover:bg-slate-700' 
            : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-100'
        }`}
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? <HiOutlineSun size={24} /> : <HiOutlineMoon size={24} />}
      </button>
    </div>
  )
}