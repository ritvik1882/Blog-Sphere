"use client";

import { useState } from 'react';
import { Bold, Italic, List, Quote, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [imageUrl, setImageUrl] = useState('');

  // These are mock functions. A real editor would manipulate the content.
  const handleFormat = (format: string) => {
    // console.log(`Apply format: ${format}`);
    // In a real editor, you'd use a library's API to apply formatting.
    // For this mock, we'll just append to the textarea.
    let appendText = '';
    switch(format) {
      case 'bold': appendText = '**bold text** '; break;
      case 'italic': appendText = '*italic text* '; break;
      case 'list': appendText = '\n- List item 1\n- List item 2\n'; break;
      case 'quote': appendText = '\n> Quoted text\n'; break;
    }
    onChange(value + appendText);
  };

  const handleInsertImage = () => {
    if (imageUrl) {
      onChange(value + `\n![Image alt text](${imageUrl})\n`);
      setImageUrl(''); // Clear after inserting
    }
  };

  return (
    <div className="space-y-2 rounded-md border border-input p-2 shadow-sm">
      <div className="flex flex-wrap items-center gap-1 border-b pb-2 mb-2">
        <Button variant="outline" size="icon" onClick={() => handleFormat('bold')} title="Bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleFormat('italic')} title="Italic">
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleFormat('list')} title="List">
          <List className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleFormat('quote')} title="Quote">
          <Quote className="h-4 w-4" />
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" title="Insert Image by URL">
              <ImageIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Insert Image</h4>
                <p className="text-sm text-muted-foreground">
                  Enter the URL of the image.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input 
                  id="imageUrl" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  placeholder="https://example.com/image.png" 
                />
                <Button onClick={handleInsertImage} disabled={!imageUrl}>Insert Image</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Placeholder for Link button */}
        <Button variant="outline" size="icon" title="Insert Link (coming soon)">
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Start writing your masterpiece..."}
        className="min-h-[200px] w-full resize-y border-0 focus:ring-0 focus-visible:ring-0 shadow-none p-0"
      />
    </div>
  );
}
