"use client"

import Image from "next/image";


export function TelcelHeader() {
  return (
    <header className="bg-[#1C42E8] pt-8 mb-[-14px] min-[960px]:pt-12 min-[960px]:pb-12 pb-[28px] flex justify-center shrink-0 w-full shadow-md">
      <img
        src="/logo-coppel.svg"
        alt="Coppel Logo"
        className="hidden w-14 min-[960px]:w-[140px] h-auto transition-all duration-300"
      />
    </header>
  )
}