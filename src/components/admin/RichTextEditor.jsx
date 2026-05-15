import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Quote, Heading1, Heading2, Heading3,
  RemoveFormatting, Undo, Redo, Minus, Subscript, Superscript,
  IndentDecrease, IndentIncrease, Type, Palette,
  ChevronDown, List, ListOrdered, Smile, Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const FONT_FAMILIES = [
  { label: 'Sans', value: 'Inter, system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Mono', value: '"JetBrains Mono", "Courier New", monospace' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Display', value: 'Poppins, Inter, sans-serif' },
];

const FONT_SIZES = [
  { label: '12', value: '12px' },
  { label: '14', value: '14px' },
  { label: '16', value: '16px' },
  { label: '18', value: '18px' },
  { label: '20', value: '20px' },
  { label: '24', value: '24px' },
  { label: '32', value: '32px' },
  { label: '40', value: '40px' },
  { label: '48', value: '48px' },
];

const FORMAT_BLOCKS = [
  { label: 'Paragraph', value: 'P' },
  { label: 'Heading 1', value: 'H1' },
  { label: 'Heading 2', value: 'H2' },
  { label: 'Heading 3', value: 'H3' },
  { label: 'Heading 4', value: 'H4' },
  { label: 'Quote', value: 'BLOCKQUOTE' },
  { label: 'Code block', value: 'PRE' },
];

const UL_STYLES = [
  { label: 'Bullet (•)', value: 'disc' },
  { label: 'Circle (◦)', value: 'circle' },
  { label: 'Square (▪)', value: 'square' },
  { label: 'No marker', value: 'none' },
];

const OL_STYLES = [
  { label: '1, 2, 3 …', value: 'decimal' },
  { label: '01, 02, 03 …', value: 'decimal-leading-zero' },
  { label: 'a, b, c …', value: 'lower-alpha' },
  { label: 'A, B, C …', value: 'upper-alpha' },
  { label: 'i, ii, iii …', value: 'lower-roman' },
  { label: 'I, II, III …', value: 'upper-roman' },
];

const LINE_HEIGHTS = [
  { label: 'Tight  (1.0)', value: '1' },
  { label: 'Snug  (1.15)', value: '1.15' },
  { label: 'Normal (1.4)', value: '1.4' },
  { label: 'Relaxed (1.6)', value: '1.6' },
  { label: 'Loose (1.8)', value: '1.8' },
  { label: 'Double (2.0)', value: '2' },
  { label: 'Extra (2.5)', value: '2.5' },
];

const BLOCK_TAGS = new Set([
  'P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'TD', 'TH',
]);

const ICON_PRESETS = [
  '✓', '✗', '★', '✦', '✿', '❀', '☀', '☾', '☘', '❤',
  '🌿', '🌸', '🍃', '🌺', '🪷', '🧘', '🧘‍♀️', '🧘‍♂️', '🕉', '☮',
  '🌅', '🌄', '🏞', '🏝', '🌊', '🔥', '💧', '🌳', '🌴', '🍀',
  '🥗', '🍵', '🍯', '🥥', '🍋', '🥑', '🍓', '🥕', '🌶', '🧂',
  '🛏', '🛀', '💆', '💆‍♀️', '💆‍♂️', '💇', '🪮', '🧴', '🪞', '🛁',
  '🎵', '🎶', '📿', '🔔', '🎐', '🪔', '🕯', '🎋', '🎍', '🪴',
];

/**
 * Lightweight contentEditable rich-text editor.
 *
 * Stores HTML in `value` and emits HTML through `onChange`. The output is
 * meant to be rendered with the `.rich-prose` class so the formatted
 * layout looks identical between admin and public site.
 *
 * Font / size are applied as inline `<span style="…">` so they survive
 * round-trips and render exactly the same in the public site.
 */
export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start typing…',
  minHeight = 220,
}) {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Initialise content on mount / when an external value differs
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== (value || '')) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const focusEditor = () => editorRef.current?.focus();

  const emit = () => onChange?.(editorRef.current?.innerHTML || '');

  const exec = useCallback((command, arg = null) => {
    focusEditor();
    document.execCommand(command, false, arg);
    emit();
  }, [onChange]); // eslint-disable-line react-hooks/exhaustive-deps

  const setBlock = (tag) => exec('formatBlock', tag);

  // Wrap the current selection in a <span> with a custom inline style.
  // Used for font-family and font-size where execCommand has poor support.
  const wrapSelection = (styleProp, styleValue) => {
    focusEditor();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return; // nothing selected — silently ignore
    const span = document.createElement('span');
    span.style[styleProp] = styleValue;
    try {
      range.surroundContents(span);
    } catch {
      // Selection straddles different parents — fallback by extracting/reinserting
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
    sel.removeAllRanges();
    const r = document.createRange();
    r.selectNodeContents(span);
    sel.addRange(r);
    emit();
  };

  // Apply an inline style to the nearest block ancestor of the current selection
  // (P / H1–H6 / LI / DIV / BLOCKQUOTE). Falls back to wrapping the selection in
  // a span if no block ancestor is found. Used for properties like line-height
  // that are paragraph-level rather than character-level.
  const setBlockStyle = (styleProp, styleValue) => {
    focusEditor();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let node = sel.anchorNode;
    if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
    while (
      node &&
      node !== editorRef.current &&
      !BLOCK_TAGS.has(node.tagName)
    ) {
      node = node.parentNode;
    }
    if (node && node !== editorRef.current) {
      node.style[styleProp] = styleValue;
      emit();
      return;
    }
    // No block ancestor found — fall back to wrapping the selection
    wrapSelection(styleProp, styleValue);
  };

  // Find the nearest <ul> or <ol> that contains the current selection and
  // change its list-style-type. Used by the list-style dropdowns.
  const setListStyle = (kind, styleValue) => {
    focusEditor();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let node = sel.anchorNode;
    if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
    while (node && node !== editorRef.current && node.tagName !== kind.toUpperCase()) {
      node = node.parentNode;
    }
    if (!node || node === editorRef.current) {
      // No active list — create one first, then style it
      exec(kind === 'UL' ? 'insertUnorderedList' : 'insertOrderedList');
      // Re-find
      let again = window.getSelection().anchorNode;
      if (again && again.nodeType === Node.TEXT_NODE) again = again.parentNode;
      while (again && again !== editorRef.current && again.tagName !== kind.toUpperCase()) {
        again = again.parentNode;
      }
      if (again && again !== editorRef.current) again.style.listStyleType = styleValue;
    } else {
      node.style.listStyleType = styleValue;
    }
    emit();
  };

  const setLink = () => {
    const url = prompt('Enter URL (include https://)');
    if (!url) return;
    exec('createLink', url);
  };

  // Insert raw HTML at the current selection (or at the end if no selection).
  const insertHtml = (html) => {
    focusEditor();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      // No selection — append at the end
      const el = editorRef.current;
      if (el) {
        el.insertAdjacentHTML('beforeend', html);
      }
      emit();
      return;
    }
    document.execCommand('insertHTML', false, html);
    emit();
  };

  const insertEmoji = (emoji) => {
    insertHtml(`<span class="rte-icon">${emoji}</span>`);
  };

  const insertIconImage = (url) => {
    // Inline-sized image styled to look like an icon — sizing controlled by
    // the .rte-custom-icon CSS class so it stays consistent everywhere.
    insertHtml(`<img src="${url}" alt="" class="rte-custom-icon" />`);
  };

  const uploadIconFile = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const tId = toast.loading('Uploading icon…');
    try {
      const res = await api.post('/uploads/inline', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res?.data?.data?.url;
      if (!url) throw new Error('No URL returned');
      insertIconImage(url);
      toast.success('Icon inserted', { id: tId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: tId });
    }
  };

  const onInput = () => emit();

  const onPaste = (e) => {
    // Strip rich-text from external paste sources to avoid pasting Word styles
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    if (!text) return;
    e.preventDefault();
    document.execCommand('insertText', false, text);
  };

  return (
    <div className={`rte-shell border rounded-xl bg-white overflow-hidden ${isFocused ? 'ring-2 ring-brand/30 border-brand' : 'border-slate-200'}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b bg-slate-50">
        {/* Group: history */}
        <Group>
          <IconBtn title="Undo" onClick={() => exec('undo')}><Undo size={15} /></IconBtn>
          <IconBtn title="Redo" onClick={() => exec('redo')}><Redo size={15} /></IconBtn>
        </Group>

        {/* Group: typography */}
        <Group>
          <Select
            title="Font family"
            placeholder="Font"
            options={FONT_FAMILIES}
            onPick={(v) => wrapSelection('fontFamily', v)}
            width={86}
          />
          <Select
            title="Font size"
            placeholder="Size"
            options={FONT_SIZES}
            onPick={(v) => wrapSelection('fontSize', v)}
            width={66}
          />
          <Select
            title="Block format"
            placeholder="Format"
            options={FORMAT_BLOCKS}
            onPick={(v) => setBlock(v)}
            width={100}
          />
          <Select
            title="Line height (applies to the current paragraph)"
            placeholder="Line"
            options={LINE_HEIGHTS}
            onPick={(v) => setBlockStyle('lineHeight', v)}
            width={92}
          />
        </Group>

        {/* Group: inline marks */}
        <Group>
          <IconBtn title="Bold" onClick={() => exec('bold')}><Bold size={15} /></IconBtn>
          <IconBtn title="Italic" onClick={() => exec('italic')}><Italic size={15} /></IconBtn>
          <IconBtn title="Underline" onClick={() => exec('underline')}><Underline size={15} /></IconBtn>
          <IconBtn title="Strikethrough" onClick={() => exec('strikeThrough')}><Strikethrough size={15} /></IconBtn>
          <IconBtn title="Subscript" onClick={() => exec('subscript')}><Subscript size={15} /></IconBtn>
          <IconBtn title="Superscript" onClick={() => exec('superscript')}><Superscript size={15} /></IconBtn>
        </Group>

        {/* Group: color */}
        <Group>
          <ColorPicker title="Text color" icon={<Type size={15} />} onPick={(c) => exec('foreColor', c)} />
          <ColorPicker title="Highlight" icon={<Palette size={15} />} onPick={(c) => exec('hiliteColor', c)} defaultColor="#fef3c7" />
        </Group>

        {/* Group: headings */}
        <Group>
          <IconBtn title="Heading 1" onClick={() => setBlock('H1')}><Heading1 size={15} /></IconBtn>
          <IconBtn title="Heading 2" onClick={() => setBlock('H2')}><Heading2 size={15} /></IconBtn>
          <IconBtn title="Heading 3" onClick={() => setBlock('H3')}><Heading3 size={15} /></IconBtn>
        </Group>

        {/* Group: alignment */}
        <Group>
          <IconBtn title="Align left" onClick={() => exec('justifyLeft')}><AlignLeft size={15} /></IconBtn>
          <IconBtn title="Align center" onClick={() => exec('justifyCenter')}><AlignCenter size={15} /></IconBtn>
          <IconBtn title="Align right" onClick={() => exec('justifyRight')}><AlignRight size={15} /></IconBtn>
          <IconBtn title="Justify" onClick={() => exec('justifyFull')}><AlignJustify size={15} /></IconBtn>
        </Group>

        {/* Group: lists */}
        <Group>
          <SplitButton
            title="Bulleted list"
            icon={<List size={15} />}
            onMain={() => exec('insertUnorderedList')}
            options={UL_STYLES}
            onPick={(v) => setListStyle('UL', v)}
          />
          <SplitButton
            title="Numbered list"
            icon={<ListOrdered size={15} />}
            onMain={() => exec('insertOrderedList')}
            options={OL_STYLES}
            onPick={(v) => setListStyle('OL', v)}
          />
          <IconBtn title="Decrease indent" onClick={() => exec('outdent')}><IndentDecrease size={15} /></IconBtn>
          <IconBtn title="Increase indent" onClick={() => exec('indent')}><IndentIncrease size={15} /></IconBtn>
        </Group>

        {/* Group: icons */}
        <Group>
          <EmojiPicker
            title="Insert symbol / icon"
            icon={<Smile size={15} />}
            options={ICON_PRESETS}
            onPick={insertEmoji}
          />
          <IconUploader
            title="Upload custom icon"
            icon={<ImageIcon size={15} />}
            onPick={uploadIconFile}
          />
        </Group>

        {/* Group: blocks & misc */}
        <Group last>
          <IconBtn title="Quote" onClick={() => setBlock('BLOCKQUOTE')}><Quote size={15} /></IconBtn>
          <IconBtn title="Insert link" onClick={setLink}><LinkIcon size={15} /></IconBtn>
          <IconBtn title="Horizontal rule" onClick={() => exec('insertHorizontalRule')}><Minus size={15} /></IconBtn>
          <IconBtn title="Clear formatting" onClick={() => exec('removeFormat')}><RemoveFormatting size={15} /></IconBtn>
        </Group>
      </div>

      {/* Editable surface */}
      <div
        ref={editorRef}
        className="rich-prose px-4 py-3 outline-none"
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        onPaste={onPaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        style={{ minHeight }}
      />
    </div>
  );
}

/* ----- Toolbar primitives ----- */

function Group({ children, last }) {
  return (
    <div className={`flex items-center gap-0.5 px-1 ${last ? '' : 'border-r border-slate-200 mr-1'}`}>
      {children}
    </div>
  );
}

function IconBtn({ onClick, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className="p-1.5 rounded text-slate-700 hover:bg-slate-200 hover:text-ink transition"
    >
      {children}
    </button>
  );
}

/**
 * Compact dropdown with custom label, click-outside-to-close behaviour.
 */
function Select({ title, placeholder, options, onPick, width = 80 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <span ref={ref} className="relative" onMouseDown={(e) => e.preventDefault()}>
      <button
        type="button"
        title={title}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-1 text-xs text-slate-700 bg-white border border-slate-300 rounded px-2 py-1 hover:border-slate-400"
        style={{ width }}
      >
        <span className="truncate">{placeholder}</span>
        <ChevronDown size={12} className="opacity-60 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 left-0 min-w-[150px] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {options.map((opt) => {
            const previewStyle = opt.value && opt.value.includes(',')
              ? { fontFamily: opt.value }
              : opt.value && opt.value.endsWith('px')
                ? { fontSize: opt.value }
                : undefined;
            return (
              <button
                type="button"
                key={opt.value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onPick(opt.value); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100"
                style={previewStyle}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
}

function ColorPicker({ title, icon, onPick, defaultColor = '#111827' }) {
  return (
    <label
      title={title}
      className="p-1.5 rounded hover:bg-slate-200 cursor-pointer relative inline-flex items-center text-slate-700"
      onMouseDown={(e) => e.preventDefault()}
    >
      {icon}
      <input
        type="color"
        defaultValue={defaultColor}
        onChange={(e) => onPick(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </label>
  );
}

function EmojiPicker({ title, icon, options, onPick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <span ref={ref} className="relative" onMouseDown={(e) => e.preventDefault()}>
      <IconBtn title={title} onClick={() => setOpen((o) => !o)}>{icon}</IconBtn>
      {open && (
        <div className="absolute z-30 mt-1 left-0 top-full bg-white border border-slate-200 rounded-lg shadow-lg p-2 grid grid-cols-10 gap-1 w-[280px] max-h-[200px] overflow-y-auto">
          {options.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onPick(emoji); setOpen(false); }}
              className="w-7 h-7 flex items-center justify-center text-base rounded hover:bg-slate-100"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

function IconUploader({ title, icon, onPick }) {
  const inputRef = useRef(null);
  return (
    <span onMouseDown={(e) => e.preventDefault()} className="inline-flex">
      <IconBtn title={title} onClick={() => inputRef.current?.click()}>{icon}</IconBtn>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = '';
        }}
      />
    </span>
  );
}

function SplitButton({ title, icon, onMain, options, onPick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <span ref={ref} className="inline-flex items-center relative" onMouseDown={(e) => e.preventDefault()}>
      <IconBtn title={title} onClick={onMain}>{icon}</IconBtn>
      <button
        type="button"
        title={`${title} — choose style`}
        onClick={() => setOpen((o) => !o)}
        className="p-1 rounded hover:bg-slate-200 text-slate-500"
      >
        <ChevronDown size={11} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 top-full left-0 min-w-[160px] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {options.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onPick(opt.value); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
