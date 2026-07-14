import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Codernic UI",
  description: "Component Library Showcase for Codernic",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Components', link: '/components/button' }
    ],
    sidebar: [
      {
        text: 'Components',
        items: [
          { text: 'Button', link: '/components/button' },
          { text: 'Badge', link: '/components/badge' },
          { text: 'Card', link: '/components/card' },
          { text: 'Accordion', link: '/components/accordion' }
        ]
      }
    ]
  }
})
