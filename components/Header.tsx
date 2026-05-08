import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-[#2d2520] border-b border-[#3d3530] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl">☕</div>
            <h1 className="text-xl font-bold text-[#d4a574]">Moka Tracker</h1>
          </Link>
          <nav className="hidden md:flex gap-8">
            <Link href="/" className="text-[#f5f1ed] hover:text-[#d4a574] transition">
              Dashboard
            </Link>
            <Link href="/inventory" className="text-[#f5f1ed] hover:text-[#d4a574] transition">
              Inventory
            </Link>
            <Link href="/brew" className="text-[#f5f1ed] hover:text-[#d4a574] transition">
              New Brew
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
