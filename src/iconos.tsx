import React from 'react'

interface IconoProps {
  nombre: string
  tamaño?: number
  variante?: 'outline' | 'solid'
  className?: string
}

const Icono: React.FC<IconoProps> = ({ nombre, tamaño = 20, variante = 'outline', className = '' }) => {
  const props: React.SVGProps<SVGSVGElement> = {
    width: tamaño,
    height: tamaño,
    viewBox: '0 0 24 24',
    fill: variante === 'solid' ? 'currentColor' : 'none',
    stroke: variante === 'outline' ? 'currentColor' : 'none',
    strokeWidth: variante === 'outline' ? 1.5 : 0,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className
  }

  const paths: Record<string, React.ReactNode> = {
    // Navegación
    'chart-bar': <path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3" />,
    'list-bullet': <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
    'cube': <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.3 7l8.7 5 8.7-5M12 22V12" />,
    'cog-6-tooth': <><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></>,

    // Acciones
    'plus': <path d="M12 5v14M5 12h14" />,
    'plus-circle': <><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></>,
    'trash': <><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></>,
    'camera': <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" /><circle cx="12" cy="13" r="4" /></>,
    'arrow-up-tray': <><path d="M12 3v14" /><path d="m19 9-7 7-7-7" /><path d="M5 21h14" /></>,
    'arrow-down-tray': <><path d="M12 21V7" /><path d="m5 15 7 7 7-7" /><path d="M5 3h14" /></>,

    // Estados
    'check-circle': <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>,
    'exclamation-triangle': <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4" /><circle cx="12" cy="17" r="0.5" fill="currentColor" /></>,
    'star': <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
    'sparkles': <><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0Z" /><path d="M20 3v4M22 5h-4M4 17v2M5 18H3" /></>,
    'crown': <path d="M2 4l3 12h14l3-12-6 5-4-7-4 7-6-5z" />,

    // Finanzas
    'currency-dollar': <><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
    'scale': <><path d="M3 3v18h18" /><path d="M7 17V7l-4 4" /><path d="M17 17V7l4 4" /></>,
    'arrow-trending-up': <><path d="M23 6l-9.5 9.5-5-5L1 18" /><path d="M17 6h6v6" /></>,

    // Agro
    'leaf': <><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></>,
    'flask-conical': <><path d="M10 2v7.31a2 2 0 0 1-.37 1.19L4.59 18.27A2 2 0 0 0 6.31 21h11.38a2 2 0 0 0 1.72-2.73L14.37 10.5A2 2 0 0 1 14 9.31V2" /><path d="M10 2h4" /></>,
    'droplet': <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0Z" />,
    'beaker': <><path d="M4.5 3h15" /><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" /><path d="M6 14h12" /></>,

    // Social
    'face-smile': <><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9h.01" /><path d="M15 9h.01" /></>,
    'calendar-days': <><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></>,
    'clock-rotate-left': <><path d="M12 6v6l4 2" /><path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" /><path d="M7 5 3 9l4 4" /></>,
    'magnifying-glass': <><circle cx="11" cy="11" r="8" /><path d="m21 21-
