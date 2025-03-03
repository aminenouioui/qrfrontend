import { useState } from 'react';
import Sidebar from '../components/SideBar';
import Header from '../components/Header';

export default function AdminLayout({ children }) {
  const [activeItem, setActiveItem] = useState('Home');

  return (
    <div className="flex h-screen bg-gradient-to-br from-teal-500 to-blue-800">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white m-4 rounded-lg shadow-lg flex flex-col flex-1">
          <Header />
          {children}
        </div>
      </div>
    </div>
  );
}