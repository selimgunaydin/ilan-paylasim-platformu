'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Input } from '@app/components/ui/input';
import { Button } from '@app/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@app/components/ui/popover';

interface EmojiInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
}

export function EmojiInput({ value, onChange, ...props }: EmojiInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEmojiSelect = (emoji: any) => {
    const newValue = value + emoji.emoji;
    onChange(newValue);
    setShowEmojiPicker(false);
    
    // Focus the input after emoji insertion
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative flex w-full">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        className="pr-12"
        {...props}
      />
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 me-2"
          >
            Emoji
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <EmojiPicker onEmojiClick={handleEmojiSelect} />
        </PopoverContent>
      </Popover>
    </div>
  );
} 