import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from './MarkdownRenderer';

test('renders markdown content', () => {
  const markdownContent = '# Hello World\n\nThis is a **test**.';
  
  render(<MarkdownRenderer content={markdownContent} />);
  
  expect(screen.getByText('Hello World')).toBeInTheDocument();
  expect(screen.getByText('test')).toHaveTextContent('test');
});

// Test with code block

test('renders code blocks', () => {
  const markdownContent = '```javascript\nconsole.log("hello");\n```';
  
  render(<MarkdownRenderer content={markdownContent} />);
  
  expect(screen.getByText('console.log("hello");')).toBeInTheDocument();
});