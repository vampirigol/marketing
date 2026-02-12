 'use client';
import Sidebar from './Sidebar';
import ChatPanel from './ChatPanel';
import DetailsPanel from './DetailsPanel';

export default function MatrixInbox() {
  return (
    <div className="flex h-screen bg-[#F0F2F5]">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen">
        <ChatPanel />
      </div>
      <DetailsPanel />
    </div>
  );
}
