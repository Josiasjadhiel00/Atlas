import React, { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Compass, MapPin, RefreshCw } from 'lucide-react';

interface WeatherData {
  city: string;
  temp: number;
  feelsLike: number;
  condition: string;
  code: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  lat: number;
  lon: number;
}

export const WeatherTacticalRadar: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData>({
    city: 'ESTACIÓN BASE',
    temp: 22,
    feelsLike: 21.5,
    condition: 'Despejado / Nominal',
    code: 0,
    humidity: 55,
    windSpeed: 12,
    windDirection: 180,
    pressure: 1014,
    lat: 40.4168,
    lon: -3.7038
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('00:00');

  const fetchWeather = async (latitude = 40.4168, longitude = -3.7038, cityName = 'ESTACIÓN BASE') => {
    setLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.current) {
        const cur = data.current;
        let cond = 'Despejado / Nominal';
        const code = cur.weather_code || 0;
        if (code === 1 || code === 2 || code === 3) cond = 'Parcialmente Nublado';
        else if (code >= 45 && code <= 48) cond = 'Niebla / Visibilidad Baja';
        else if (code >= 51 && code <= 67) cond = 'Precipitaciones / Lluvia';
        else if (code >= 71 && code <= 77) cond = 'Nieve / Bajas Temp.';
        else if (code >= 80 && code <= 82) cond = 'Chubascos Intensos';
        else if (code >= 95) cond = 'Tormenta Eléctrica';

        setWeather({
          city: cityName,
          temp: Math.round(cur.temperature_2m),
          feelsLike: Math.round(cur.apparent_temperature),
          condition: cond,
          code: code,
          humidity: cur.relative_humidity_2m || 50,
          windSpeed: Math.round(cur.wind_speed_10m || 10),
          windDirection: cur.wind_direction_10m || 0,
          pressure: Math.round(cur.surface_pressure || 1013),
          lat: latitude,
          lon: longitude
        });

        const now = new Date();
        setLastUpdate(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Weather fetch fallback error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Attempt browser geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude, 'UBICACIÓN GPS');
        },
        () => {
          fetchWeather(40.4168, -3.7038, 'MADRID // SECTOR CENTRAL');
        },
        { timeout: 5000 }
      );
    } else {
      fetchWeather(40.4168, -3.7038, 'MADRID // SECTOR CENTRAL');
    }
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code >= 51 && code <= 82) return <CloudRain className="w-5 h-5 text-[#00f2ff]" />;
    if (code >= 1 && code <= 3) return <Cloud className="w-5 h-5 text-cyan-300" />;
    return <Sun className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className="border border-[#00f2ff44] bg-black/80 rounded-sm p-2.5 space-y-2 select-none relative overflow-hidden">
      {/* Sci-Fi Corner Brackets */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00f2ff]" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00f2ff]" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#00f2ff33] pb-1">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#00f2ff]">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span className="truncate">{weather.city}</span>
        </div>
        <button
          onClick={() => fetchWeather(weather.lat, weather.lon, weather.city)}
          className="text-[9px] font-mono text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
          title="Actualizar meteorología"
        >
          <RefreshCw className={`w-2.5 h-2.5 ${loading ? 'animate-spin text-[#00f2ff]' : ''}`} />
          <span>{lastUpdate}</span>
        </button>
      </div>

      {/* Main Temperature Display */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {getWeatherIcon(weather.code)}
          <div>
            <div className="text-2xl font-mono font-black text-white tracking-wider drop-shadow-[0_0_8px_#00f2ff]">
              {weather.temp}°C
            </div>
            <div className="text-[9px] font-mono text-gray-400">
              Sensación: <span className="text-[#00f2ff]">{weather.feelsLike}°C</span>
            </div>
          </div>
        </div>

        <div className="text-right font-mono">
          <div className="text-[10px] text-cyan-300 font-bold max-w-[120px] truncate">
            {weather.condition}
          </div>
          <div className="text-[8px] text-gray-500">
            LAT: {weather.lat.toFixed(2)} / LON: {weather.lon.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 3 Metric Chips: Humidity, Wind, Pressure */}
      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-[#00f2ff22] font-mono text-[8px]">
        <div className="bg-black/60 border border-[#00f2ff22] p-1 rounded-xs flex flex-col items-center">
          <div className="flex items-center gap-1 text-gray-400">
            <Droplets className="w-2.5 h-2.5 text-cyan-400" />
            <span>HUMEDAD</span>
          </div>
          <span className="text-white font-bold text-[9px] mt-0.5">{weather.humidity}%</span>
        </div>

        <div className="bg-black/60 border border-[#00f2ff22] p-1 rounded-xs flex flex-col items-center">
          <div className="flex items-center gap-1 text-gray-400">
            <Wind className="w-2.5 h-2.5 text-cyan-400" />
            <span>VIENTO</span>
          </div>
          <span className="text-white font-bold text-[9px] mt-0.5">{weather.windSpeed} km/h</span>
        </div>

        <div className="bg-black/60 border border-[#00f2ff22] p-1 rounded-xs flex flex-col items-center">
          <div className="flex items-center gap-1 text-gray-400">
            <Compass className="w-2.5 h-2.5 text-cyan-400" />
            <span>PRESIÓN</span>
          </div>
          <span className="text-white font-bold text-[9px] mt-0.5">{weather.pressure} hPa</span>
        </div>
      </div>
    </div>
  );
};
