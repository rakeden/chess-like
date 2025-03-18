import { Toaster } from 'sonner'
import Header from './Header'
import Footer from './Footer'

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen flex flex-col">
      <Toaster />
      <Header />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  )
} 