'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import EmojiPicker from 'emoji-picker-react';
import { Button } from '@app/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@app/components/ui/popover';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export function RichTextEditor({ value, onChange, placeholder, maxLength = 5000 }: RichTextEditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3], // Enable H1, H2, H3
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'], // Enable text alignment
      }),
      Placeholder.configure({
        placeholder: placeholder || 'İlan detaylarını yazınız...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (maxLength && editor.getText().length <= maxLength) {
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl focus:outline-none min-h-[200px] max-w-none p-4 rounded-md border border-input bg-background ring-offset-background',
      },
    },
  });

  // Formatting functions
  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  const toggleHeading = (level: 1 | 2 | 3) => editor?.chain().focus().toggleHeading({ level }).run();
  const toggleBlockquote = () => editor?.chain().focus().toggleBlockquote().run();
  const toggleCodeBlock = () => editor?.chain().focus().toggleCodeBlock().run();
  const setTextAlign = (align: 'left' | 'center' | 'right' | 'justify') =>
    editor?.chain().focus().setTextAlign(align).run();

  const insertEmoji = (emoji: any) => {
    editor?.chain().focus().insertContent(emoji.emoji).run();
    setShowEmojiPicker(false);
  };

  const characterCount = editor?.getText().length || 0;

  return (
    <div className="rich-text-editor">
      <div className="flex flex-wrap items-center gap-1 p-1 mb-2 border border-input bg-muted/30 rounded-md">
        {/* Bold, Italic */}
        <Button size="sm" variant={editor?.isActive('bold') ? 'default' : 'outline'} onClick={toggleBold} type="button">
          <span className="font-bold">B</span>
        </Button>
        <Button
          size="sm"
          variant={editor?.isActive('italic') ? 'default' : 'outline'}
          onClick={toggleItalic}
          type="button"
        >
          <span className="italic">I</span>
        </Button>

        {/* Headings */}
        <Button
          size="sm"
          variant={editor?.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
          onClick={() => toggleHeading(1)}
          type="button"
        >
          H1
        </Button>
        <Button
          size="sm"
          variant={editor?.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
          onClick={() => toggleHeading(2)}
          type="button"
        >
          H2
        </Button>
        <Button
          size="sm"
          variant={editor?.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
          onClick={() => toggleHeading(3)}
          type="button"
        >
          H3
        </Button>

        {/* Lists */}
        <Button
          size="sm"
          variant={editor?.isActive('bulletList') ? 'default' : 'outline'}
          onClick={toggleBulletList}
          type="button"
        >
          <span>•</span>
        </Button>
        <Button
          size="sm"
          variant={editor?.isActive('orderedList') ? 'default' : 'outline'}
          onClick={toggleOrderedList}
          type="button"
        >
          <span>1.</span>
        </Button>

        {/* Blockquote and Code */}
        <Button
          size="sm"
          variant={editor?.isActive('blockquote') ? 'default' : 'outline'}
          onClick={toggleBlockquote}
          type="button"
        >
          <span>"</span>
        </Button>
        <Button
          size="sm"
          variant={editor?.isActive('codeBlock') ? 'default' : 'outline'}
          onClick={toggleCodeBlock}
          type="button"
        >
          <span>{`</>`}</span>
        </Button>

        {/* Text Alignment */}
        <Button
          size="sm"
          variant={editor?.isActive({ textAlign: 'left' }) ? 'default' : 'outline'}
          onClick={() => setTextAlign('left')}
          type="button"
        >
          ←
        </Button>
        <Button
          size="sm"
          variant={editor?.isActive({ textAlign: 'center' }) ? 'default' : 'outline'}
          onClick={() => setTextAlign('center')}
          type="button"
        >
          ↔
        </Button>
        <Button
          size="sm"
          variant={editor?.isActive({ textAlign: 'right' }) ? 'default' : 'outline'}
          onClick={() => setTextAlign('right')}
          type="button"
        >
          →
        </Button>

        {/* Emoji Picker */}
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" type="button">
              Emoji
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <EmojiPicker onEmojiClick={insertEmoji} />
          </PopoverContent>
        </Popover>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Character Count */}
      <div className="text-sm text-muted-foreground mt-2">
        {characterCount} / {maxLength} karakter
      </div>
    </div>
  );
}