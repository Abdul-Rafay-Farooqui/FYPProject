import { MessageCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#222d34] border-b-4 border-[#00a884]">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-[#2a3942] p-8 rounded-full">
            <MessageCircle className="w-24 h-24 text-[#8696a0]" />
          </div>
        </div>
        <h1 className="text-[#e9edef] text-3xl font-light">WeConnect Web</h1>
        <p className="text-[#8696a0] text-sm leading-relaxed">
          Send and receive messages without keeping your phone online.<br />
          Use WeConnect on up to 4 linked devices and 1 phone at the same time.
        </p>
        <div className="pt-10 flex items-center justify-center gap-2 text-[#8696a0] text-xs">
          <span className="opacity-50">End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
}
