import { useState, useRef, useEffect } from 'react'
export const Dropdown = ({ trigger, children }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const handleClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="px-4 py-2 rounded border">{trigger}</button>
      {open && <div className="absolute top-full mt-1 bg-white dark:bg-gray-800 border rounded shadow-lg z-10">{children}</div>}
    </div>
  )
}
