'use client';

import React, { useEffect, useState } from 'react';

interface PriceRangeSliderProps {
  minLimit?: number;
  maxLimit?: number;
  initialMin?: number;
  initialMax?: number;
  onChange: (min: number, max: number) => void;
}

export default function PriceRangeSlider({
  minLimit = 0,
  maxLimit = 250,
  initialMin = 0,
  initialMax = 250,
  onChange,
}: PriceRangeSliderProps) {
  const [minVal, setMinVal] = useState(initialMin);
  const [maxVal, setMaxVal] = useState(initialMax);

  // Sincronizar cambios en los límites
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), maxVal - 1);
    setMinVal(value);
    onChange(value, maxVal);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), minVal + 1);
    setMaxVal(value);
    onChange(minVal, value);
  };

  const handleMinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = Number(e.target.value);
    if (isNaN(value)) value = minLimit;
    if (value < minLimit) value = minLimit;
    if (value >= maxVal) value = maxVal - 1;
    setMinVal(value);
    onChange(value, maxVal);
  };

  const handleMaxInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = Number(e.target.value);
    if (isNaN(value)) value = maxLimit;
    if (value > maxLimit) value = maxLimit;
    if (value <= minVal) value = minVal + 1;
    setMaxVal(value);
    onChange(minVal, value);
  };

  // Calcular porcentaje para pintar la barra activa del slider
  const minPercent = ((minVal - minLimit) / (maxLimit - minLimit)) * 100;
  const maxPercent = ((maxVal - minLimit) / (maxLimit - minLimit)) * 100;

  return (
    <div className="space-y-4">
      {/* Visualización de la Barra de Rango Dual */}
      <div className="relative h-6 w-full flex items-center">
        {/* Track Gris Base */}
        <div className="absolute h-1.5 w-full bg-slate-800 rounded-lg" />
        
        {/* Track Verde Activo */}
        <div
          className="absolute h-1.5 bg-gradient-to-r from-violet-500 to-teal-400 rounded-lg"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
        />

        {/* Input Rango Mínimo (Transparente) */}
        <input
          type="range"
          min={minLimit}
          max={maxLimit}
          value={minVal}
          onChange={handleMinChange}
          className="absolute pointer-events-none appearance-none w-full h-1 bg-transparent outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition [&::-webkit-slider-thumb]:hover:scale-110"
        />

        {/* Input Rango Máximo (Transparente) */}
        <input
          type="range"
          min={minLimit}
          max={maxLimit}
          value={maxVal}
          onChange={handleMaxChange}
          className="absolute pointer-events-none appearance-none w-full h-1 bg-transparent outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition [&::-webkit-slider-thumb]:hover:scale-110"
        />
      </div>

      {/* Inputs Numéricos en los Extremos */}
      <div className="flex items-center justify-between gap-4">
        {/* Input Mínimo */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 text-xs">
            Min $
          </span>
          <input
            type="number"
            min={minLimit}
            max={maxLimit}
            value={minVal}
            onChange={handleMinInput}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pr-3 pl-11 text-sm text-white outline-none focus:border-teal-500"
          />
        </div>

        <span className="text-slate-600 text-xs uppercase font-bold">a</span>

        {/* Input Máximo */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 text-xs">
            Max $
          </span>
          <input
            type="number"
            min={minLimit}
            max={maxLimit}
            value={maxVal}
            onChange={handleMaxInput}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pr-3 pl-11 text-sm text-white outline-none focus:border-teal-500"
          />
        </div>
      </div>
    </div>
  );
}
