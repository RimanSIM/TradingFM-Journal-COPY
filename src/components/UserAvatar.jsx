import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function UserAvatar({ email, traderName, size = 'md', className = '' }) {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (!email) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Don't call list() - it causes 403 for normal users
        // Just show fallback UI with trader name
        setUserData({ full_name: traderName, email: email });
      } catch (e) {
        console.error('Could not load user data:', e);
        setUserData({ full_name: traderName, email: email });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [email, traderName]);

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-lg',
    xl: 'w-16 h-16 text-2xl'
  };

  const displayName = userData?.full_name || traderName || 'U';
  const profilePicture = userData?.profile_picture;

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center overflow-hidden ${className}`}>
      {profilePicture ? (
        <img src={profilePicture} alt={displayName} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-bold">{displayName.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}