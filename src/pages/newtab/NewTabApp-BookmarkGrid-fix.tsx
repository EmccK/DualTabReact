            {/* 书签网格区域 */}
            <div className="w-full max-w-5xl">
              <BookmarkGrid
                bookmarks={bookmarks}
                categories={categories}
                networkMode={networkMode}
                isGlassEffect={isGlassEffect}
                loading={bookmarksLoading}
                error={bookmarksError}
                selectedCategoryId={selectedCategoryId}
                onBookmarkClick={handleBookmarkClick}
                onBookmarkContextMenu={handleBookmarkContextMenu}
                onAddBookmarkClick={handleAddBookmark}
                onBookmarksReorder={handleBookmarksReorder}
              />
            </div>