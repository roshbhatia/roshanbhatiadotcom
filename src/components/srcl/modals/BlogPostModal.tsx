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
  Footer: React.ComponentType;
}

function BlogPostModal({ writing, elements, toc, onClose, Footer }: BlogPostModalProps) {
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

    return (
      <nav className="mb-8 content-card" aria-label="Table of Contents">
        <h2 className="text-section mb-4">[TABLE OF CONTENTS]</h2>
        <ul className="space-y-2">
          {toc.map((item) => (
            <li key={item.id} style={{ marginLeft: `${(item.level - 1) * 20}px` }}>
              <a
                href={`#${item.id}`}
                className="text-link hover:accent-text mono text-body"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
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

          <article className="content-card schematic-container">
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

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default BlogPostModal;
