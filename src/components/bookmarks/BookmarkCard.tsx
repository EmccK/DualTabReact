/**
 * 新版书签组件
 * 根据设置自动选择卡片样式或图标样式
 */

import React from 'react';
import BookmarkCardStyle from './BookmarkCardStyle';
import BookmarkIconStyle from './BookmarkIconStyle';
import { BOOKMARK_STYLE_TYPES } from '@/constants/bookmark-style.constants';
import type { BookmarkCardProps } from '@/types/bookmark-style.types';

interface ExtendedBookmarkCardProps extends BookmarkCardProps {
  className?: string;
}

const BookmarkCard: React.FC<ExtendedBookmarkCardProps> = (props) => {
  const { settings, className = '' } = props;

  // 根据设置选择样式组件
  switch (settings.styleType) {
    case BOOKMARK_STYLE_TYPES.CARD:
      return <BookmarkCardStyle {...props} className={className} />;
    
    case BOOKMARK_STYLE_TYPES.ICON:
      return <BookmarkIconStyle {...props} className={className} />;
    
    default:
      return <BookmarkCardStyle {...props} className={className} />;
  }
};

export default BookmarkCard;
