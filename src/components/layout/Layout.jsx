import { Toaster } from 'sonner'
import Header from './Header'
import Footer from './Footer'

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen flex flex-col">
      <Toaster />
      <Header />
      <main className="flex-1">
        <div className="container relative">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
} 