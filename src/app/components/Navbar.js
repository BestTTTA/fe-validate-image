'use client'

import Link from 'next/link'
import Image from 'next/image'

const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg border-b border-gray-100">
      <div className="px-4">
        <div className="flex justify-between">
          <div className="flex space-x-7">
            <div>
              <Link 
                href="/" 
                className="flex items-center py-4 px-6"
              >
                  <Image 
                    src="/logo_wmi.png" 
                    alt="Face Icon" 
                    className="h-10 w-50 inline-block mr-2 object-contain align-middle" 
                    width={1920}
                    height={1080}
                  />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
