import pkg from '../package.json'

export default defineAppConfig({
  ui: {
    colors: {
      primary: 'sky',
      secondary: 'blue',
      neutral: 'mist',
    },

  },
  version: pkg.version,
})
