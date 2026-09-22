import React from 'react';
export default function ErrorMessage({ message }) { return message ? <div className="alert error">{message}</div> : null; }
