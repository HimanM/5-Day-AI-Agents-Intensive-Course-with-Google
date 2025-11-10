import { Button } from '@/components/ui/button';

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  loading: boolean;
}

export function ChatInput({ input, onInputChange, onSend, loading }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      onSend();
    }
  };

  return (
    <div className="border-t border-border p-4 bg-background">
      <div className="max-w-4xl mx-auto flex gap-2">
        <input
          className="flex-1 px-5 py-3.5 rounded-full bg-muted border border-input text-base focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Type a message..."
          value={input}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <Button onClick={onSend} disabled={loading} size="icon" className="rounded-full h-14 w-14">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
