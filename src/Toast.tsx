import React from 'react'

const Toast: React.FC<{ mensaje: string }> = ({ mensaje }) => (
  <div className="toast" dangerouslySetInnerHTML={{ __html: mensaje }} />
)

export default Toast
