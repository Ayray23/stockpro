import React, { useState, useEffect } from 'react';
import Logo from '../assets/logo.jpg'; // Adjust the path as necessary

const SplashScreen = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 900000); // 60 seconds

    return () => clearTimeout(timer); // cleanup
  }, []);

  if (!showSplash) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <h1 className="text-2xl font-semibold text-gray-700">Welcome to StockPro!</h1>
        {/* Or route to your main app here */}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center bg-gray-100 text-center p-4">
      <img
        src={Logo}
        alt="StockPro Logo"
        className="w-24 h-24 mb-4 animate-spin-slow"
      />
      <h1 className="text-4xl font-bold text-gray-800">StockPro</h1>
      <p className="text-lg text-gray-600 mt-4">Loading, please wait...</p>

      <div className="mt-6 text-sm text-gray-700 space-y-1">
        <p><strong>Olaoye Misturah Omolabake</strong> – CS20230204432</p>
        <p><strong>Bukhari Abdulhakeem Akintunde</strong> – CS20230202144</p>
        <p>Supervisor: <strong>Mrs. Lawal Tadese</strong></p>
      </div>
    </div>
  );
};

export default SplashScreen;