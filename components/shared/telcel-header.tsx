"use client"

import Image from "next/image";


export function TelcelHeader() {
  return (
    <header className="bg-[#1e62c1] pt-8 mb-[-14px] pb-[38px] flex justify-center shrink-0 w-full shadow-md">
        <img 
          src="/logo-telcel.svg"
          alt="Telcel Logo"
          width={20}
          height={10}
          className="h-auto w-auto"
        />
    </header>
  )
}