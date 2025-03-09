'use client';

import { useState } from 'react';
import { Menu, Bell, ChevronDown, LogOut, Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import useLogin from '@/app/hooks/useLogin';
import EditUserModal from '../user/EditUserModal';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useLogin();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <header className="bg-gray-50 border-2 border-red-500 rounded-b-xl fixed w-full top-0 z-10">
      <div className="px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-red-100 text-red-600 rounded-lg lg:hidden border border-red-400"
            aria-label="Menu"
          >
            <Menu size={24} />
          </button>
          <Link href="/" className="flex items-center ml-2 lg:ml-0">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="ml-2 font-semibold text-lg text-gray-900">
              {user?.bakeryName || 'G-Boul'}
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            className="p-2 hover:bg-gray-100 rounded-lg hidden md:flex"
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 hover:bg-blue-100 rounded-lg"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.nom_agent ? user.nom_agent[0].toUpperCase() : 'U'}
                </span>
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-gray-700">
                  {user?.nom_agent || 'Utilisateur'}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.libelle_profil || 'Non connecté'}
                </div>
              </div>
              <ChevronDown 
                size={16} 
                className={`transform transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                <button
                  onClick={() => {
                    setShowUserModal(true);
                    setShowUserMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Settings size={16} className="mr-2" />
                  Éditer le compte
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <LogOut size={16} className="mr-2" />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <EditUserModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        user={user}
      />
    </header>
  );
}
