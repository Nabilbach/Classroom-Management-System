import React from 'react';

export function Card({ children, className }) {
  return <div className={`bg-white rounded-lg shadow ${className}`}>{children}</div>;
}

export function CardHeader({ children, className }) {
  return <div className={`p-4 border-b ${className}`}>{children}</div>;
}

export function CardTitle({ children, className }) {
  return <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>;
}

export function CardDescription({ children, className }) {
  return <p className={`text-gray-600 ${className}`}>{children}</p>;
}

export function CardContent({ children, className }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}


