"use client"

import Image from "next/image";


export function TelcelHeader() {
  return (
    <header className="bg-[#1e62c1] pt-4 mb-[-14px] pb-[28px] flex justify-center shrink-0 w-full shadow-md">
      <img
        src="/logo-telcel.svg"
        alt="Telcel Logo"
        className="w-14 h-auto" // Cambia el 24 por el tamaño que necesites (w-20, w-16, etc.)
      />
    </header>
  )
}