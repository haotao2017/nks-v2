'use client';

/**
 * RichTextEditor —— 基于 Tiptap 的富文本编辑器,输出 HTML。
 *
 * - 用于 EmailTemplate.template 字段(HTML 字符串)编辑。
 * - 提供基础工具栏:粗体 / 斜体 / 标题(H2) / 无序列表 / 有序列表 / 链接。
 * - 顶部一排「插入变量」按钮:点击把 #占位符# 插入光标处(旧系统核心功能)。
 * - 受控:value(HTML)+ onChange(html)。外部 value 变化时同步进编辑器。
 *
 * SSR 说明:Next App Router 下必须设 immediatelyRender:false,否则 Tiptap 会
 * 在 SSR/hydration 阶段报不匹配。
 *
 * Link 扩展说明:StarterKit 在 Tiptap v3 内置了 link,这里显式关闭
 * (StarterKit.configure({ link: false }))再单独注册 @tiptap/extension-link,
 * 以便统一配置(v2 下该 key 会被忽略,亦安全)。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Link2,
  Undo2,
  Redo2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  /** 可插入的 #占位符# 列表(来自 GetAllEmailHashtags)。 */
  hashtags?: string[];
  hashtagsLoading?: boolean;
  disabled?: boolean;
}

/** 工具栏按钮 —— active 时高亮。 */
function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="icon"
      className="size-8"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </Button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const { t } = useTranslation();

  const setLink = React.useCallback(() => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt(t('emailTemplates.editor.linkPrompt'), prev ?? 'https://');
    if (url === null) return; // 取消
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor, t]);

  return (
    <div className="border-input flex flex-wrap items-center gap-1 border-b p-1">
      <ToolbarButton
        label={t('emailTemplates.editor.bold')}
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={t('emailTemplates.editor.italic')}
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={t('emailTemplates.editor.heading')}
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={t('emailTemplates.editor.bulletList')}
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={t('emailTemplates.editor.orderedList')}
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={t('emailTemplates.editor.link')}
        active={editor.isActive('link')}
        onClick={setLink}
      >
        <Link2 className="size-4" />
      </ToolbarButton>

      <span className="bg-border mx-1 h-5 w-px" aria-hidden />

      <ToolbarButton
        label={t('emailTemplates.editor.undo')}
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={t('emailTemplates.editor.redo')}
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="size-4" />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  hashtags = [],
  hashtagsLoading = false,
  disabled = false,
}: RichTextEditorProps) {
  const { t } = useTranslation();
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({ link: false }),
      Link.configure({ openOnClick: false, autolink: false }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'rte-content min-h-40 px-3 py-2 focus:outline-none',
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
  });

  // 外部 value 变化(如切换编辑目标)时同步进编辑器,避免覆盖用户正在输入的内容。
  React.useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  React.useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const insertHashtag = (tag: string) => {
    editor?.chain().focus().insertContent(tag).run();
  };

  return (
    <div className="space-y-2">
      {/* 插入变量按钮排 */}
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs font-medium">
          {t('emailTemplates.editor.insertVariable')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {hashtagsLoading ? (
            <span className="text-muted-foreground text-xs">
              {t('emailTemplates.editor.loadingVariables')}
            </span>
          ) : hashtags.length ? (
            hashtags.map((tag) => (
              <Button
                key={tag}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 font-mono text-xs"
                onClick={() => insertHashtag(tag)}
                disabled={disabled}
              >
                {tag}
              </Button>
            ))
          ) : (
            <span className="text-muted-foreground text-xs">
              {t('emailTemplates.editor.noVariables')}
            </span>
          )}
        </div>
      </div>

      {/* 编辑器 */}
      <div
        className={cn(
          'border-input focus-within:border-ring focus-within:ring-ring/50 rounded-md border shadow-xs transition-[color,box-shadow] focus-within:ring-[3px]',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        {editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
