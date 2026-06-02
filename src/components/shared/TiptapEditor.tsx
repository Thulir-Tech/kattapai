'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo 
} from 'lucide-react';

interface TiptapEditorProps {
  value: string;
  onChange: (richText: string) => void;
  disabled?: boolean;
}

export default function TiptapEditor({ value, onChange, disabled = false }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[160px] p-4 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-b-2xl transition-colors',
      },
    },
    editable: !disabled,
  });

  // Sync value from parent if updated externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full flex flex-col overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800/80 focus-within:border-violet-500 transition-colors">
      {/* 1. Custom Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-zinc-100/50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800/80">
        
        {/* Bold */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('bold') ? 'bg-zinc-200 dark:bg-zinc-800 text-violet-600 dark:text-violet-400' : 'text-zinc-600 dark:text-zinc-400'}`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Italic */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('italic') ? 'bg-zinc-200 dark:bg-zinc-800 text-violet-600 dark:text-violet-400' : 'text-zinc-600 dark:text-zinc-400'}`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        {/* Strike */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('strike') ? 'bg-zinc-200 dark:bg-zinc-800 text-violet-600 dark:text-violet-400' : 'text-zinc-600 dark:text-zinc-400'}`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 self-center mx-1" />

        {/* H1 */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('heading', { level: 1 }) ? 'bg-zinc-200 dark:bg-zinc-800 text-violet-600 dark:text-violet-400' : 'text-zinc-600 dark:text-zinc-400'}`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        {/* H2 */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('heading', { level: 2 }) ? 'bg-zinc-200 dark:bg-zinc-800 text-violet-600 dark:text-violet-400' : 'text-zinc-600 dark:text-zinc-400'}`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 self-center mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('bulletList') ? 'bg-zinc-200 dark:bg-zinc-800 text-violet-600 dark:text-violet-400' : 'text-zinc-600 dark:text-zinc-400'}`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        {/* Ordered List */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('orderedList') ? 'bg-zinc-200 dark:bg-zinc-800 text-violet-600 dark:text-violet-400' : 'text-zinc-600 dark:text-zinc-400'}`}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        {/* Blockquote */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded-lg transition-colors cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 ${editor.isActive('blockquote') ? 'bg-zinc-200 dark:bg-zinc-800 text-violet-600 dark:text-violet-400' : 'text-zinc-600 dark:text-zinc-400'}`}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 self-center mx-1" />

        {/* Undo */}
        <button
          type="button"
          disabled={disabled || !editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
          className="p-2 rounded-lg transition-colors cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>

        {/* Redo */}
        <button
          type="button"
          disabled={disabled || !editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
          className="p-2 rounded-lg transition-colors cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Interactive Area */}
      <EditorContent editor={editor} />
    </div>
  );
}
