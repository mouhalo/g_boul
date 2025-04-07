'use client';
import { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, Settings, FileText, X, ChevronRight, DollarSign, Package, BarChart2, ClipboardList, Warehouse, Menu, LogOut } from 'lucide-react';
import { UserContext } from '@/app/contexts/UserContext';
import EditUserModal from '../user/EditUserModal';
import { LucideIcon } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Définition des routes et profils de manière cohérente avec useLogin
const profileRoutes: { [key: string]: string } = {
  'Manager': '/manager',
  'Gérant': '/gerant',
  'Comptable': '/comptable',
  'Caissier': '/caissier',
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const { user } = useContext(UserContext);
  
  // Utiliser le même système de routes que useLogin
  const profile = user?.libelle_profil ? profileRoutes[user.libelle_profil]?.substring(1) : '';

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const getMenuItems = () => {
    // Common item for all profiles
    const commonItems = [
      { icon: Home, label: 'Accueil', href: `/${profile}` },
    ];

    // Vérifier si le profil existe avant de l'utiliser
    if (!profile) return commonItems;

    // Définir les menus par profil
    const profileMenus: Record<string, Array<{ icon: LucideIcon; label: string; href: string }>> = {
      'manager': [
        { icon: BarChart2, label: 'Etats', href: `/${profile}/etats` },
        { icon: FileText, label: 'Rapports', href: `/${profile}/rapports` },
        { icon: DollarSign, label: 'Recettes', href: `/${profile}/recettes` },
        { icon: ClipboardList, label: 'Dépenses', href: `/${profile}/depense` },
        { icon: Warehouse, label: 'Stocks', href: `/${profile}/stocks` },
        { icon: Package, label: 'Productions', href: `/${profile}/cuisson` },
        { icon: ShoppingCart, label: 'Ventes', href: `/${profile}/ventes` },
        { icon: Settings, label: 'Paramètres', href: `/${profile}/settings` },
      ],
      'gerant': [
        { icon: FileText, label: 'Rapports', href: `/${profile}/rapports` },
        { icon: DollarSign, label: 'Recettes', href: `/${profile}/recettes` },
        { icon: ClipboardList, label: 'Dépenses', href: `/${profile}/depense` },
        { icon: Warehouse, label: 'Stocks', href: `/${profile}/stocks` },
        { icon: Package, label: 'Productions', href: `/${profile}/cuisson` },
        { icon: ShoppingCart, label: 'Ventes', href: `/${profile}/ventes` },
      ],
      'comptable': [
        { icon: Warehouse, label: 'Stocks', href: `/${profile}/stocks` },
        { icon: Package, label: 'Productions', href: `/${profile}/cuisson` },
        { icon: ShoppingCart, label: 'Ventes', href: `/${profile}/ventes` },
      ],
      'caissier': [
        { icon: Package, label: 'Productions', href: `/${profile}/cuisson` },
        { icon: ShoppingCart, label: 'Ventes', href: `/${profile}/ventes` },
        { icon: ClipboardList, label: 'Dépenses', href: `/${profile}/depense` },
      ],
    };

    // Récupérer les items du menu pour le profil actuel
    const profileKey = profile.toLowerCase();
    return profileKey in profileMenus 
      ? [...commonItems, ...profileMenus[profileKey]]
      : commonItems;
  };

  const menuItems = getMenuItems();

  const sidebarVariants = {
    expanded: { width: '16rem' },
    collapsed: { width: '4rem' }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-20"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.div
        variants={sidebarVariants}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        className={`fixed lg:static h-screen bg-red-600 text-white z-30
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4">
          {!isCollapsed && (
            <div className="flex items-center">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="ml-2 font-semibold text-lg">
                {user?.bakeryName || 'G-Boul'}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-red-700 lg:block hidden"
            >
              <ChevronRight
                className={`transform transition-transform ${
                  isCollapsed ? 'rotate-0' : 'rotate-180'
                }`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-red-700 lg:hidden"
            >
              <X />
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="mt-4">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium
                  ${isActive ? 'bg-red-700' : 'hover:bg-red-700'}
                  transition-colors duration-200`}
              >
                <item.icon className="w-5 h-5" />
                {!isCollapsed && <span className="ml-3">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer avec menu utilisateur */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 w-full p-2 hover:bg-red-700 rounded-lg"
            >
              <div className="w-8 h-8 bg-red-700 rounded-full flex items-center justify-center">
                <span className="font-medium">
                  {user?.nom_agent ? user.nom_agent[0].toUpperCase() : 'U'}
                </span>
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">
                      {user?.nom_agent || 'Utilisateur'}
                    </div>
                    <div className="text-xs opacity-75">
                      {user?.libelle_profil || 'Non connecté'}
                    </div>
                  </div>
                  <Menu className="w-5 h-5" />
                </>
              )}
            </button>

            {showUserMenu && !isCollapsed && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-red-700 rounded-lg shadow-lg py-1">
                <button
                  onClick={() => {
                    setShowUserModal(true);
                    setShowUserMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm hover:bg-red-800"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Éditer le compte
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm hover:bg-red-800"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Modal d'édition utilisateur */}
      {showUserModal && (
        <EditUserModal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          user={user}
        />
      )}
    </>
  );
}
