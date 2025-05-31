/**
 * 书签卡片样式调度器
 * 根据设置选择合适的显示样式组件
 */

import React from 'react';
import { BookmarkCardDetailed, BookmarkCardCompact } from './display-styles';
import { BOOKMARK_DISPLAY_STYLES } from '@/constants';
import type { Bookmark, NetworkMode } from '@/types';
import type { BookmarkSettings } from '@/types/settings';
import type { BookmarkDisplayStyle } from '@/types/bookmark-display.types';

interface BookmarkCardV2Props {
  bookmark: Bookmark;
  networkMode: NetworkMode;
  bookmarkSettings: BookmarkSettings;
  displayStyle?: BookmarkDisplayStyle;
  borderRadius?: number;
  onClick?: (bookmark: Bookmark) => void;
  onContextMenu?: (bookmark: Bookmark, event: React.MouseEvent) => void;
  onDragStart?: (bookmarkId: string, event: React.DragEvent) => void;
  onDragEnd?: (bookmarkId: string, event: React.DragEvent) => void;
  onDragOver?: (bookmarkId: string, event: React.DragEvent) => void;
  onDrop?: (bookmarkId: string, event: React.DragEvent) => void;
  onDragEnter?: (bookmarkId: string, event: React.DragEvent) => void;
  onDragLeave?: (bookmarkId: string, event: React.DragEvent) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

const BookmarkCardV2: React.FC<BookmarkCardV2Props> = ({
  displayStyle = BOOKMARK_DISPLAY_STYLES.DETAILED,
  ...props
}) => {
  // 根据显示样式选择对应的组件
  switch (displayStyle) {
    case BOOKMARK_DISPLAY_STYLES.COMPACT:
      return <BookmarkCardCompact {...props} />;
    
    case BOOKMARK_DISPLAY_STYLES.DETAILED:
    default:
      return <BookmarkCardDetailed {...props} />;
  }
};

export default BookmarkCardV2;
