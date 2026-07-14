import DefaultTheme from 'vitepress/theme'
import '../../../src/tokens/codernic-theme.css'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    // register custom components or global plugins if needed
  }
}
