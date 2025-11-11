'use client';

import styles from '@components/modals/BlogPostModal.module.scss';
import * as React from 'react';
import { useModals } from '@components/page/ModalContext';
import { Writing } from '../../../writings.generated';

interface BlogPostModalProps {
  writing: Writing;
  elements: React.ReactNode[];
  toc: Array<{ id: string; title: string; level: number }>;
  onClose: () => void;
}

function BlogPostModal({ writing, elements, toc, onClose }: BlogPostModalProps) {
  const { close } = useModals();

  const handleClose = () => {
    close();
    onClose();
  };

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const TOC = () => {
    if (toc.length === 0) return null;

    const getTreePrefix = (index: number, level: number, nextLevel?: number) => {
      const isLast = index === toc.length - 1 || (nextLevel !== undefined && nextLevel < level);
      const indent = '│   '.repeat(level - 2);

      if (level === 2) {
        return isLast ? '└── ' : '├── ';
      } else {
        return indent + (isLast ? '└── ' : '├── ');
      }
    };

    return (
      <nav className="mb-8 content-card" aria-label="Table of Contents">
        <h2 className="text-section mb-4">[TABLE OF CONTENTS]</h2>
        <div className="mono text-small">
          {toc.map((item, index) => {
            const nextLevel = index < toc.length - 1 ? toc[index + 1].level : undefined;
            const prefix = getTreePrefix(index, item.level, nextLevel);

            return (
              <div key={item.id} className="leading-relaxed">
                <span className="secondary-text">{prefix}</span>
                <a
                  href={`#${item.id}`}
                  className="text-link hover:accent-text"
                >
                  {item.title}
                </a>
              </div>
            );
          })}
        </div>
      </nav>
    );
  };

  return (
    <div
      className={styles.root}
      data-test="blog-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleClose}
            className="theme-toggle mb-8"
            data-test="back-button"
          >
            [BACK]
          </button>

          <article className="content-card">
            <header className="mb-8">
              <div className="flex justify-between mb-4">
                <h1 className="text-hero" data-test="blog-title">
                  {writing.title}
                </h1>
              </div>

              <div className="flex gap-8 text-small secondary-text">
                <div data-test="blog-date">
                  {new Date(writing.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div data-test="reading-time">
                  {writing.readingTime} MIN READ
                </div>
              </div>
              <div className="industrial-divider"></div>
            </header>

            <TOC />

            <div className="prose" data-test="blog-content">
              {elements}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

export default BlogPostModal;
