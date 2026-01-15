import React, { useState } from 'react';
import { Calculator as CalcIcon } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SYMBOLS = {
  'GC': { tickValue: 10, minLot: 1, maxLot: 100, step: 1, type: 'futures', name: 'Gold Futures' },
  'MGC': { tickValue: 1, minLot: 1, maxLot: 100, step: 1, type: 'futures', name: 'Micro Gold Futures' },
  'NQ': { tickValue: 5, minLot: 1, maxLot: 100, step: 1, type: 'futures', name: 'E-mini Nasdaq Futures' },
  'MNQ': { tickValue: 0.5, minLot: 1, maxLot: 100, step: 1, type: 'futures', name: 'Micro E-mini Nasdaq' },
  'YM': { tickValue: 5, minLot: 1, maxLot: 100, step: 1, type: 'futures', name: 'E-mini Dow Futures' },
  'MYM': { tickValue: 0.5, minLot: 1, maxLot: 100, step: 1, type: 'futures', name: 'Micro E-mini Dow' },
  'XAUUSD': { pipValue: 0.01, minLot: 0.01, maxLot: 100, step: 0.01, type: 'forex', name: 'Gold Spot Forex' },
  'XAGUSD': { pipValue: 0.5, minLot: 0.01, maxLot: 100, step: 0.01, type: 'forex', name: 'Silver Spot Forex' },
  'NAS100': { pipValue: 1, minLot: 0.01, maxLot: 100, step: 0.01, type: 'forex', name: 'Nasdaq 100 CFD' },
  'BTC': { pipValue: 0.01, minLot: 0.01, maxLot: 100, step: 0.01, type: 'crypto', name: 'Bitcoin' },
};

export default function Calculator() {
  const [symbol, setSymbol] = useState('GC');
  const [lotSize, setLotSize] = useState(1);
  const [points, setPoints] = useState('');
  const [dollars, setDollars] = useState('');

  const symbolData = SYMBOLS[symbol];

  const calculatePnL = (pts, lots) => {
    if (!pts || isNaN(pts) || !lots || isNaN(lots)) return 0;
    
    const pointsNum = parseFloat(pts);
    const lotsNum = parseFloat(lots);
    
    if (symbolData.type === 'futures') {
      return pointsNum * symbolData.tickValue * lotsNum;
    } else if (symbolData.type === 'forex') {
      if (symbol === 'XAUUSD') {
        return pointsNum * lotsNum * 0.01;
      } else if (symbol === 'XAGUSD') {
        return pointsNum * lotsNum * symbolData.pipValue;
      } else if (symbol === 'NAS100') {
        return pointsNum * lotsNum * symbolData.pipValue;
      }
    } else if (symbolData.type === 'crypto') {
      return pointsNum * lotsNum * symbolData.pipValue;
    }
    return 0;
  };

  const calculateFromPoints = (pts) => {
    if (!pts || isNaN(pts)) {
      setDollars('');
      return;
    }
    const dollarsVal = calculatePnL(pts, lotSize);
    setDollars(dollarsVal.toFixed(2));
  };

  const calculateFromDollars = (d) => {
    if (!d || isNaN(d)) {
      setPoints('');
      return;
    }
    const dollarsNum = parseFloat(d);
    let pointsVal = 0;
    
    if (symbolData.type === 'futures') {
      pointsVal = dollarsNum / (symbolData.tickValue * lotSize);
    } else if (symbolData.type === 'forex') {
      if (symbol === 'XAUUSD') {
        pointsVal = dollarsNum / (lotSize * 0.01);
      } else if (symbol === 'XAGUSD') {
        pointsVal = dollarsNum / (lotSize * symbolData.pipValue);
      } else if (symbol === 'NAS100') {
        pointsVal = dollarsNum / (lotSize * symbolData.pipValue);
      }
    } else if (symbolData.type === 'crypto') {
      pointsVal = dollarsNum / (lotSize * symbolData.pipValue);
    }
    
    setPoints(pointsVal.toFixed(2));
  };

  const handlePointsChange = (value) => {
    setPoints(value);
    calculateFromPoints(value);
  };

  const handleDollarsChange = (value) => {
    setDollars(value);
    calculateFromDollars(value);
  };

  const handleLotSizeChange = (value) => {
    const val = parseFloat(value);
    if (val >= symbolData.minLot && val <= symbolData.maxLot) {
      setLotSize(val);
      if (points) calculateFromPoints(points);
    }
  };

  const handleSymbolChange = (value) => {
    setSymbol(value);
    const newSymbolData = SYMBOLS[value];
    setLotSize(newSymbolData.minLot);
    setPoints('');
    setDollars('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20">
          <CalcIcon className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Trading Calculator</h1>
          <p className="text-gray-400">Convert between points, ticks, and dollars</p>
        </div>
      </div>

      {/* Calculator */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6 space-y-6">
        {/* Symbol & Contracts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-400">Symbol</Label>
            <Select value={symbol} onValueChange={handleSymbolChange}>
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {Object.entries(SYMBOLS).map(([key, data]) => (
                  <SelectItem key={key} value={key}>{key} - {data.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400">Lot Size</Label>
            <Input
              type="number"
              value={lotSize}
              onChange={(e) => handleLotSizeChange(e.target.value)}
              className="bg-gray-800 border-gray-700"
              min={symbolData.minLot}
              max={symbolData.maxLot}
              step={symbolData.step}
            />
            <p className="text-xs text-gray-500">Range: {symbolData.minLot} - {symbolData.maxLot}</p>
          </div>
        </div>

        {/* Calculations */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-400">Points / Pips</Label>
            <Input
              type="number"
              value={points}
              onChange={(e) => handlePointsChange(e.target.value)}
              className="bg-gray-800 border-gray-700 text-xl h-14"
              placeholder="Enter points or pips"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-400">Dollar P&L ($)</Label>
            <Input
              type="number"
              value={dollars}
              onChange={(e) => handleDollarsChange(e.target.value)}
              className="bg-gray-800 border-gray-700 text-xl h-14 font-bold text-emerald-400"
              placeholder="Enter dollar amount"
            />
          </div>
        </div>

        {/* Symbol Info */}
        <div className="p-4 rounded-xl bg-gray-700/30 border border-gray-600/30">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Symbol Information: {symbol}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Type:</span>
              <span className="text-white font-semibold capitalize">{symbolData.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{symbolData.type === 'futures' ? 'Tick Value' : 'Pip Value'}:</span>
              <span className="text-white font-semibold">${symbolData.tickValue || symbolData.pipValue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Min Lot:</span>
              <span className="text-white font-semibold">{symbolData.minLot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Max Lot:</span>
              <span className="text-white font-semibold">{symbolData.maxLot}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Reference</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 px-3 text-gray-400">Symbol</th>
                <th className="text-left py-2 px-3 text-gray-400">Name</th>
                <th className="text-left py-2 px-3 text-gray-400">Type</th>
                <th className="text-left py-2 px-3 text-gray-400">Value</th>
                <th className="text-left py-2 px-3 text-gray-400">Lot Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {Object.entries(SYMBOLS).map(([key, data]) => (
                <tr 
                  key={key} 
                  className="hover:bg-gray-800/30 cursor-pointer transition-colors"
                  onClick={() => handleSymbolChange(key)}
                >
                  <td className="py-2 px-3 font-semibold text-cyan-400">{key}</td>
                  <td className="py-2 px-3 text-gray-300">{data.name}</td>
                  <td className="py-2 px-3 text-gray-400 capitalize">{data.type}</td>
                  <td className="py-2 px-3 text-white">${data.tickValue || data.pipValue}</td>
                  <td className="py-2 px-3 text-white">{data.minLot} - {data.maxLot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}