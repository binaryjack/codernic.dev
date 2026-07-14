import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Codernic",
  description: "The AI that codes under supervision. A supervised engineering runtime.",
  appearance: 'dark', // Default to dark mode to match branding
  cleanUrls: true,
  themeConfig: {
    logo: '/logo.svg', // We will assume a logo will be there or text is enough
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Back to codernic.dev', link: 'https://codernic.dev' },
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Architecture', link: '/architecture/overview' },
      { text: 'Enterprise', link: '/enterprise/installation' },
      { 
        text: 'Adopters Guide', 
        items: [
          { text: 'Chat & Capabilities', link: '/guide/chat-and-capabilities' },
          { text: 'Settings & UI Widgets', link: '/guide/settings-ui' },
          { text: 'Configuring Models', link: '/guide/models-hub' },
          { text: 'Understanding Artifacts', link: '/guide/artifacts' },
          { text: 'Using Erathos', link: '/guide/erathos-usage' },
          { text: 'Training LoRA Agents', link: '/guide/lora-training' },
          { text: 'Security & Privacy', link: '/guide/security-privacy' },
          { text: 'Troubleshooting & Logs', link: '/guide/troubleshooting' }
        ]
      }
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Quick Start (First Prompt)', link: '/guide/quick-start' },
          { text: 'Lexical Glossary', link: '/guide/glossary' },
          { text: 'CLI Cheatsheet', link: '/guide/cli' }
        ]
      },
      {
        text: 'Adopters Guide',
        items: [
          { text: 'Chat & Capabilities', link: '/guide/chat-and-capabilities' },
          { text: 'Settings & UI Widgets', link: '/guide/settings-ui' },
          { text: 'Configuring Models', link: '/guide/models-hub' },
          { text: 'Configuring Agents & DAGs', link: '/guide/agent-configuration' },
          { text: 'Understanding Artifacts', link: '/guide/artifacts' },
          { text: 'Using Visual Grounding', link: '/guide/erathos-usage' },
          { text: 'Training LoRA Agents', link: '/guide/lora-training' },
          { text: 'Security & Privacy', link: '/guide/security-privacy' },
          { text: 'Market Best Practices', link: '/guide/best-practices' },
          { text: 'Troubleshooting & Logs', link: '/guide/troubleshooting' }
        ]
      },
      {
        text: 'Architecture',
        items: [
          { text: 'Overview', link: '/architecture/overview' },
          { text: 'Workspace Tree (.codernic)', link: '/architecture/workspace-tree' },
          { text: 'Ragtime (Context Engine)', link: '/architecture/ragtime' },
          { text: 'Erathos (Atomos Structura)', link: '/architecture/erathos' },
          { text: 'Pirsig (AST Firewall)', link: '/architecture/pirsig' },
          { text: 'Galileus (Actor System)', link: '/architecture/galileus' }
        ]
      },
      {
        text: 'Frontend Web & UI',
        items: [
          { text: 'Pages & Views', link: '/frontend/pages' },
          { text: 'Dynamic Layout Engine', link: '/frontend/layouts' },
          { text: 'File Editing & Artifacts', link: '/frontend/file-editing' },
          { text: 'Models Hub UI', link: '/frontend/model-hub' }
        ]
      },
      {
        text: 'Enterprise Edition',
        items: [
          { text: 'Installation & Setup', link: '/enterprise/installation' },
          { text: 'Configuration Manager', link: '/enterprise/configuration' },
          { text: 'Cloud Vendors Integration', link: '/enterprise/cloud-vendors' },
          { text: 'Security, SAML & RBAC', link: '/enterprise/security-rbac' },
          { text: 'AST Anonymizer Rules', link: '/enterprise/ast-anonymizer' },
          { text: 'Team LoRA Hubs', link: '/enterprise/lora-hubs' },
          { text: 'Team Synchronization (CRDTs)', link: '/enterprise/team-sync' },
          { text: 'Troubleshooting & Diagnostics', link: '/enterprise/troubleshooting' }
        ]
      },
      {
        text: 'Standalone B2B Services',
        items: [
          { text: 'B2B Overview', link: '/b2b/overview' },
          { text: 'Ragtime Context Server', link: '/b2b/ragtime-server' },
          { text: 'Galileus CI Gatekeeper', link: '/b2b/galileus-ci' },
          { text: 'Pirsig Shield Proxy', link: '/b2b/pirsig-proxy' }
        ]
      },
      {
        text: 'Legal & Compliance',
        items: [
          { text: 'Legal Notice (Impressum)', link: '/legal/impressum' },
          { text: 'Privacy Policy', link: '/legal/privacy-policy' },
          { text: 'Terms of Service', link: '/legal/terms-of-service' },
          { text: 'End-User License Agreement', link: '/legal/eula' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/binaryjack/codernic.dev' }
    ],
    search: {
      provider: 'local'
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-2026 Codernic Team'
    }
  }
})
